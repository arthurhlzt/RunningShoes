import { useLocation, useNavigate } from 'react-router-dom'

export default function BotaoVoltar({ painel = false }: { painel?: boolean }) {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const temHistorico = Number(window.history.state?.idx) > 0
  const inicio = pathname === '/' && !search

  if (inicio && !temHistorico) return null

  const destino = painel && pathname !== '/admin'
    ? (/^\/admin\/tenis\/[^/]+\/estoque$/.test(pathname) ? '/admin/tenis' : '/admin')
    : '/'

  function voltar() {
    if (temHistorico) {
      navigate(-1)
      return
    }
    navigate(destino, { replace: true })
  }

  return (
    <button type="button" onClick={voltar} className="btn-contorno btn-pequeno mb-5">
      <span aria-hidden="true">←</span> Voltar
    </button>
  )
}
