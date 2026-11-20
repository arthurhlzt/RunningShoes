import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCarrinho } from '../context/CarrinhoContext'
import { brl } from '../lib/format'

export default function Carrinho() {
  const { itens, total, alterarQuantidade, remover, limpar } = useCarrinho()
  const { usuario } = useAuth()
  const navigate = useNavigate()

  function continuar() {
    if (!usuario) {
      navigate('/login', { state: { de: '/checkout' } })
      return
    }
    navigate('/checkout')
  }

  if (itens.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="titulo text-4xl">Carrinho</h1>
        <p className="text-asfalto">Seu carrinho está vazio.</p>
        <Link to="/" className="btn-primario">
          Escolher um tênis
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="titulo text-4xl">Carrinho</h1>
      <ul className="divide-y divide-linha rounded-sm border border-linha bg-papel">
        {itens.map((i) => (
          <li key={i.variacaoId} className="flex flex-wrap items-center gap-4 p-4">
            <img src={i.foto} alt="" className="h-20 w-20 rounded-sm bg-white object-contain" />
            <div className="min-w-40 flex-1">
              <Link to={`/tenis/${i.tenisId}`} className="titulo text-xl hover:text-raia">
                {i.marca} {i.modelo}
              </Link>
              <p className="text-sm text-asfalto">
                Tamanho {i.tamanho} &nbsp;|&nbsp; {i.cor}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button aria-label="Diminuir quantidade" className="btn-contorno btn-pequeno" onClick={() => alterarQuantidade(i.variacaoId, i.quantidade - 1)} disabled={i.quantidade <= 1}>
                −
              </button>
              <span className="w-6 text-center font-medium" aria-live="polite">
                {i.quantidade}
              </span>
              <button aria-label="Aumentar quantidade" className="btn-contorno btn-pequeno" onClick={() => alterarQuantidade(i.variacaoId, i.quantidade + 1)} disabled={i.quantidade >= i.estoque}>
                +
              </button>
            </div>
            <p className="w-28 text-right font-semibold">{brl(i.preco * i.quantidade)}</p>
            <button onClick={() => remover(i.variacaoId)} className="text-sm text-asfalto underline hover:text-alerta">
              Remover
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button onClick={limpar} className="text-sm text-asfalto underline">
          Esvaziar carrinho
        </button>
        <div className="text-right">
          <p className="text-asfalto">Total</p>
          <p className="titulo text-4xl">{brl(total)}</p>
        </div>
      </div>

      <button onClick={continuar} className="btn-primario w-full py-3 text-lg md:w-auto">
        {usuario ? 'Continuar para a entrega' : 'Entrar para continuar'}
      </button>
    </div>
  )
}
