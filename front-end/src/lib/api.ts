import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
})

// Anexa o JWT salvo pelo AuthContext em todas as requisições
api.interceptors.request.use((config) => {
  const bruto = localStorage.getItem('auth')
  if (bruto) {
    try {
      const { token } = JSON.parse(bruto) as { token?: string }
      if (token) config.headers.Authorization = `Bearer ${token}`
    } catch {
      /* sessão corrompida: ignora */
    }
  }
  return config
})

// Token expirado ou inválido (401 fora das rotas de login): limpa a sessão e volta ao login
api.interceptors.response.use(
  (resposta) => resposta,
  (erro: unknown) => {
    if (axios.isAxiosError(erro) && erro.response?.status === 401) {
      const ehRotaDeLogin = String(erro.config?.url ?? '').startsWith('/auth/')
      if (!ehRotaDeLogin && localStorage.getItem('auth')) {
        localStorage.removeItem('auth')
        const destino = window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login'
        window.location.assign(`${destino}?sessao=expirada`)
      }
    }
    return Promise.reject(erro)
  },
)

// Extrai a mensagem de erro que a API devolve ({ erro } ou { erros: [...] })
export function mensagemErro(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { erro?: string; erros?: { mensagem: string }[] } | undefined
    if (data?.erro) return data.erro
    if (data?.erros?.length) return data.erros.map((x) => x.mensagem).join(' ')
    if (!e.response) return 'Não foi possível conectar à API. Verifique se o servidor está rodando.'
  }
  return 'Algo deu errado. Tente novamente.'
}
