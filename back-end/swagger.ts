import fs from 'node:fs'
import swaggerAutogen from 'swagger-autogen'

const doc = {
  info: {
    title: 'API Loja de Tênis de Corrida',
    description: 'Estoque e venda de tênis de corrida (Olympikus, Adidas, Nike, Asics, New Balance e Fila)',
    version: '1.0.0',
  },
  // em produção, troque pela URL do Render
  servers: [{ url: '/' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
}

const outputFile = './swagger-output.json'

// Arquivo principal que registra as rotas
const routes = ['./src/server.ts']

// O swagger-autogen mantém `in: 'body'` (sintaxe do OpenAPI 2). No OpenAPI 3 o corpo da
// requisição é `requestBody`, então convertemos depois de gerar, para o Swagger UI mostrar o JSON.
type Operacao = { parameters?: { in: string; required?: boolean; schema?: unknown }[]; requestBody?: unknown }

swaggerAutogen({ openapi: '3.0.0' })(outputFile, routes, doc).then(() => {
  const spec = JSON.parse(fs.readFileSync(outputFile, 'utf-8')) as { paths: Record<string, Record<string, Operacao>> }

  for (const caminho of Object.values(spec.paths)) {
    for (const operacao of Object.values(caminho)) {
      const corpo = operacao.parameters?.find((p) => p.in === 'body')
      if (!corpo) continue
      operacao.requestBody = { required: !!corpo.required, content: { 'application/json': { schema: corpo.schema } } }
      operacao.parameters = operacao.parameters!.filter((p) => p.in !== 'body')
      if (operacao.parameters.length === 0) delete operacao.parameters
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(spec, null, 2))
})
