// Mensagem de erro ou de sucesso para formulários e telas
export default function Aviso({ tipo = 'erro', children }: { tipo?: 'erro' | 'ok'; children: React.ReactNode }) {
  const cores = tipo === 'erro' ? 'border-alerta/40 bg-alerta/5 text-alerta' : 'border-raia/30 bg-raia/5 text-raia-escura'
  return (
    <p role={tipo === 'erro' ? 'alert' : 'status'} className={`rounded-md border px-3 py-2 text-sm ${cores}`}>
      {children}
    </p>
  )
}
