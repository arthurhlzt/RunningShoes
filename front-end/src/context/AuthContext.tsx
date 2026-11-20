import { createContext, useContext, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
import type { RespostaLogin, Usuario } from '../types'

interface Sessao {
  token: string
  usuario: Usuario
}

interface AuthContextValue {
  usuario: Usuario | null
  ehAdmin: boolean
  login: (email: string, senha: string) => Promise<void>
  loginAdmin: (email: string, senha: string) => Promise<void>
  loginGoogle: (credential: string) => Promise<void>
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>
  sair: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Lê a sessão salva para o usuário continuar logado após o F5
function lerSessao(): Sessao | null {
  try {
    const bruto = localStorage.getItem('auth')
    return bruto ? (JSON.parse(bruto) as Sessao) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(lerSessao)

  function salvar(resposta: RespostaLogin) {
    localStorage.setItem('auth', JSON.stringify(resposta))
    setSessao(resposta)
  }

  async function login(email: string, senha: string) {
    const { data } = await api.post<RespostaLogin>('/auth/login', { email, senha })
    salvar(data)
  }

  async function loginAdmin(email: string, senha: string) {
    const { data } = await api.post<RespostaLogin>('/auth/admin/login', { email, senha })
    salvar(data)
  }

  // Login Social: envia o ID Token do Google e recebe o JWT da API
  async function loginGoogle(credential: string) {
    const { data } = await api.post<RespostaLogin>('/auth/google', { credential })
    salvar(data)
  }

  async function cadastrar(nome: string, email: string, senha: string) {
    await api.post('/auth/cadastro', { nome, email, senha })
    await login(email, senha)
  }

  function sair() {
    localStorage.removeItem('auth')
    setSessao(null)
  }

  const usuario = sessao?.usuario ?? null

  return (
    <AuthContext.Provider
      value={{ usuario, ehAdmin: usuario?.tipo === 'ADMIN', login, loginAdmin, loginGoogle, cadastrar, sair }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return contexto
}
