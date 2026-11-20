import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import Aviso from '../../components/Aviso'
import { api, mensagemErro } from '../../lib/api'
import type { Tenis, Variacao } from '../../types'

export default function AdminEstoque() {
  const { id } = useParams()
  const [tenis, setTenis] = useState<Tenis | null>(null)
  const [quantidades, setQuantidades] = useState<Record<number, string>>({})
  const [novo, setNovo] = useState({ tamanho: '', cor: '', quantidade: '' })
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')

  const carregar = useCallback(() => {
    api
      .get<Tenis>(`/tenis/${id}`)
      .then((r) => {
        setTenis(r.data)
        setQuantidades(Object.fromEntries(r.data.variacoes.map((v) => [v.id, String(v.quantidade)])))
      })
      .catch((e) => setErro(mensagemErro(e)))
  }, [id])

  useEffect(carregar, [carregar])

  async function criar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setOk('')
    try {
      await api.post(`/tenis/${id}/variacoes`, {
        tamanho: Number(novo.tamanho),
        cor: novo.cor,
        quantidade: Number(novo.quantidade),
      })
      setNovo({ tamanho: '', cor: '', quantidade: '' })
      carregar()
    } catch (err) {
      setErro(mensagemErro(err))
    }
  }

  async function salvar(v: Variacao) {
    setErro('')
    setOk('')
    try {
      await api.put(`/variacoes/${v.id}`, { tamanho: v.tamanho, cor: v.cor, quantidade: Number(quantidades[v.id]) })
      setOk(`Estoque do tamanho ${v.tamanho} (${v.cor}) atualizado.`)
      carregar()
    } catch (err) {
      setErro(mensagemErro(err))
    }
  }

  async function excluir(v: Variacao) {
    if (!confirm(`Excluir tamanho ${v.tamanho} (${v.cor})?`)) return
    setErro('')
    setOk('')
    try {
      await api.delete(`/variacoes/${v.id}`)
      carregar()
    } catch (err) {
      setErro(mensagemErro(err))
    }
  }

  if (!tenis) return erro ? <Aviso>{erro}</Aviso> : <p className="text-asfalto">Carregando…</p>

  const ordenadas = [...tenis.variacoes].sort((a, b) => a.cor.localeCompare(b.cor) || a.tamanho - b.tamanho)

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/tenis" className="text-sm text-raia underline">Voltar para tênis</Link>
        <h1 className="titulo mt-1 text-4xl">Estoque: {tenis.marca.nome} {tenis.modelo}</h1>
      </div>

      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      {erro && <Aviso>{erro}</Aviso>}

      <form onSubmit={criar} className="flex flex-wrap items-end gap-3 rounded-sm border border-linha bg-papel p-4">
        <div>
          <label htmlFor="tam" className="rotulo">Tamanho</label>
          <input id="tam" type="number" required min="30" max="50" className="campo w-28" value={novo.tamanho} onChange={(e) => setNovo({ ...novo, tamanho: e.target.value })} />
        </div>
        <div>
          <label htmlFor="cor" className="rotulo">Cor</label>
          <input id="cor" required minLength={2} maxLength={30} className="campo w-44" value={novo.cor} onChange={(e) => setNovo({ ...novo, cor: e.target.value })} />
        </div>
        <div>
          <label htmlFor="qtd" className="rotulo">Quantidade</label>
          <input id="qtd" type="number" required min="0" className="campo w-28" value={novo.quantidade} onChange={(e) => setNovo({ ...novo, quantidade: e.target.value })} />
        </div>
        <button type="submit" className="btn-primario">Adicionar variação</button>
      </form>

      <div className="overflow-x-auto rounded-sm border border-linha bg-papel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-linha text-asfalto">
            <tr>
              <th className="p-3 font-medium">Cor</th>
              <th className="p-3 font-medium">Tamanho</th>
              <th className="p-3 font-medium">Quantidade</th>
              <th className="p-3 font-medium"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {ordenadas.map((v) => (
              <tr key={v.id} className="border-b border-linha last:border-0">
                <td className="p-3">{v.cor}</td>
                <td className="p-3">{v.tamanho}</td>
                <td className="p-3">
                  <input
                    aria-label={`Quantidade do tamanho ${v.tamanho} ${v.cor}`}
                    type="number"
                    min="0"
                    className="campo w-24"
                    value={quantidades[v.id] ?? ''}
                    onChange={(e) => setQuantidades({ ...quantidades, [v.id]: e.target.value })}
                  />
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => salvar(v)} disabled={quantidades[v.id] === String(v.quantidade)} className="btn-primario btn-pequeno">Salvar</button>
                    <button onClick={() => excluir(v)} className="btn-perigo btn-pequeno">Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
            {ordenadas.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-asfalto">Nenhuma variação cadastrada. Adicione tamanho e cor acima.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
