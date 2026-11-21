import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Aviso from '../../components/Aviso'
import { api, mensagemErro } from '../../lib/api'
import { brl, distanciaRotulo, generoRotulo, terrenoRotulo } from '../../lib/format'
import type { Marca, Tenis } from '../../types'

const vazio = { modelo: '', preco: '', genero: 'UNISSEX', terreno: 'ASFALTO', distancia: 'DEZ_K', drop: '', peso: '', marcaId: '' }

export default function AdminTenis() {
  const [lista, setLista] = useState<Tenis[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [form, setForm] = useState(vazio)
  const [foto, setFoto] = useState<File | null>(null)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [aberto, setAberto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')

  const carregar = useCallback(() => {
    api.get<Tenis[]>('/tenis').then((r) => setLista(r.data)).catch((e) => setErro(mensagemErro(e)))
  }, [])

  useEffect(() => {
    carregar()
    api.get<Marca[]>('/marcas').then((r) => setMarcas(r.data)).catch(() => undefined)
  }, [carregar])

  function atualizar(campo: keyof typeof vazio, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function novo() {
    setForm(vazio)
    setFoto(null)
    setEditandoId(null)
    setErro('')
    setOk('')
    setAberto(true)
  }

  function editar(t: Tenis) {
    setForm({
      modelo: t.modelo,
      preco: String(Number(t.preco)),
      genero: t.genero,
      terreno: t.terreno,
      distancia: t.distancia,
      drop: String(t.drop),
      peso: String(t.peso),
      marcaId: String(t.marcaId),
    })
    setFoto(null)
    setEditandoId(t.id)
    setErro('')
    setOk('')
    setAberto(true)
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!editandoId && !foto) {
      setErro('Selecione a foto do tênis.')
      return
    }
    setEnviando(true)
    setErro('')
    try {
      // foto + campos de texto vão juntos em multipart/form-data (Multer no back-end)
      const dados = new FormData()
      Object.entries(form).forEach(([chave, valor]) => dados.append(chave, valor))
      if (foto) dados.append('foto', foto)

      if (editandoId) await api.put(`/tenis/${editandoId}`, dados)
      else await api.post('/tenis', dados)

      setOk(editandoId ? 'Tênis atualizado.' : 'Tênis cadastrado. Agora cadastre os tamanhos e cores em "Estoque".')
      setAberto(false)
      carregar()
    } catch (err) {
      setErro(mensagemErro(err))
    } finally {
      setEnviando(false)
    }
  }

  async function excluir(t: Tenis) {
    if (!confirm(`Excluir ${t.marca.nome} ${t.modelo}?`)) return
    setErro('')
    try {
      await api.delete(`/tenis/${t.id}`)
      carregar()
    } catch (err) {
      setErro(mensagemErro(err))
    }
  }

  async function refazerIA(t: Tenis) {
    setErro('')
    setOk('')
    try {
      await api.post(`/tenis/${t.id}/reconsultar-ia`)
      setOk(`Análise da IA atualizada para ${t.modelo}.`)
      carregar()
    } catch (err) {
      setErro(mensagemErro(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="titulo text-4xl">Tênis e estoque</h1>
        <button onClick={novo} className="btn-primario">Novo tênis</button>
      </div>

      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      {erro && !aberto && <Aviso>{erro}</Aviso>}

      {aberto && (
        <form onSubmit={salvar} className="space-y-4 rounded-sm border border-linha bg-papel p-5">
          <h2 className="titulo text-2xl">{editandoId ? 'Editar tênis' : 'Novo tênis'}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="marcaId" className="rotulo">Marca</label>
              <select id="marcaId" required className="campo" value={form.marcaId} onChange={(e) => atualizar('marcaId', e.target.value)}>
                <option value="">Selecione</option>
                {marcas.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="modelo" className="rotulo">Modelo</label>
              <input id="modelo" required minLength={2} maxLength={60} className="campo" value={form.modelo} onChange={(e) => atualizar('modelo', e.target.value)} />
            </div>
            <div>
              <label htmlFor="preco" className="rotulo">Preço (R$)</label>
              <input id="preco" type="number" required min="0.01" step="0.01" className="campo" value={form.preco} onChange={(e) => atualizar('preco', e.target.value)} />
            </div>
            <div>
              <label htmlFor="genero" className="rotulo">Gênero</label>
              <select id="genero" className="campo" value={form.genero} onChange={(e) => atualizar('genero', e.target.value)}>
                {Object.entries(generoRotulo).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="terreno" className="rotulo">Terreno</label>
              <select id="terreno" className="campo" value={form.terreno} onChange={(e) => atualizar('terreno', e.target.value)}>
                {Object.entries(terrenoRotulo).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="distancia" className="rotulo">Distância indicada</label>
              <select id="distancia" className="campo" value={form.distancia} onChange={(e) => atualizar('distancia', e.target.value)}>
                {Object.entries(distanciaRotulo).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="drop" className="rotulo">Drop (mm)</label>
              <input id="drop" type="number" required min="0" max="20" step="any" className="campo" value={form.drop} onChange={(e) => atualizar('drop', e.target.value)} />
            </div>
            <div>
              <label htmlFor="peso" className="rotulo">Peso (g)</label>
              <input id="peso" type="number" required min="1" className="campo" value={form.peso} onChange={(e) => atualizar('peso', e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <label htmlFor="foto" className="rotulo">Foto {editandoId && '(deixe vazio para manter a atual)'}</label>
              <input id="foto" type="file" accept="image/*" className="campo" onChange={(e) => setFoto(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          {!editandoId && <p className="text-sm text-asfalto">Ao cadastrar, a IA preenche pontos fortes, pontos fracos e amortecimento. Pode levar alguns segundos.</p>}
          {erro && <Aviso>{erro}</Aviso>}
          <div className="flex gap-2">
            <button type="submit" disabled={enviando} className="btn-primario">
              {enviando ? (editandoId ? 'Salvando…' : 'Enviando foto e consultando a IA…') : 'Salvar'}
            </button>
            <button type="button" onClick={() => setAberto(false)} className="btn-contorno">Cancelar</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-sm border border-linha bg-papel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-linha text-asfalto">
            <tr>
              <th className="p-3 font-medium">Tênis</th>
              <th className="p-3 font-medium">Preço</th>
              <th className="p-3 font-medium">Estoque</th>
              <th className="p-3 font-medium">IA</th>
              <th className="p-3 font-medium"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((t) => (
              <tr key={t.id} className="border-b border-linha last:border-0">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img src={t.foto} alt="" className="h-12 w-12 rounded-sm bg-white object-contain" />
                    <div>
                      <p className="font-medium">{t.marca.nome} {t.modelo}</p>
                      <p className="text-asfalto">{distanciaRotulo[t.distancia]} · {terrenoRotulo[t.terreno]}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3">{brl(t.preco)}</td>
                <td className="p-3">{t.variacoes.reduce((s, v) => s + v.quantidade, 0)} un. em {t.variacoes.length} variações</td>
                <td className="p-3">
                  {t.pontosFortes.length > 0 ? (
                    <span className="text-asfalto">Completo</span>
                  ) : (
                    <button onClick={() => refazerIA(t)} className="text-raia underline">Consultar IA</button>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link to={`/admin/tenis/${t.id}/estoque`} className="btn-primario btn-pequeno">Estoque</Link>
                    <button onClick={() => editar(t)} className="btn-contorno btn-pequeno">Editar</button>
                    <button onClick={() => excluir(t)} className="btn-perigo btn-pequeno">Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-asfalto">Nenhum tênis cadastrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
