import { v2 as cloudinary } from 'cloudinary'
import streamifier from 'streamifier'
import { ErroNegocio } from '../lib/erros'

let configurado = false

function configurar() {
  if (configurado) return
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim()
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim()
  if (!cloudName || !apiKey || !apiSecret) {
    throw new ErroNegocio(503, 'Envio de imagens indisponível.')
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret })
  configurado = true
}

// Converte o buffer do Multer em stream e envia ao Cloudinary
export function uploadParaCloudinary(buffer: Buffer): Promise<string> {
  configurar()
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'tenis/fotos' },
      (error, result) => {
        if (error || !result?.secure_url) reject(new ErroNegocio(502, 'Não foi possível enviar a imagem ao Cloudinary.'))
        else resolve(result.secure_url)
      },
    )
    // streamifier cria um stream legível a partir do buffer
    streamifier.createReadStream(buffer).pipe(uploadStream)
  })
}
