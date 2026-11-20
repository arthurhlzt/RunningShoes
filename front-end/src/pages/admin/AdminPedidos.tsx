import { useCallback, useEffect, useState } from 'react'
import Aviso from '../../components/Aviso'
import StatusBadge from '../../components/StatusBadge'
import { api, mensagemErro } from '../../lib/api'
import { brl, dataBR, enderecoLinha, statusRotulo, telefoneBR } from '../../lib/format'
import type { Pedido, StatusPedido } from '../../types'

const proximo: Partial<Record<StatusPedido, { status: StatusPedido; acao: string }>> = {
  PENDENTE: { status: 'PAGO', acao: 'Marcar como pago' },
  PAGO: { status: 'ENVIADO', acao: 'Marcar como enviado' },
}

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [filtro, setFiltro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregar = useCallback(() => {
    api
      .get<Pedido[]>('/pedidos', { params: filtro ? { status: filtro } : {} })
      .then((r) => setPedidos(r.data))
      .catch((e) => setErro(mensagemErro(e)))
      .finally(() => setCarregando(false))
  }, [filtro])

  useEffect(carregar, [carregar])

  async function executar(chamada: Promise<unknown>) {
    setErro('')
    try {
      await chamada
      carregar()
    } catch (e) {
      setErro(mensagemErro(e))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="titulo text-4xl">Pedidos</h1>
        <div>
          <label htmlFor="filtro" className="rotulo">Status</label>
          <select id="filtro" className="campo" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(statusRotulo).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
          </select>
        </div>
      </div>

      {erro && <Aviso>{erro}</Aviso>}

      {carregando ? (
        <p className="text-asfalto">Carregando pedidos…</p>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-linha bg-papel">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-linha text-asfalto">
              <tr>
                <th className="p-3 font-medium">Pedido</th>
                <th className="p-3 font-medium">Cliente</th>
                <th className="p-3 font-medium">Itens</th>
                <th className="p-3 font-medium">Total</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id} className="border-b border-linha align-top last:border-0">
                  <td className="p-3">
                    <p className="font-medium">{p.id}</p>
                    <p className="text-asfalto">{dataBR(p.createdAt)}</p>
                  </td>
                  <td className="p-3">
                    <p>{p.cliente?.nome}</p>
                    <p className="text-asfalto">{p.cliente?.email}</p>
                    <p className="mt-1 text-asfalto">{telefoneBR(p.telefone)}</p>
                    <p className="max-w-64 text-asfalto">{enderecoLinha(p)}</p>
                  </td>
                  <td className="p-3">
                    <ul className="space-y-0.5">
                      {p.itens.map((i) => (
                        <li key={i.id}>
                          {i.quantidade}× {i.variacao.tenis.modelo} (tam. {i.variacao.tamanho}, {i.variacao.cor})
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="p-3 font-medium">{brl(p.total)}</td>
                  <td className="p-3"><StatusBadge status={p.status} /></td>
                  <td className="p-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {proximo[p.status] && (
                        <button onClick={() => executar(api.patch(`/pedidos/${p.id}/status`))} className="btn-primario btn-pequeno">
                          {proximo[p.status]!.acao}
                        </button>
                      )}
                      {(p.status === 'PENDENTE' || p.status === 'PAGO') && (
                        <button
                          onClick={() => confirm(`Cancelar o pedido ${p.id}? O estoque será devolvido.`) && executar(api.patch(`/pedidos/${p.id}/cancelar`))}
                          className="btn-perigo btn-pequeno"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {pedidos.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-asfalto">Nenhum pedido encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
