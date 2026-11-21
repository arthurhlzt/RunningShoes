import { Link, NavLink, Outlet } from 'react-router-dom'
import BotaoVoltar from './BotaoVoltar'
import { useAuth } from '../context/AuthContext'
import { useCarrinho } from '../context/CarrinhoContext'
import { NOME_LOJA } from '../lib/format'

export default function Layout() {
  const { usuario, ehAdmin, sair } = useAuth()
  const { quantidadeTotal } = useCarrinho()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-linha bg-papel">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="titulo text-3xl text-tinta">
            {NOME_LOJA}
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <NavLink to="/" end className="hover:text-raia">
              Tênis
            </NavLink>
            {usuario && !ehAdmin && (
              <NavLink to="/pedidos" className="hover:text-raia">
                Meus pedidos
              </NavLink>
            )}
            {ehAdmin && (
              <NavLink to="/admin" className="hover:text-raia">
                Painel
              </NavLink>
            )}
            <NavLink to="/carrinho" className="hover:text-raia">
              Carrinho{quantidadeTotal > 0 && <span className="ml-1.5 rounded bg-sinal px-1.5 py-0.5 text-xs font-semibold">{quantidadeTotal}</span>}
            </NavLink>
            {usuario ? (
              <button onClick={sair} className="text-asfalto hover:text-tinta">
                Sair ({usuario.nome.split(' ')[0]})
              </button>
            ) : (
              <NavLink to="/login" className="btn-primario btn-pequeno">
                Entrar
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <BotaoVoltar />
        <Outlet />
      </main>

      <footer className="border-t border-linha py-6 text-center text-sm text-asfalto">
        {NOME_LOJA} · Olympikus, Adidas, Nike, Asics, New Balance e Fila
      </footer>
    </div>
  )
}
