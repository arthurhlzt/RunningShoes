import { Router } from 'express'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import { OAuth2Client } from 'google-auth-library'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { ErroNegocio, tratarErro } from '../lib/erros'
import { gerarToken } from '../middlewares/auth'

const router = Router()

// Protege contra tentativa de adivinhar senha: 20 falhas por IP a cada 15 minutos
const limitarTentativas = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { erro: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
})

const cadastroSchema = z.object({
  nome: z.string().trim().min(3, 'Nome deve ter ao menos 3 caracteres').max(60),
  email: z.string().trim().toLowerCase().email('E-mail inválido').max(100),
  senha: z.string().min(6, 'Senha deve ter ao menos 6 caracteres').max(50),
})

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
})

// Cadastro tradicional de cliente (e-mail + senha)
router.post('/cadastro', limitarTentativas, async (req, res) => {
  /*
    #swagger.tags = ['Autenticação']
    #swagger.summary = 'Cadastra um cliente'
    #swagger.description = 'Cadastro tradicional com e-mail e senha. A senha é salva criptografada.'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: { nome: 'João da Silva', email: 'joao@email.com', senha: '123456' }
    }
    #swagger.responses[201] = { description: 'Cliente cadastrado com sucesso.' }
    #swagger.responses[400] = { description: 'Dados inválidos.' }
    #swagger.responses[409] = { description: 'E-mail já cadastrado.' }
  */
  try {
    const { nome, email, senha } = cadastroSchema.parse(req.body)
    const cliente = await prisma.cliente.create({
      data: { nome, email, senha: await bcrypt.hash(senha, 12) },
      select: { id: true, nome: true, email: true },
    })
    res.status(201).json(cliente)
  } catch (error) {
    tratarErro(res, error)
  }
})

// Login do cliente (e-mail + senha)
router.post('/login', limitarTentativas, async (req, res) => {
  /*
    #swagger.tags = ['Autenticação']
    #swagger.summary = 'Login do cliente'
    #swagger.description = 'Autentica o cliente com e-mail e senha e devolve o token JWT.'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: { email: 'joao@email.com', senha: '123456' }
    }
    #swagger.responses[200] = { description: 'Login realizado. Retorna o token e os dados do cliente.' }
    #swagger.responses[400] = { description: 'Dados inválidos.' }
    #swagger.responses[401] = { description: 'E-mail ou senha incorretos.' }
  */
  try {
    const { email, senha } = loginSchema.parse(req.body)
    const cliente = await prisma.cliente.findUnique({ where: { email } })
    // cliente sem senha entrou só com o Google
    if (!cliente?.senha || !(await bcrypt.compare(senha, cliente.senha))) {
      throw new ErroNegocio(401, 'E-mail ou senha incorretos.')
    }
    const token = gerarToken({ id: cliente.id, tipo: 'CLIENTE' })
    res.json({ token, usuario: { id: cliente.id, nome: cliente.nome, email: cliente.email, tipo: 'CLIENTE' } })
  } catch (error) {
    tratarErro(res, error)
  }
})

// Login do administrador (e-mail + senha)
router.post('/admin/login', limitarTentativas, async (req, res) => {
  /*
    #swagger.tags = ['Autenticação']
    #swagger.summary = 'Login do administrador'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: { email: 'admin@loja.com', senha: 'senha-do-admin' }
    }
    #swagger.responses[200] = { description: 'Login realizado. Retorna o token e os dados do administrador.' }
    #swagger.responses[401] = { description: 'E-mail ou senha incorretos.' }
  */
  try {
    const { email, senha } = loginSchema.parse(req.body)
    const admin = await prisma.admin.findUnique({ where: { email } })
    if (!admin || !(await bcrypt.compare(senha, admin.senha))) {
      throw new ErroNegocio(401, 'E-mail ou senha incorretos.')
    }
    const token = gerarToken({ id: admin.id, tipo: 'ADMIN' })
    res.json({ token, usuario: { id: admin.id, nome: admin.nome, email: admin.email, tipo: 'ADMIN' } })
  } catch (error) {
    tratarErro(res, error)
  }
})

// Login Social: o front envia o ID Token do Google, a API valida e devolve o seu próprio JWT
const googleClient = new OAuth2Client()

router.post('/google', limitarTentativas, async (req, res) => {
  /*
    #swagger.tags = ['Autenticação']
    #swagger.summary = 'Login com Google (OAuth 2.0)'
    #swagger.description = 'Valida o ID Token recebido do Google, cria o cliente se for o primeiro acesso e devolve o JWT da API.'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: { credential: 'ID Token retornado pelo Google' }
    }
    #swagger.responses[200] = { description: 'Login realizado. Retorna o token e os dados do cliente.' }
    #swagger.responses[401] = { description: 'Token do Google inválido.' }
  */
  try {
    const { credential } = z.object({ credential: z.string().min(1) }).parse(req.body)

    // verifica assinatura, emissor (iss), destinatário (aud) e expiração (exp)
    const ticket = await googleClient
      .verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID })
      .catch(() => {
        throw new ErroNegocio(401, 'Token do Google inválido.')
      })
    const dados = ticket.getPayload()
    if (!dados?.sub || !dados.email) throw new ErroNegocio(401, 'Token do Google inválido.')

    const email = dados.email.toLowerCase()
    let cliente = await prisma.cliente.findFirst({
      where: { OR: [{ googleId: dados.sub }, { email }] },
    })

    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: { nome: (dados.name ?? email).slice(0, 60), email, googleId: dados.sub },
      })
    } else if (!cliente.googleId) {
      // já tinha cadastro com e-mail/senha: vincula a conta Google
      cliente = await prisma.cliente.update({ where: { id: cliente.id }, data: { googleId: dados.sub } })
    }

    const token = gerarToken({ id: cliente.id, tipo: 'CLIENTE' })
    res.json({ token, usuario: { id: cliente.id, nome: cliente.nome, email: cliente.email, tipo: 'CLIENTE' } })
  } catch (error) {
    tratarErro(res, error)
  }
})

export default router
