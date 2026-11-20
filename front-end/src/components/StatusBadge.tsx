import { statusCor, statusRotulo } from '../lib/format'
import type { StatusPedido } from '../types'

export default function StatusBadge({ status }: { status: StatusPedido }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
      <span className="h-2 w-2 rounded-full" style={{ background: statusCor[status] }} />
      {statusRotulo[status]}
    </span>
  )
}
