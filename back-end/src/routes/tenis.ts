import { Router } from 'express'
import multer from 'multer'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { ErroNegocio, tratarErro } from '../lib/erros'
import { apenasAdmin, autenticar } from '../middlewares/auth'
import { uploadParaCloudinary } from '../services/cloudinaryService'
import { buscarDadosComGemini, type DadosIA } from '../services/iaService'

const router = Router()

// A foto fica em memória (buffer) e segue direto para o Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new ErroNegocio(400, 'O arquivo enviado precisa ser uma imagem.'))
  },
})

const generos = ['MASCULINO', 'FEMININO', 'UNISSEX'] as const
const terrenos = ['ASFALTO', 'TRILHA'] as const
const distancias = ['CINCO_K', 'DEZ_K', 'MARATONA'] as const

// multipart/form-data entrega tudo como texto, por isso z.coerce nos números
const tenisSchema = z.object({
  modelo: z.string().trim().min(2, 'Modelo deve ter ao menos 2 caracteres').max(60),
  preco: z.coerce.number().positive('Preço deve ser maior que zero'),
  genero: z.enum(generos),
  terreno: z.enum(terrenos),
  distancia: z.enum(distancias),
  drop: z.coerce.number().min(0).max(20),
  peso: z.coerce.number().int().positive('Peso (g) deve ser maior que zero'),
  marcaId: z.coerce.number().int().positive(),
})

const filtroSchema = z.object({
  marcaId: z.coerce.number().int().optional(),
  genero: z.enum(generos).optional(),
  terreno: z.enum(terrenos).optional(),
  distancia: z.enum(distancias).optional(),
  busca: z.string().trim().optional(),
})

// Consulta a IA sem derrubar o cadastro: se falhar, devolve null
async function consultarIA(marca: string, modelo: string): Promise<DadosIA | null> {
  try {
    return await buscarDadosComGemini(marca, modelo)
  } catch (erroIA) {
    console.log('Falha ao consultar o Gemini:', (erroIA as Error).message)
    return null
  }
}

// Vitrine (pública): lista com filtros
router.get('/', async (req, res) => {
  /*
    #swagger.tags = ['Tênis']
    #swagger.summary = 'Lista os tênis (vitrine)'
    #swagger.description = 'Retorna os tênis com marca e variações em estoque. Aceita filtros opcionais.'
    #swagger.parameters['marcaId'] = { in: 'query', required: false, type: 'integer', description: 'Código da marca' }
    #swagger.parameters['genero'] = { in: 'query', required: false, type: 'string', description: 'MASCULINO, FEMININO ou UNISSEX' }
    #swagger.parameters['terreno'] = { in: 'query', required: false, type: 'string', description: 'ASFALTO ou TRILHA' }
    #swagger.parameters['distancia'] = { in: 'query', required: false, type: 'string', description: 'CINCO_K, DEZ_K ou MARATONA' }
    #swagger.parameters['busca'] = { in: 'query', required: false, type: 'string', description: 'Parte do modelo' }
    #swagger.responses[200] = { description: 'Lista de tênis.' }
  */
  try {
    const { busca, ...filtros } = filtroSchema.parse(req.query)
    const where: Prisma.TenisWhereInput = { ativo: true, ...filtros }
    if (busca) where.modelo = { contains: busca, mode: 'insensitive' }

    const tenis = await prisma.tenis.findMany({
      where,
      include: { marca: true, variacoes: { orderBy: [{ tamanho: 'asc' }, { cor: 'asc' }] } },
      orderBy: [{ marca: { nome: 'asc' } }, { modelo: 'asc' }, { id: 'asc' }],
    })
    res.json(tenis)
  } catch (error) {
    tratarErro(res, error)
  }
})

router.get('/:id', async (req, res) => {
  /*
    #swagger.tags = ['Tênis']
  */
  try {
    const tenis = await prisma.tenis.findUnique({
      where: { id: Number(req.params.id) },
      include: { marca: true, variacoes: { orderBy: [{ tamanho: 'asc' }, { cor: 'asc' }] } },
    })
    if (!tenis?.ativo) throw new ErroNegocio(404, 'Tênis não encontrado.')
    res.json(tenis)
  } catch (error) {
    tratarErro(res, error)
  }
})

