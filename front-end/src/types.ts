export type Genero = 'MASCULINO' | 'FEMININO' | 'UNISSEX'
export type Terreno = 'ASFALTO' | 'TRILHA'
export type Distancia = 'CINCO_K' | 'DEZ_K' | 'MARATONA'
export type StatusPedido = 'PENDENTE' | 'PAGO' | 'ENVIADO' | 'CANCELADO'

export interface Usuario {
  id: string
  nome: string
  email: string
  tipo: 'CLIENTE' | 'ADMIN'
}

export interface Marca {
  id: number
  nome: string
}

export interface Variacao {
  id: number
  tamanho: number
  cor: string
  quantidade: number
  tenisId: number
}

export interface Tenis {
  id: number
  modelo: string
  preco: string // Decimal do Prisma chega como string no JSON
  genero: Genero
  terreno: Terreno
  distancia: Distancia
  drop: number
  peso: number
  foto: string
  fotosPorCor?: Record<string, string>
  pontosFortes: string[]
  pontosFracos: string[]
  amortecimento: string | null
  marcaId: number
  marca: Marca
  variacoes: Variacao[]
}

export interface ItemPedido {
  id: number
  quantidade: number
  precoUnitario: string
  variacaoId: number
  variacao: Variacao & { tenis: Tenis }
}

export interface Entrega {
  telefone: string
  cep: string
  logradouro: string
  numero: string
  complemento?: string | null
  bairro: string
  cidade: string
  uf: string
}

export interface Pedido extends Entrega {
  id: number
  status: StatusPedido
  total: string
  createdAt: string
  clienteId: string
  itens: ItemPedido[]
  cliente?: { id: string; nome: string; email: string }
}

export interface RespostaLogin {
  token: string
  usuario: Usuario
}
