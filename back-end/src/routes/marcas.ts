import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { tratarErro } from '../lib/erros'
import { apenasAdmin, autenticar } from '../middlewares/auth'

const router = Router()

const marcaSchema = z.object({
  nome: z.string().trim().min(2, 'Nome deve ter ao menos 2 caracteres').max(30),
})

router.get('/', async (_req, res) => {
  /*
    #swagger.tags = ['Marcas']
  */
  try {
    const marcas = await prisma.marca.findMany({ orderBy: { nome: 'asc' } })
    res.json(marcas)
  } catch (error) {
    tratarErro(res, error)
  }
})

router.post('/', autenticar, apenasAdmin, async (req, res) => {
  /*
    #swagger.tags = ['Marcas']
    #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const { nome } = marcaSchema.parse(req.body)
    res.status(201).json(await prisma.marca.create({ data: { nome } }))
  } catch (error) {
    tratarErro(res, error)
  }
})

router.put('/:id', autenticar, apenasAdmin, async (req, res) => {
  /*
    #swagger.tags = ['Marcas']
    #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const { nome } = marcaSchema.parse(req.body)
    res.json(await prisma.marca.update({ where: { id: Number(req.params.id) }, data: { nome } }))
  } catch (error) {
    tratarErro(res, error)
  }
})

// Falha com 409 se a marca ainda tiver tênis (chave estrangeira)
router.delete('/:id', autenticar, apenasAdmin, async (req, res) => {
  /*
    #swagger.tags = ['Marcas']
    #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    await prisma.marca.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  } catch (error) {
    tratarErro(res, error)
  }
})

export default router