// Cadastro (admin): foto -> Cloudinary, dados complementares -> Gemini, tudo salvo no banco
router.post('/', autenticar, apenasAdmin, upload.single('foto'), async (req, res) => {
  /*
    #swagger.tags = ['Tênis']
    #swagger.summary = 'Cadastra um tênis'
    #swagger.description = 'Recebe os dados em multipart/form-data com a foto. A foto vai para o Cloudinary e a IA (Gemini) completa pontos fortes/fracos e amortecimento. Se a IA falhar, o tênis é salvo sem esses dados.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.requestBody = {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['foto', 'modelo', 'preco', 'genero', 'terreno', 'distancia', 'drop', 'peso', 'marcaId'],
            properties: {
              foto: { type: 'string', format: 'binary', description: 'Foto do tênis (imagem até 5 MB)' },
              modelo: { type: 'string', example: 'Pegasus 41' },
              preco: { type: 'number', example: 899.9 },
              genero: { type: 'string', enum: ['MASCULINO', 'FEMININO', 'UNISSEX'] },
              terreno: { type: 'string', enum: ['ASFALTO', 'TRILHA'] },
              distancia: { type: 'string', enum: ['CINCO_K', 'DEZ_K', 'MARATONA'] },
              drop: { type: 'number', description: 'Drop em mm', example: 10 },
              peso: { type: 'integer', description: 'Peso em gramas', example: 290 },
              marcaId: { type: 'integer', example: 1 }
            }
          }
        }
      }
    }
    #swagger.responses[201] = { description: 'Tênis cadastrado.' }
    #swagger.responses[400] = { description: 'Dados inválidos ou foto não enviada.' }
    #swagger.responses[401] = { description: 'Não autenticado.' }
    #swagger.responses[403] = { description: 'Acesso restrito ao administrador.' }
    #swagger.responses[404] = { description: 'Marca não encontrada.' }
  */
  try {
    if (!req.file) throw new ErroNegocio(400, 'Foto é obrigatória.')
    const dados = tenisSchema.parse(req.body)

    const marca = await prisma.marca.findUnique({ where: { id: dados.marcaId } })
    if (!marca) throw new ErroNegocio(404, 'Marca não encontrada.')

    const foto = await uploadParaCloudinary(req.file.buffer)
    const ia = await consultarIA(marca.nome, dados.modelo)

    const tenis = await prisma.tenis.create({
      data: { ...dados, foto, ...(ia ?? {}) },
      include: { marca: true },
    })
    res.status(201).json(tenis)
  } catch (error) {
    tratarErro(res, error)
  }
})

// Edição (admin): a foto é opcional
router.put('/:id', autenticar, apenasAdmin, upload.single('foto'), async (req, res) => {
  /*
    #swagger.tags = ['Tênis']
    #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const dados = tenisSchema.parse(req.body)
    const foto = req.file ? await uploadParaCloudinary(req.file.buffer) : undefined
    const tenis = await prisma.tenis.update({
      where: { id: Number(req.params.id) },
      data: { ...dados, ...(foto ? { foto } : {}) },
      include: { marca: true },
    })
    res.json(tenis)
  } catch (error) {
    tratarErro(res, error)
  }
})

// Refaz a consulta à IA (útil quando ela falhou no cadastro)
router.post('/:id/reconsultar-ia', autenticar, apenasAdmin, async (req, res) => {
  /*
    #swagger.tags = ['Tênis']
    #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const tenis = await prisma.tenis.findUnique({
      where: { id: Number(req.params.id) },
      include: { marca: true },
    })
    if (!tenis) throw new ErroNegocio(404, 'Tênis não encontrado.')

    const ia = await consultarIA(tenis.marca.nome, tenis.modelo)
    if (!ia) throw new ErroNegocio(502, 'Não foi possível consultar a IA agora. Tente novamente.')

    res.json(await prisma.tenis.update({ where: { id: tenis.id }, data: ia, include: { marca: true } }))
  } catch (error) {
    tratarErro(res, error)
  }
})

// Falha com 409 se o tênis já tiver sido vendido (itens de pedido)
router.delete('/:id', autenticar, apenasAdmin, async (req, res) => {
  /*
    #swagger.tags = ['Tênis']
    #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    await prisma.tenis.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  } catch (error) {
    tratarErro(res, error)
  }
})

export default router
