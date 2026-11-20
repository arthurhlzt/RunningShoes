import { useCallback, useEffect, useState, type FormEvent } from 'react'
import Aviso from '../../components/Aviso'
import { api, mensagemErro } from '../../lib/api'
import type { Marca } from '../../types'

export default function AdminMarcas() {
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState('')

  const carregar = useCallback(() => {
    api.get<Marca[]>('/marcas').then((r) => setMarcas(r.data)).catch((e) => setErro(mensagemErro(e)))
  }, [])

  useEffect(carregar, [carregar])

  async function criar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    try {
      await api.post('/marcas', { nome })
      setNome('')
      carregar()
    } catch (err) {
      setErro(mensagemErro(err))
    }
  }

  async function excluir(m: Marca) {
    if (!confirm(`Excluir a marca ${m.nome}?`)) return
    setErro('')
    try {
      await api.delete(`/marcas/${m.id}`)
      carregar()
    } catch (err) {
      setErro(mensagemErro(err))
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="titulo text-4xl">Marcas</h1>
      {erro && <Aviso>{erro}</Aviso>}
      <form onSubmit={criar} className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="nome" className="rotulo">Nova marca</label>
          <input id="nome" required minLength={2} maxLength={30} className="campo" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <button type="submit" className="btn-primario">Adicionar</button>
      </form>
      <ul className="divide-y divide-linha rounded-sm border border-linha bg-papel">
        {marcas.map((m) => (
          <li key={m.id} className="flex items-center justify-between px-4 py-3">
            <span className="font-medium">{m.nome}</span>
            <button onClick={() => excluir(m)} className="btn-perigo btn-pequeno">Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
