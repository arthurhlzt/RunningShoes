import { Link, NavLink, Outlet } from 'react-router-dom'
import BotaoVoltar from './BotaoVoltar'
import { useAuth } from '../context/AuthContext'
import { NOME_LOJA } from '../lib/format'

const links = [
  { para: '/admin', rotulo: 'Dashboard', fim: true },
  { para: '/admin/tenis', rotulo: 'Tênis e estoque' },
  { para: '/admin/pedidos', rotulo: 'Pedidos' },
  { para: '/admin/marcas', rotulo: 'Marcas' },
]

export default function AdminLayout() {
  const { usuario, sair } = useAuth()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="bg-tinta text-white md:w-56 md:shrink-0">
        <div className="flex items-center justify-between px-4 py-4 md:block">
          <Link to="/" className="titulo block text-3xl">
            {NOME_LOJA}
          </Link>
          <p className="text-sm text-white/60 md:mt-1">Painel · {usuario?.nome}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:pb-0">
          {links.map((l) => (
            <NavLink
              key={l.para}
              to={l.para}
              end={l.fim}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-white text-tinta' : 'text-white/80 hover:bg-white/10'}`
              }
            >
              {l.rotulo}
            </NavLink>
          ))}
          <button onClick={sair} className="rounded-md px-3 py-2 text-left text-sm text-white/60 hover:bg-white/10">
            Sair
          </button>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-5 md:p-8">
        <BotaoVoltar painel />
        <Outlet />
      </main>
    </div>
  )
}
