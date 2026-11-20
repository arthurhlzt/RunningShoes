import 'dotenv/config'
import { PrismaClient, type StatusPedido } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const marcas = ['Olympikus', 'Adidas', 'Nike', 'Asics', 'New Balance', 'Fila']

// foto de exemplo: troque pelas URLs do Cloudinary
const FOTO = 'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg'

const catalogo = [
  { marca: 'Nike', modelo: 'Pegasus 41', preco: 899.9, genero: 'UNISSEX', terreno: 'ASFALTO', distancia: 'DEZ_K', drop: 10, peso: 290 },
  { marca: 'Nike', modelo: 'Vomero 17', preco: 1099.9, genero: 'MASCULINO', terreno: 'ASFALTO', distancia: 'MARATONA', drop: 10, peso: 300 },
  { marca: 'Adidas', modelo: 'Adizero SL2', preco: 799.9, genero: 'UNISSEX', terreno: 'ASFALTO', distancia: 'CINCO_K', drop: 8, peso: 250 },
  { marca: 'Asics', modelo: 'Gel-Nimbus 26', preco: 1299.9, genero: 'FEMININO', terreno: 'ASFALTO', distancia: 'MARATONA', drop: 8, peso: 280 },
  { marca: 'Asics', modelo: 'Trabuco 12', preco: 949.9, genero: 'UNISSEX', terreno: 'TRILHA', distancia: 'DEZ_K', drop: 8, peso: 310 },
  { marca: 'New Balance', modelo: 'Fresh Foam 1080v13', preco: 1199.9, genero: 'UNISSEX', terreno: 'ASFALTO', distancia: 'MARATONA', drop: 6, peso: 275 },
  { marca: 'Olympikus', modelo: 'Corre 3', preco: 349.9, genero: 'UNISSEX', terreno: 'ASFALTO', distancia: 'CINCO_K', drop: 8, peso: 270 },
  { marca: 'Fila', modelo: 'Float Maxxi', preco: 299.9, genero: 'FEMININO', terreno: 'ASFALTO', distancia: 'CINCO_K', drop: 10, peso: 260 },
] as const

const tamanhos = [38, 39, 40, 41, 42, 43]
const cores = ['Preto', 'Branco', 'Azul']

const aleatorio = (n: number) => Math.floor(Math.random() * n)

const enderecos = [
  { telefone: '53999990001', cep: '96010000', logradouro: 'Rua Quinze de Novembro', numero: '100', bairro: 'Centro', cidade: 'Pelotas', uf: 'RS' },
  { telefone: '51999990002', cep: '90010000', logradouro: 'Avenida Borges de Medeiros', numero: '250', bairro: 'Centro Histórico', cidade: 'Porto Alegre', uf: 'RS' },
  { telefone: '53999990003', cep: '96200000', logradouro: 'Rua Marechal Floriano', numero: '45', complemento: 'Casa 2', bairro: 'Centro', cidade: 'Rio Grande', uf: 'RS' },
]

async function main() {
  for (const nome of marcas) {
    await prisma.marca.upsert({ where: { nome }, update: {}, create: { nome } })
  }

  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@loja.com').toLowerCase()
  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      nome: 'Administrador',
      email: adminEmail,
      senha: await bcrypt.hash(process.env.ADMIN_SENHA ?? 'admin123', 12),
    },
  })

  // só popula dados de exemplo se ainda não houver tênis
  if ((await prisma.tenis.count()) > 0) return

  for (const item of catalogo) {
    const marca = await prisma.marca.findUniqueOrThrow({ where: { nome: item.marca } })
    const { marca: _marca, ...dados } = item
    await prisma.tenis.create({
      data: {
        ...dados,
        foto: FOTO,
        marcaId: marca.id,
        pontosFortes: ['Bom amortecimento', 'Cabedal respirável', 'Boa durabilidade'],
        pontosFracos: ['Preço acima da média'],
        amortecimento: 'MEDIO',
        variacoes: {
          create: tamanhos.flatMap((tamanho) =>
            cores.map((cor) => ({ tamanho, cor, quantidade: aleatorio(12) })),
          ),
        },
      },
    })
  }

  // clientes e pedidos de exemplo para a dashboard não ficar vazia
  const senha = await bcrypt.hash('123456', 12)
  const clientes = await Promise.all(
    ['Ana Souza', 'Bruno Lima', 'Carla Dias'].map((nome, i) =>
      prisma.cliente.upsert({
        where: { email: `cliente${i + 1}@teste.com` },
        update: {},
        create: { nome, email: `cliente${i + 1}@teste.com`, senha },
      }),
    ),
  )

  const variacoes = await prisma.variacao.findMany({ include: { tenis: true } })
  const statusPossiveis: StatusPedido[] = ['PENDENTE', 'PAGO', 'PAGO', 'ENVIADO', 'ENVIADO', 'CANCELADO']

  for (let i = 0; i < 40; i++) {
    const data = new Date()
    data.setMonth(data.getMonth() - aleatorio(6))
    data.setDate(1 + aleatorio(27))

    const escolhidas = Array.from({ length: 1 + aleatorio(3) }, () => variacoes[aleatorio(variacoes.length)])
    const itens = escolhidas.map((v) => ({
      variacaoId: v.id,
      quantidade: 1 + aleatorio(2),
      precoUnitario: v.tenis.preco,
    }))
    const total = itens.reduce((soma, it) => soma + Number(it.precoUnitario) * it.quantidade, 0)

    await prisma.pedido.create({
      data: {
        clienteId: clientes[aleatorio(clientes.length)].id,
        status: statusPossiveis[aleatorio(statusPossiveis.length)],
        total,
        ...enderecos[aleatorio(enderecos.length)],
        createdAt: data,
        itens: { create: itens },
      },
    })
  }
}

main()
  .then(() => console.log('Seed concluído.'))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
