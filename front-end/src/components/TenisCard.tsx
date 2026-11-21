import { Link } from 'react-router-dom'
import FotoTenis from './FotoTenis'
import { brl, distanciaRotulo } from '../lib/format'
import type { Tenis } from '../types'

export default function TenisCard({ tenis }: { tenis: Tenis }) {
  const estoque = tenis.variacoes.reduce((soma, v) => soma + v.quantidade, 0)

  return (
    <Link to={`/tenis/${tenis.id}`} className="group block overflow-hidden rounded-sm border border-linha bg-papel hover:border-tinta">
      <div className="relative aspect-square overflow-hidden bg-white">
        <FotoTenis src={tenis.foto} alt={`${tenis.marca.nome} ${tenis.modelo}`} className="h-full w-full" padding="p-4" loading="lazy" />
        <span className="titulo absolute left-0 top-3 bg-tinta px-2.5 py-0.5 text-lg text-white">{distanciaRotulo[tenis.distancia]}</span>
        {estoque === 0 && <span className="absolute right-3 top-3 rounded bg-alerta px-2 py-0.5 text-xs font-semibold text-white">Esgotado</span>}
      </div>
      <div className="space-y-1 border-t border-linha p-4">
        <p className="text-sm text-asfalto">{tenis.marca.nome}</p>
        <h3 className="titulo text-xl leading-tight group-hover:text-raia">{tenis.modelo}</h3>
        <p className="text-sm text-asfalto">
          Drop {tenis.drop} mm &nbsp;|&nbsp; {tenis.peso} g
        </p>
        <p className="pt-1 text-lg font-semibold">{brl(tenis.preco)}</p>
      </div>
    </Link>
  )
}
