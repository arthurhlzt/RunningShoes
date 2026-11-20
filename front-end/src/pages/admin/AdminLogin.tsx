import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import Aviso from '../../components/Aviso'
import { useAuth } from '../../context/AuthContext'
import { mensagemErro } from '../../lib/api'

export default function AdminLogin() {
  const { usuario, loginAdmin } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (usuario?.tipo === 'ADMIN') return <Navigate to="/admin" replace />

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro('')
    try {
      await loginAdmin(email, senha)
      navigate('/admin', { replace: true })
    } catch (err) {
      setErro(mensagemErro(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <h1 className="titulo text-4xl">Acesso do administrador</h1>
      {params.get('sessao') === 'expirada' && <Aviso>Sua sessão expirou. Entre novamente para continuar.</Aviso>}
      <form onSubmit={entrar} className="space-y-4">
        <div>
          <label htmlFor="email" className="rotulo">E-mail</label>
          <input id="email" type="email" required className="campo" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="senha" className="rotulo">Senha</label>
          <input id="senha" type="password" required className="campo" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </div>
        {erro && <Aviso>{erro}</Aviso>}
        <button type="submit" disabled={enviando} className="btn-primario w-full">
          {enviando ? 'Entrando…' : 'Entrar no painel'}
        </button>
      </form>
    </div>
  )
}
