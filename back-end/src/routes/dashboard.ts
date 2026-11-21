import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { tratarErro } from '../lib/erros'
import { apenasAdmin, autenticar } from '../middlewares/auth'

const router = Router()
router.use(autenticar, apenasAdmin)

// Vendas contabilizam pedidos pagos e enviados pelo mês de criação.
async function vendasPorMes() {
  return prisma.$queryRaw<{ mes: string; faturamento: number; pedidos: number }[]>`
    SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS mes,
           SUM(total)::float AS faturamento,
           COUNT(*)::int AS pedidos
    FROM pedidos
    WHERE status IN ('PAGO', 'ENVIADO')
    GROUP BY 1
    ORDER BY 1`
}

async function vendasPorMarca() {
  return prisma.$queryRaw<{ marca: string; unidades: number; faturamento: number }[]>`
    SELECT m.nome AS marca,
           SUM(ip.quantidade)::int AS unidades,
           SUM(ip.quantidade * ip."precoUnitario")::float AS faturamento
    FROM itens_pedido ip
    JOIN pedidos p ON p.id = ip."pedidoId"
    JOIN variacoes v ON v.id = ip."variacaoId"
    JOIN tenis t ON t.id = v."tenisId"
    JOIN marcas m ON m.id = t."marcaId"
    WHERE p.status IN ('PAGO', 'ENVIADO')
    GROUP BY m.nome
    ORDER BY faturamento DESC`
}

async function maisVendidos(limite: number) {
  return prisma.$queryRaw<{ id: number; modelo: string; marca: string; unidades: number }[]>`
    SELECT t.id, t.modelo, m.nome AS marca, SUM(ip.quantidade)::int AS unidades
    FROM itens_pedido ip
    JOIN pedidos p ON p.id = ip."pedidoId"
    JOIN variacoes v ON v.id = ip."variacaoId"
    JOIN tenis t ON t.id = v."tenisId"
    JOIN marcas m ON m.id = t."marcaId"
    WHERE p.status IN ('PAGO', 'ENVIADO')
    GROUP BY t.id, t.modelo, m.nome
    ORDER BY unidades DESC
    LIMIT ${limite}`
}

async function estoqueBaixo(limite: number) {
  const variacoes = await prisma.variacao.findMany({
    where: { quantidade: { lte: limite }, tenis: { ativo: true } },
    include: { tenis: { include: { marca: true } } },
    orderBy: [{ quantidade: 'asc' }, { tenisId: 'asc' }],
    take: 20,
  })
  return variacoes.map((v) => ({
    variacaoId: v.id,
    marca: v.tenis.marca.nome,
    modelo: v.tenis.modelo,
    tamanho: v.tamanho,
    cor: v.cor,
    quantidade: v.quantidade,
  }))
}

async function pedidosPorStatus() {
  const grupos = await prisma.pedido.groupBy({ by: ['status'], _count: { _all: true } })
  return grupos.map((g) => ({ status: g.status, quantidade: g._count._all }))
}

// Todos os dados da dashboard em uma única chamada
router.get('/', async (req, res) => {
  /*
    #swagger.tags = ['Dashboard']
    #swagger.summary = 'Dados da dashboard do administrador'
    #swagger.description = 'Retorna faturamento por mês, vendas por marca, tênis mais vendidos, estoque baixo por variação e pedidos por status.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['limiteEstoque'] = { in: 'query', required: false, type: 'integer', description: 'Considera estoque baixo até esta quantidade (padrão 3)' }
    #swagger.responses[200] = { description: 'Dados para os gráficos.' }
    #swagger.responses[401] = { description: 'Não autenticado.' }
    #swagger.responses[403] = { description: 'Acesso restrito ao administrador.' }
  */
  try {
    const { limiteEstoque } = z
      .object({ limiteEstoque: z.coerce.number().int().min(0).default(3) })
      .parse(req.query)

    const [mensal, marcas, top, baixo, status] = await Promise.all([
      vendasPorMes(),
      vendasPorMarca(),
      maisVendidos(10),
      estoqueBaixo(limiteEstoque),
      pedidosPorStatus(),
    ])

    res.json({
      vendasPorMes: mensal,
      vendasPorMarca: marcas,
      maisVendidos: top,
      estoqueBaixo: baixo,
      pedidosPorStatus: status,
    })
  } catch (error) {
    tratarErro(res, error)
  }
})

export default router
