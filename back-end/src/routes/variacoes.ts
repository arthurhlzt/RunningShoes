import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { tratarErro } from '../lib/erros'
import { apenasAdmin, autenticar } from '../middlewares/auth'

const router = Router()

const variacaoSchema = z.object({
  tamanho: z.number().int().min(30, 'Tamanho mínimo é 30').max(50, 'Tamanho máximo é 50'),
  cor: z.string().trim().min(2).max(30),
  quantidade: z.number().int().min(0, 'Quantidade não pode ser negativa'),
})

// Cadastra uma variação (tamanho + cor) com a quantidade inicial em estoque
router.post('/tenis/:tenisId/variacoes', autenticar, apenasAdmin, async (req, res) => {
  /*
    #swagger.tags = ['Estoque']
    #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const dados = variacaoSchema.parse(req.body)
    const variacao = await prisma.variacao.create({
      data: { ...dados, tenisId: Number(req.params.tenisId) },
    })
    res.status(201).json(variacao)
  } catch (error) {
    tratarErro(res, error)
  }
})

// Ajuste de estoque / correção da variação
router.put('/variacoes/:id', autenticar, apenasAdmin, async (req, res) => {
  /*
    #swagger.tags = ['Estoque']
    #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const dados = variacaoSchema.parse(req.body)
    res.json(await prisma.variacao.update({ where: { id: Number(req.params.id) }, data: dados }))
  } catch (error) {
    tratarErro(res, error)
  }
})

// Falha com 409 se a variação já tiver sido vendida
router.delete('/variacoes/:id', autenticar, apenasAdmin, async (req, res) => {
  /*
    #swagger.tags = ['Estoque']
    #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    await prisma.variacao.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  } catch (error) {
    tratarErro(res, error)
  }
})

export default router
