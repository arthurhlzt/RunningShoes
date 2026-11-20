import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export interface ItemCarrinho {
  variacaoId: number
  tenisId: number
  modelo: string
  marca: string
  foto: string
  tamanho: number
  cor: string
  preco: number
  quantidade: number
  estoque: number // limite de unidades disponíveis quando foi adicionado
}

interface CarrinhoContextValue {
  itens: ItemCarrinho[]
  total: number
  quantidadeTotal: number
  adicionar: (item: Omit<ItemCarrinho, 'quantidade'>) => void
  alterarQuantidade: (variacaoId: number, quantidade: number) => void
  remover: (variacaoId: number) => void
  limpar: () => void
}

const CarrinhoContext = createContext<CarrinhoContextValue | null>(null)

function lerCarrinho(): ItemCarrinho[] {
  try {
    const bruto = localStorage.getItem('carrinho')
    return bruto ? (JSON.parse(bruto) as ItemCarrinho[]) : []
  } catch {
    return []
  }
}

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>(lerCarrinho)

  // Mantém o LocalStorage sincronizado a cada mudança
  useEffect(() => {
    localStorage.setItem('carrinho', JSON.stringify(itens))
  }, [itens])

  function adicionar(novo: Omit<ItemCarrinho, 'quantidade'>) {
    setItens((atual) => {
      const existente = atual.find((i) => i.variacaoId === novo.variacaoId)
      if (!existente) return [...atual, { ...novo, quantidade: 1 }]
      return atual.map((i) =>
        i.variacaoId === novo.variacaoId
          ? { ...i, estoque: novo.estoque, quantidade: Math.min(i.quantidade + 1, novo.estoque) }
          : i,
      )
    })
  }

  function alterarQuantidade(variacaoId: number, quantidade: number) {
    setItens((atual) =>
      atual.map((i) =>
        i.variacaoId === variacaoId ? { ...i, quantidade: Math.max(1, Math.min(quantidade, i.estoque)) } : i,
      ),
    )
  }

  const remover = (variacaoId: number) => setItens((atual) => atual.filter((i) => i.variacaoId !== variacaoId))
  const limpar = () => setItens([])

  const total = itens.reduce((soma, i) => soma + i.preco * i.quantidade, 0)
  const quantidadeTotal = itens.reduce((soma, i) => soma + i.quantidade, 0)

  return (
    <CarrinhoContext.Provider value={{ itens, total, quantidadeTotal, adicionar, alterarQuantidade, remover, limpar }}>
      {children}
    </CarrinhoContext.Provider>
  )
}

export function useCarrinho() {
  const contexto = useContext(CarrinhoContext)
  if (!contexto) throw new Error('useCarrinho deve ser usado dentro de CarrinhoProvider')
  return contexto
}
