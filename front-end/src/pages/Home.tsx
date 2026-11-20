import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import Aviso from '../components/Aviso'
import TenisCard from '../components/TenisCard'
import { api, mensagemErro } from '../lib/api'
import { generoRotulo, terrenoRotulo } from '../lib/format'
import type { Distancia, Marca, Tenis } from '../types'

// A escolha começa pela distância: é como o corredor pensa o treino
const distancias: { valor: Distancia; titulo: string; texto: string }[] = [
  { valor: 'CINCO_K', titulo: '5K', texto: 'Leves e responsivos para o ritmo forte' },
  { valor: 'DEZ_K', titulo: '10K', texto: 'Equilíbrio entre velocidade e conforto' },
  { valor: 'MARATONA', titulo: '42K', texto: 'Amortecimento para as distâncias longas' },
]

export default function Home() {
  const [params, setParams] = useSearchParams()
  const buscaAtual = params.get('busca') ?? ''
  const [textoBusca, setTextoBusca] = useState(buscaAtual)
  const [tenis, setTenis] = useState<Tenis[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api.get<Marca[]>('/marcas').then((r) => setMarcas(r.data)).catch(() => undefined)
  }, [])

  useEffect(() => {
    setCarregando(true)
    setErro('')
    api
      .get<Tenis[]>('/tenis', { params: Object.fromEntries(params) })
      .then((r) => setTenis(r.data))
      .catch((e) => setErro(mensagemErro(e)))
      .finally(() => setCarregando(false))
  }, [params])

  useEffect(() => {
    setTextoBusca(buscaAtual)
  }, [buscaAtual])

  function definir(chave: string, valor: string) {
    const novo = new URLSearchParams(params)
    if (valor) novo.set(chave, valor)
    else novo.delete(chave)
    setParams(novo)
  }

  function buscar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const busca = textoBusca.trim()
    setTextoBusca(busca)
    definir('busca', busca)
  }

  const distanciaAtual = params.get('distancia')

  return (
    <div className="space-y-8">
      <section aria-labelledby="titulo-distancia">
        <h1 id="titulo-distancia" className="titulo text-4xl md:text-5xl">
          Qual é a sua distância?
        </h1>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {distancias.map((d) => {
            const ativa = distanciaAtual === d.valor
            return (
              <button
                key={d.valor}
                onClick={() => definir('distancia', ativa ? '' : d.valor)}
                aria-pressed={ativa}
                className={`rounded-sm border p-5 text-left transition-colors ${ativa ? 'border-raia bg-raia text-white' : 'border-linha bg-papel hover:border-tinta'}`}
              >
                <span className="titulo block text-6xl leading-none">{d.titulo}</span>
                <span className={`mt-2 block text-sm ${ativa ? 'text-white/85' : 'text-asfalto'}`}>{d.texto}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section aria-label="Filtros" className="flex flex-wrap items-end gap-3">
        <form onSubmit={buscar} className="min-w-52 flex-1">
          <label htmlFor="busca" className="rotulo">
            Buscar modelo
          </label>
          <input id="busca" name="busca" value={textoBusca} onChange={(e) => setTextoBusca(e.target.value)} placeholder="Ex.: Pegasus" className="campo" />
        </form>
        <div>
          <label htmlFor="marca" className="rotulo">
            Marca
          </label>
          <select id="marca" className="campo" value={params.get('marcaId') ?? ''} onChange={(e) => definir('marcaId', e.target.value)}>
            <option value="">Todas</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="genero" className="rotulo">
            Gênero
          </label>
          <select id="genero" className="campo" value={params.get('genero') ?? ''} onChange={(e) => definir('genero', e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(generoRotulo).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="terreno" className="rotulo">
            Terreno
          </label>
          <select id="terreno" className="campo" value={params.get('terreno') ?? ''} onChange={(e) => definir('terreno', e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(terrenoRotulo).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </div>
        {params.size > 0 && (
          <button onClick={() => { setTextoBusca(''); setParams({}) }} className="btn-contorno">
            Limpar filtros
          </button>
        )}
      </section>

      {erro && <Aviso>{erro}</Aviso>}
      {carregando ? (
        <p className="text-asfalto">Carregando tênis…</p>
      ) : tenis.length === 0 && !erro ? (
        <p className="text-asfalto">Nenhum tênis encontrado com esses filtros. Limpe os filtros para ver todos.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {tenis.map((t) => (
            <TenisCard key={t.id} tenis={t} />
          ))}
        </div>
      )}
    </div>
  )
}
