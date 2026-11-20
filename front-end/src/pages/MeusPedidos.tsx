import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Aviso from '../components/Aviso'
import StatusBadge from '../components/StatusBadge'
import { api, mensagemErro } from '../lib/api'
import { brl, dataBR, enderecoLinha } from '../lib/format'
import type { Pedido } from '../types'

export default function MeusPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregar = useCallback(() => {
    api
      .get<Pedido[]>('/pedidos/meus')
      .then((r) => setPedidos(r.data))
      .catch((e) => setErro(mensagemErro(e)))
      .finally(() => setCarregando(false))
  }, [])

  useEffect(carregar, [carregar])

  async function cancelar(id: number) {
    if (!confirm('Cancelar este pedido? O estoque dos itens será devolvido.')) return
    setErro('')
    try {
      await api.patch(`/pedidos/${id}/cancelar`)
      carregar()
    } catch (e) {
      setErro(mensagemErro(e))
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="titulo text-4xl">Meus pedidos</h1>
      {erro && <Aviso>{erro}</Aviso>}
      {carregando ? (
        <p className="text-asfalto">Carregando pedidos…</p>
      ) : pedidos.length === 0 ? (
        <div className="space-y-3">
          <p className="text-asfalto">Você ainda não fez nenhum pedido.</p>
          <Link to="/" className="btn-primario">Escolher um tênis</Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {pedidos.map((p) => (
            <li key={p.id} className="rounded-sm border border-linha bg-papel">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-linha px-4 py-3">
                <div>
                  <p className="titulo text-xl">Pedido {p.id}</p>
                  <p className="text-sm text-asfalto">{dataBR(p.createdAt)}</p>
                </div>
                <StatusBadge status={p.status} />
                <p className="font-semibold">{brl(p.total)}</p>
              </div>
              <ul className="divide-y divide-linha">
                {p.itens.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <img src={i.variacao.tenis.foto} alt="" className="h-12 w-12 rounded-sm bg-white object-contain" />
                    <span className="flex-1">
                      {i.variacao.tenis.marca.nome} {i.variacao.tenis.modelo}, tam. {i.variacao.tamanho}, {i.variacao.cor}
                    </span>
                    <span>{i.quantidade} × {brl(i.precoUnitario)}</span>
                  </li>
                ))}
              </ul>
              <p className="border-t border-linha px-4 py-3 text-sm text-asfalto">
                <span className="font-medium text-tinta">Entrega:</span> {enderecoLinha(p)}
              </p>
              {(p.status === 'PENDENTE' || p.status === 'PAGO') && (
                <div className="border-t border-linha px-4 py-3">
                  <button onClick={() => cancelar(p.id)} className="btn-perigo btn-pequeno">Cancelar pedido</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
