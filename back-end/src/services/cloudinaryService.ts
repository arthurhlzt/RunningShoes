import { v2 as cloudinary } from 'cloudinary'
import streamifier from 'streamifier'

let configurado = false

function configurar() {
  if (configurado) return
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  configurado = true
}

// Converte o buffer do Multer em stream e envia ao Cloudinary
export function uploadParaCloudinary(buffer: Buffer): Promise<string> {
  configurar()
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'tenis/fotos' },
      (error, result) => {
        if (error || !result) reject(error)
        else resolve(result.secure_url)
      },
    )
    // streamifier cria um stream legível a partir do buffer
    streamifier.createReadStream(buffer).pipe(uploadStream)
  })
}
