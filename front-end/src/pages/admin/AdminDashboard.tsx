import { useEffect, useState, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Aviso from '../../components/Aviso'
import { api, mensagemErro } from '../../lib/api'
import { brl, statusCor, statusRotulo } from '../../lib/format'
import type { StatusPedido } from '../../types'

interface Dashboard {
  vendasPorMes: { mes: string; faturamento: number; pedidos: number }[]
  vendasPorMarca: { marca: string; unidades: number; faturamento: number }[]
  maisVendidos: { id: number; modelo: string; marca: string; unidades: number }[]
  estoqueBaixo: { variacaoId: number; marca: string; modelo: string; tamanho: number; cor: string; quantidade: number }[]
  pedidosPorStatus: { status: StatusPedido; quantidade: number }[]
}

const AZUL = '#2447c9'
const TINTA = '#15202b'

function Painel({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-sm border border-linha bg-papel p-4">
      <h2 className="titulo mb-3 text-xl">{titulo}</h2>
      {children}
    </section>
  )
}

const mesBR = (aaaaMm: string) => {
  const [ano, mes] = aaaaMm.split('-')
  return `${mes}/${ano.slice(2)}`
}

export default function AdminDashboard() {
  const [dados, setDados] = useState<Dashboard | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api
      .get<Dashboard>('/dashboard')
      .then((r) => setDados(r.data))
      .catch((e) => setErro(mensagemErro(e)))
  }, [])

  if (erro) return <Aviso>{erro}</Aviso>
  if (!dados) return <p className="text-asfalto">Carregando dashboard…</p>

  const faturamentoTotal = dados.vendasPorMes.reduce((s, m) => s + m.faturamento, 0)
  const pedidosTotal = dados.pedidosPorStatus.reduce((s, p) => s + p.quantidade, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="titulo text-4xl">Dashboard</h1>
        <p className="text-sm text-asfalto">
          {pedidosTotal} pedidos &nbsp;|&nbsp; faturamento (sem cancelados): <strong className="text-tinta">{brl(faturamentoTotal)}</strong>
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Painel titulo="Faturamento por mês">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={dados.vendasPorMes.map((m) => ({ ...m, mes: mesBR(m.mes) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8dad2" />
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={(v) => `R$ ${Math.round(Number(v) / 1000)}k`} />
                <Tooltip formatter={(v) => brl(Number(v))} />
                <Bar dataKey="faturamento" name="Faturamento" fill={AZUL} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Painel>

        <Painel titulo="Pedidos por status">
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={dados.pedidosPorStatus.map((p) => ({ name: statusRotulo[p.status], value: p.quantidade, status: p.status }))} dataKey="value" nameKey="name" outerRadius={90} label>
                  {dados.pedidosPorStatus.map((p) => (
                    <Cell key={p.status} fill={statusCor[p.status]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Painel>

        <Painel titulo="Vendas por marca">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={dados.vendasPorMarca} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8dad2" />
                <XAxis type="number" tickFormatter={(v) => `R$ ${Math.round(Number(v) / 1000)}k`} />
                <YAxis type="category" dataKey="marca" width={90} />
                <Tooltip formatter={(v) => brl(Number(v))} />
                <Bar dataKey="faturamento" name="Faturamento" fill={TINTA} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Painel>

        <Painel titulo="Tênis mais vendidos">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={dados.maisVendidos.map((t) => ({ ...t, nome: `${t.marca} ${t.modelo}` }))} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8dad2" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="nome" width={150} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="unidades" name="Unidades" fill={AZUL} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Painel>
      </div>

      <Painel titulo="Estoque baixo por variação">
        {dados.estoqueBaixo.length === 0 ? (
          <p className="text-sm text-asfalto">Nenhuma variação com estoque baixo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-linha text-asfalto">
                <tr>
                  <th className="py-2 pr-4 font-medium">Tênis</th>
                  <th className="py-2 pr-4 font-medium">Tamanho</th>
                  <th className="py-2 pr-4 font-medium">Cor</th>
                  <th className="py-2 font-medium">Unidades</th>
                </tr>
              </thead>
              <tbody>
                {dados.estoqueBaixo.map((v) => (
                  <tr key={v.variacaoId} className="border-b border-linha last:border-0">
                    <td className="py-2 pr-4">{v.marca} {v.modelo}</td>
                    <td className="py-2 pr-4">{v.tamanho}</td>
                    <td className="py-2 pr-4">{v.cor}</td>
                    <td className="py-2">
                      <span className={v.quantidade === 0 ? 'font-semibold text-alerta' : 'font-semibold'}>{v.quantidade}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Painel>
    </div>
  )
}
