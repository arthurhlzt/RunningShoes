import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

export interface Payload {
  id: string
  tipo: 'CLIENTE' | 'ADMIN'
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: Payload
    }
  }
}

export function gerarToken(payload: Payload): string {
  return jwt.sign(payload, process.env.JWT_KEY as string, { expiresIn: '8h' })
}

export function autenticar(req: Request, res: Response, next: NextFunction): void {
  const authorization = req.headers.authorization
  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({ erro: 'Token não informado.' })
    return
  }
  try {
    const token = authorization.slice(7)
    req.usuario = jwt.verify(token, process.env.JWT_KEY as string) as Payload
    next()
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado.' })
  }
}

export function apenasAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.usuario?.tipo !== 'ADMIN') {
    res.status(403).json({ erro: 'Acesso restrito ao administrador.' })
    return
  }
  next()
}

export function apenasCliente(req: Request, res: Response, next: NextFunction): void {
  if (req.usuario?.tipo !== 'CLIENTE') {
    res.status(403).json({ erro: 'Acesso restrito a clientes.' })
    return
  }
  next()
}
