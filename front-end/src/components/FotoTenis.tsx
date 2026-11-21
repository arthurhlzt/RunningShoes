import { enquadramentos } from '../lib/enquadramentos'

const pastasEspelhadas = [
  '/catalogo/asics/gel-trabuco-13/',
  '/catalogo/asics/novablast-5/',
  '/catalogo/nike/pegasus-trail-5/',
  '/catalogo/nike/vaporfly-4/',
  '/catalogo/nike/vomero-18/',
]

type Props = {
  src: string
  alt: string
  className: string
  padding?: string
  loading?: 'lazy' | 'eager'
}

export default function FotoTenis({ src, alt, className, padding = '', loading }: Props) {
  const enquadramento = enquadramentos[src]
  const espelhar = enquadramento && (
    src === '/catalogo/asics/superblast-2/02-1013a160-001.jpg' ||
    pastasEspelhadas.some((pasta) => src.startsWith(pasta))
  )

  return (
    <div
      style={{ background: enquadramento?.background, transform: espelhar ? 'scaleX(-1)' : undefined }}
      className={`relative overflow-hidden bg-white ${className}`}
    >
      <img
        src={src}
        alt={alt}
        loading={loading}
        style={enquadramento && { width: enquadramento.width, left: enquadramento.left, top: enquadramento.top }}
        className={enquadramento ? 'absolute h-auto max-w-none' : `h-full w-full object-contain ${padding}`}
      />
    </div>
  )
}
