import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Aviso from '../components/Aviso'
import { useCarrinho } from '../context/CarrinhoContext'
import { api, mensagemErro } from '../lib/api'
import { amortecimentoRotulo, brl, distanciaRotulo, generoRotulo, terrenoRotulo } from '../lib/format'
import type { Tenis } from '../types'

export default function TenisDetalhe() {
  const { id } = useParams()
  const { adicionar } = useCarrinho()
  const [tenis, setTenis] = useState<Tenis | null>(null)
  const [erro, setErro] = useState('')
  const [cor, setCor] = useState('')
  const [variacaoId, setVariacaoId] = useState<number | null>(null)
  const [adicionado, setAdicionado] = useState(false)

  useEffect(() => {
    api
      .get<Tenis>(`/tenis/${id}`)
      .then((r) => {
        setTenis(r.data)
        const capa = r.data.variacoes.find((v) =>
          v.quantidade > 0 && r.data.fotosPorCor?.[v.cor] === r.data.foto,
        )
        const comEstoque = r.data.variacoes.find((v) => v.quantidade > 0)
        setCor(capa?.cor ?? comEstoque?.cor ?? r.data.variacoes[0]?.cor ?? '')
      })
      .catch((e) => setErro(mensagemErro(e)))
  }, [id])

  const cores = useMemo(() => [...new Set(tenis?.variacoes.map((v) => v.cor))], [tenis])
  const tamanhos = useMemo(
    () => (tenis?.variacoes ?? []).filter((v) => v.cor === cor).sort((a, b) => a.tamanho - b.tamanho),
    [tenis, cor],
  )
  const escolhida = tamanhos.find((v) => v.id === variacaoId)

  if (erro) return <Aviso>{erro}</Aviso>
  if (!tenis) return <p className="text-asfalto">Carregando…</p>

  const fotoSelecionada = tenis.fotosPorCor?.[cor] ?? tenis.foto

  function colocarNoCarrinho() {
    if (!tenis || !escolhida) return
    adicionar({
      variacaoId: escolhida.id,
      tenisId: tenis.id,
      modelo: tenis.modelo,
      marca: tenis.marca.nome,
      foto: fotoSelecionada,
      tamanho: escolhida.tamanho,
      cor: escolhida.cor,
      preco: Number(tenis.preco),
      estoque: escolhida.quantidade,
    })
    setAdicionado(true)
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="aspect-square rounded-sm border border-linha bg-white">
        <img src={fotoSelecionada} alt={`${tenis.marca.nome} ${tenis.modelo}${cor ? ` — ${cor}` : ''}`} className="h-full w-full object-contain p-6" />
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-asfalto">{tenis.marca.nome}</p>
          <h1 className="titulo text-4xl md:text-5xl">{tenis.modelo}</h1>
          <p className="mt-2 text-2xl font-semibold">{brl(tenis.preco)}</p>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-y border-linha py-4 text-sm sm:grid-cols-3">
          {[
            ['Distância', distanciaRotulo[tenis.distancia]],
            ['Terreno', terrenoRotulo[tenis.terreno]],
            ['Gênero', generoRotulo[tenis.genero]],
            ['Drop', `${tenis.drop} mm`],
            ['Peso', `${tenis.peso} g`],
            ['Amortecimento', tenis.amortecimento ? (amortecimentoRotulo[tenis.amortecimento] ?? tenis.amortecimento) : 'Não informado'],
          ].map(([rotulo, valor]) => (
            <div key={rotulo}>
              <dt className="text-asfalto">{rotulo}</dt>
              <dd className="font-medium">{valor}</dd>
            </div>
          ))}
        </dl>

        <div>
          <p className="rotulo">Cor</p>
          <div className="flex flex-wrap gap-2">
            {cores.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCor(c)
                  setVariacaoId(null)
                  setAdicionado(false)
                }}
                aria-pressed={c === cor}
                className={`rounded-md border px-3 py-1.5 text-sm ${c === cor ? 'border-tinta bg-tinta text-white' : 'border-linha bg-papel hover:border-tinta'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="rotulo">Tamanho</p>
          <div className="flex flex-wrap gap-2">
            {tamanhos.map((v) => (
              <button
                key={v.id}
                disabled={v.quantidade === 0}
                onClick={() => {
                  setVariacaoId(v.id)
                  setAdicionado(false)
                }}
                aria-pressed={v.id === variacaoId}
                className={`h-11 w-12 rounded-md border text-sm font-medium disabled:cursor-not-allowed disabled:text-asfalto/40 disabled:line-through ${v.id === variacaoId ? 'border-raia bg-raia text-white' : 'border-linha bg-papel hover:border-tinta'}`}
              >
                {v.tamanho}
              </button>
            ))}
            {tamanhos.length === 0 && <p className="text-sm text-asfalto">Nenhum tamanho cadastrado para este tênis.</p>}
          </div>
          {escolhida && escolhida.quantidade <= 3 && (
            <p className="mt-2 inline-block bg-sinal px-2 py-0.5 text-sm font-semibold">
              {escolhida.quantidade === 1 ? 'Resta 1 unidade' : `Restam ${escolhida.quantidade} unidades`}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <button onClick={colocarNoCarrinho} disabled={!escolhida} className="btn-primario w-full py-3 text-lg">
            {escolhida ? 'Adicionar ao carrinho' : 'Escolha um tamanho'}
          </button>
          {adicionado && (
            <Aviso tipo="ok">
              Adicionado ao carrinho.{' '}
              <Link to="/carrinho" className="font-semibold underline">
                Ver carrinho
              </Link>
            </Aviso>
          )}
        </div>

        {(tenis.pontosFortes.length > 0 || tenis.pontosFracos.length > 0) && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h2 className="titulo text-xl">Pontos fortes</h2>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {tenis.pontosFortes.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="titulo text-xl">Pontos de atenção</h2>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {tenis.pontosFracos.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-asfalto sm:col-span-2">Análise gerada por inteligência artificial. Confira as especificações do fabricante.</p>
          </div>
        )}
      </div>
    </div>
  )
}
