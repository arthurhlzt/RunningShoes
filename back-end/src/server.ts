import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import helmet from 'helmet'
import multer from 'multer'
import swaggerUi from 'swagger-ui-express'
import { ErroNegocio } from './lib/erros'
import authRoutes from './routes/auth'
import dashboardRoutes from './routes/dashboard'
import marcaRoutes from './routes/marcas'
import pedidoRoutes from './routes/pedidos'
import tenisRoutes from './routes/tenis'
import variacaoRoutes from './routes/variacoes'

const app = express()

// atrás do proxy do Render, para o limite de tentativas enxergar o IP real do cliente
app.set('trust proxy', 1)

// /docs fica antes do helmet: o CSP padrão do helmet bloqueia os recursos do Swagger UI
// Documentação Swagger (gerada com: npm run swagger)
const swaggerPath = path.resolve(process.cwd(), 'swagger-output.json')
if (fs.existsSync(swaggerPath)) {
  const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf-8'))
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
}

// cabeçalhos de segurança (CORP liberado para o front em outra origem consumir a API)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: process.env.FRONT_URL?.split(',') ?? 'http://localhost:5173' }))
app.use(express.json())

app.get('/', (_req, res) => {
  res.json({ api: 'Loja de Tênis de Corrida', docs: '/docs' })
})

app.use('/auth', authRoutes)
app.use('/marcas', marcaRoutes)
app.use('/tenis', tenisRoutes)
app.use('/', variacaoRoutes)
app.use('/pedidos', pedidoRoutes)
app.use('/dashboard', dashboardRoutes)

// Erros lançados fora das rotas (ex.: filtro de arquivo do Multer)
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ErroNegocio) {
    res.status(error.status).json({ erro: error.message })
    return
  }
  if (error instanceof multer.MulterError) {
    res.status(400).json({ erro: `Erro no upload: ${error.message}` })
    return
  }
  console.error(error)
  res.status(500).json({ erro: 'Erro interno do servidor.' })
})

const porta = Number(process.env.PORT) || 3000
app.listen(porta, () => {
  console.log(`Servidor rodando na porta ${porta}`)
})
