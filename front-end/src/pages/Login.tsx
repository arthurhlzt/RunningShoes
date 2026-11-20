import { useState, type FormEvent } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Aviso from '../components/Aviso'
import { useAuth } from '../context/AuthContext'
import { mensagemErro } from '../lib/api'

export default function Login() {
  const { login, loginGoogle } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const destino = (useLocation().state as { de?: string } | null)?.de ?? '/'
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro('')
    try {
      await login(email, senha)
      navigate(destino, { replace: true })
    } catch (err) {
      setErro(mensagemErro(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <h1 className="titulo text-4xl">Entrar</h1>
      {params.get('sessao') === 'expirada' && <Aviso>Sua sessão expirou. Entre novamente para continuar.</Aviso>}

      {import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() && (
        <>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={async (resposta) => {
                try {
                  if (!resposta.credential) throw new Error()
                  await loginGoogle(resposta.credential)
                  navigate(destino, { replace: true })
                } catch (err) {
                  setErro(mensagemErro(err))
                }
              }}
              onError={() => setErro('Não foi possível entrar com o Google. Tente novamente.')}
              text="signin_with"
              locale="pt-BR"
            />
          </div>

          <p className="text-center text-sm text-asfalto">ou use seu e-mail e senha</p>
        </>
      )}

      <form onSubmit={entrar} className="space-y-4">
        <div>
          <label htmlFor="email" className="rotulo">E-mail</label>
          <input id="email" type="email" required autoComplete="email" className="campo" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="senha" className="rotulo">Senha</label>
          <input id="senha" type="password" required autoComplete="current-password" className="campo" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </div>
        {erro && <Aviso>{erro}</Aviso>}
        <button type="submit" disabled={enviando} className="btn-primario w-full">
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="text-center text-sm text-asfalto">
        Ainda não tem conta?{' '}
        <Link to="/cadastro" state={{ de: destino }} className="font-semibold text-raia underline">
          Criar conta
        </Link>
      </p>
    </div>
  )
}
