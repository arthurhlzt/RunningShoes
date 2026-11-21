import { Router } from 'express'
import { Prisma, StatusPedido } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { ErroNegocio, tratarErro } from '../lib/erros'
import { apenasAdmin, apenasCliente, autenticar } from '../middlewares/auth'

const router = Router()

// mantém só os dígitos (aceita "(53) 99999-9999", "96010-000" etc.)
const soDigitos = (v: string) => v.replace(/\D/g, '')

const entregaSchema = z.object({
  telefone: z.string().transform(soDigitos).pipe(z.string().regex(/^\d{10,11}$/, 'Telefone deve ter DDD + 8 ou 9 dígitos')),
  cep: z.string().transform(soDigitos).pipe(z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos')),
  logradouro: z.string().trim().min(3, 'Informe o logradouro').max(100),
  numero: z.string().trim().min(1, 'Informe o número').max(10),
  complemento: z.string().trim().max(50).optional().transform((v) => v || undefined),
  bairro: z.string().trim().min(2, 'Informe o bairro').max(60),
  cidade: z.string().trim().min(2, 'Informe a cidade').max(60),
  uf: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, 'UF deve ter 2 letras'),
})

const pedidoSchema = z.object({
  entrega: entregaSchema,
  itens: z
    .array(
      z.object({
        variacaoId: z.number().int().positive(),
        quantidade: z.number().int().min(1, 'Quantidade mínima é 1'),
      }),
    )
    .min(1, 'O pedido precisa ter ao menos um item'),
})

const incluirItens = {
  itens: { include: { variacao: { include: { tenis: { include: { marca: true } } } } } },
} satisfies Prisma.PedidoInclude

// Pagamento simulado: o admin só avança o status
const proximoStatus: Partial<Record<StatusPedido, StatusPedido>> = {
  PENDENTE: 'PAGO',
  PAGO: 'ENVIADO',
}

// Cria o pedido e baixa o estoque na mesma transação (tudo ou nada)
router.post('/', autenticar, apenasCliente, async (req, res) => {
  /*
    #swagger.tags = ['Pedidos']
    #swagger.summary = 'Cria um pedido'
    #swagger.description = 'Cria o pedido do cliente logado com o endereço de entrega e baixa o estoque de cada variação (tamanho/cor) em uma transação. Se faltar estoque em qualquer item, nada é gravado.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        itens: [{ variacaoId: 1, quantidade: 2 }],
        entrega: {
          telefone: '53999998888',
          cep: '96010000',
          logradouro: 'Rua Quinze de Novembro',
          numero: '100',
          complemento: 'Apto 12',
          bairro: 'Centro',
          cidade: 'Pelotas',
          uf: 'RS'
        }
      }
    }
    #swagger.responses[201] = { description: 'Pedido criado com status PENDENTE.' }
    #swagger.responses[400] = { description: 'Dados inválidos.' }
    #swagger.responses[401] = { description: 'Não autenticado.' }
    #swagger.responses[404] = { description: 'Variação não encontrada.' }
    #swagger.responses[409] = { description: 'Estoque insuficiente.' }
  */
  try {
    const { itens, entrega } = pedidoSchema.parse(req.body)

    // junta linhas repetidas da mesma variação
    const quantidades = new Map<number, number>()
    for (const item of itens) {
      quantidades.set(item.variacaoId, (quantidades.get(item.variacaoId) ?? 0) + item.quantidade)
    }

    const pedido = await prisma.$transaction(async (tx) => {
      let total = new Prisma.Decimal(0)
      const itensData: { variacaoId: number; quantidade: number; precoUnitario: Prisma.Decimal }[] = []

      for (const [variacaoId, quantidade] of quantidades) {
        const variacao = await tx.variacao.findUnique({
          where: { id: variacaoId },
          include: { tenis: true },
        })
        if (!variacao) throw new ErroNegocio(404, `Variação ${variacaoId} não encontrada.`)

        if (!variacao.tenis.ativo) throw new ErroNegocio(409, 'Este tênis saiu do catálogo.')

        // baixa condicional: só decrementa se houver estoque suficiente
        const baixa = await tx.variacao.updateMany({
          where: { id: variacaoId, tenis: { ativo: true }, quantidade: { gte: quantidade } },
          data: { quantidade: { decrement: quantidade } },
        })
        if (baixa.count === 0) {
          throw new ErroNegocio(
            409,
            `Estoque insuficiente para ${variacao.tenis.modelo} (tam. ${variacao.tamanho}, ${variacao.cor}).`,
          )
        }

        const precoUnitario = variacao.tenis.preco
        total = total.add(precoUnitario.mul(quantidade))
        itensData.push({ variacaoId, quantidade, precoUnitario })
      }

      return tx.pedido.create({
        data: { clienteId: req.usuario!.id, total, ...entrega, itens: { create: itensData } },
        include: incluirItens,
      })
    })

    res.status(201).json(pedido)
  } catch (error) {
    tratarErro(res, error)
  }
})

