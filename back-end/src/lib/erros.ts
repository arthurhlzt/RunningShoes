import type { Response } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'

export class ErroNegocio extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

// Centraliza a resposta de erro de todas as rotas
export function tratarErro(res: Response, error: unknown): void {
  if (error instanceof ErroNegocio) {
    res.status(error.status).json({ erro: error.message })
    return
  }
  if (error instanceof ZodError) {
    const erros = error.issues.map((e) => ({ campo: e.path[0], mensagem: e.message }))
    res.status(400).json({ erros })
    return
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      res.status(409).json({ erro: 'Já existe um registro com esses dados.' })
      return
    }
    if (error.code === 'P2003') {
      res.status(409).json({ erro: 'Referência inválida ou registro vinculado a outros dados.' })
      return
    }
    if (error.code === 'P2025') {
      res.status(404).json({ erro: 'Registro não encontrado.' })
      return
    }
  }
  console.error(error)
  res.status(500).json({ erro: 'Erro interno do servidor.' })
}
