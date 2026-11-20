import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Aviso from '../components/Aviso'
import { useAuth } from '../context/AuthContext'
import { mensagemErro } from '../lib/api'

export default function Cadastro() {
  const { cadastrar } = useAuth()
  const navigate = useNavigate()
  const destino = (useLocation().state as { de?: string } | null)?.de ?? '/'
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (senha !== confirmar) {
      setErro('As senhas não conferem.')
      return
    }
    setEnviando(true)
    setErro('')
    try {
      await cadastrar(nome, email, senha)
      navigate(destino, { replace: true })
    } catch (err) {
      setErro(mensagemErro(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <h1 className="titulo text-4xl">Criar conta</h1>
      <form onSubmit={enviar} className="space-y-4">
        <div>
          <label htmlFor="nome" className="rotulo">Nome completo</label>
          <input id="nome" required minLength={3} maxLength={60} autoComplete="name" className="campo" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <label htmlFor="email" className="rotulo">E-mail</label>
          <input id="email" type="email" required autoComplete="email" className="campo" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="senha" className="rotulo">Senha (mínimo 6 caracteres)</label>
          <input id="senha" type="password" required minLength={6} autoComplete="new-password" className="campo" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </div>
        <div>
          <label htmlFor="confirmar" className="rotulo">Confirmar senha</label>
          <input id="confirmar" type="password" required autoComplete="new-password" className="campo" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
        </div>
        {erro && <Aviso>{erro}</Aviso>}
        <button type="submit" disabled={enviando} className="btn-primario w-full">
          {enviando ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>
      <p className="text-center text-sm text-asfalto">
        Já tem conta?{' '}
        <Link to="/login" className="font-semibold text-raia underline">Entrar</Link>
      </p>
    </div>
  )
}