// Pedidos do cliente logado
router.get('/meus', autenticar, apenasCliente, async (req, res) => {
  /*
    #swagger.tags = ['Pedidos']
    #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const pedidos = await prisma.pedido.findMany({
      where: { clienteId: req.usuario!.id },
      include: incluirItens,
      orderBy: { createdAt: 'desc' },
    })
    res.json(pedidos)
  } catch (error) {
    tratarErro(res, error)
  }
})

// Todos os pedidos (admin), com filtro opcional por status
router.get('/', autenticar, apenasAdmin, async (req, res) => {
  /*
    #swagger.tags = ['Pedidos']
    #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const { status } = z
      .object({ status: z.enum(['PENDENTE', 'PAGO', 'ENVIADO', 'CANCELADO']).optional() })
      .parse(req.query)
    const pedidos = await prisma.pedido.findMany({
      where: { status },
      include: { ...incluirItens, cliente: { select: { id: true, nome: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(pedidos)
  } catch (error) {
    tratarErro(res, error)
  }
})

router.get('/:id', autenticar, async (req, res) => {
  /*
    #swagger.tags = ['Pedidos']
    #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: Number(req.params.id) },
      include: incluirItens,
    })
    if (!pedido) throw new ErroNegocio(404, 'Pedido não encontrado.')
    // cliente só enxerga o próprio pedido
    if (req.usuario!.tipo === 'CLIENTE' && pedido.clienteId !== req.usuario!.id) {
      throw new ErroNegocio(404, 'Pedido não encontrado.')
    }
    res.json(pedido)
  } catch (error) {
    tratarErro(res, error)
  }
})

// Admin avança o status: PENDENTE -> PAGO -> ENVIADO (pagamento simulado)
router.patch('/:id/status', autenticar, apenasAdmin, async (req, res) => {
  /*
    #swagger.tags = ['Pedidos']
    #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const pedido = await prisma.pedido.findUnique({ where: { id: Number(req.params.id) } })
    if (!pedido) throw new ErroNegocio(404, 'Pedido não encontrado.')

    const novo = proximoStatus[pedido.status]
    if (!novo) throw new ErroNegocio(409, `Pedido ${pedido.status} não pode avançar de status.`)

    const atualizado = await prisma.pedido.updateMany({
      where: { id: pedido.id, status: pedido.status },
      data: { status: novo },
    })
    if (atualizado.count === 0) {
      throw new ErroNegocio(409, 'O status do pedido mudou. Atualize a página e tente novamente.')
    }
    res.json({ ...pedido, status: novo })
  } catch (error) {
    tratarErro(res, error)
  }
})

// Cancela o pedido e devolve o estoque das variações (mesma transação)
router.patch('/:id/cancelar', autenticar, async (req, res) => {
  /*
    #swagger.tags = ['Pedidos']
    #swagger.summary = 'Cancela um pedido'
    #swagger.description = 'Cancela pedidos PENDENTE ou PAGO e devolve o estoque das variações. O cliente só cancela o próprio pedido; o administrador cancela qualquer um.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', description: 'Código do pedido' }
    #swagger.responses[200] = { description: 'Pedido cancelado e estoque devolvido.' }
    #swagger.responses[401] = { description: 'Não autenticado.' }
    #swagger.responses[404] = { description: 'Pedido não encontrado.' }
    #swagger.responses[409] = { description: 'Pedido não pode mais ser cancelado.' }
  */
  try {
    const id = Number(req.params.id)

    const cancelado = await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({ where: { id }, include: { itens: true } })
      if (!pedido) throw new ErroNegocio(404, 'Pedido não encontrado.')
      if (req.usuario!.tipo === 'CLIENTE' && pedido.clienteId !== req.usuario!.id) {
        throw new ErroNegocio(404, 'Pedido não encontrado.')
      }
      const transicao = await tx.pedido.updateMany({
        where: { id, status: { in: ['PENDENTE', 'PAGO'] } },
        data: { status: 'CANCELADO' },
      })
      if (transicao.count === 0) {
        throw new ErroNegocio(409, 'O pedido não pode mais ser cancelado.')
      }

      for (const item of pedido.itens) {
        await tx.variacao.update({
          where: { id: item.variacaoId },
          data: { quantidade: { increment: item.quantidade } },
        })
      }
      return tx.pedido.findUniqueOrThrow({ where: { id }, include: incluirItens })
    })

    res.json(cancelado)
  } catch (error) {
    tratarErro(res, error)
  }
})

export default router
