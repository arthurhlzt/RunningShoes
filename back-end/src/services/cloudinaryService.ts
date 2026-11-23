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

// Registra apenas categorias conhecidas. A mensagem do provedor pode conter dados sensíveis.
function registrarFalha(error: { http_code?: number; message?: string } | undefined) {
  const mensagem = error?.message ?? ''
  const status = error?.http_code
  let categoria = 'erro_do_provedor'
  if (!error) categoria = 'resposta_sem_url'
  else if (/invalid signature/i.test(mensagem)) categoria = 'assinatura_invalida'
  else if (/unknown api key|invalid api key/i.test(mensagem)) categoria = 'api_key_invalida'
  else if (/cloud name|unknown cloud/i.test(mensagem)) categoria = 'cloud_name_invalido'
  else if (status === 403 || /permission|not allowed|forbidden/i.test(mensagem)) categoria = 'permissao_negada'
  else if (status === 401) categoria = 'autenticacao_recusada'

  console.warn('[cloudinary] Falha no upload', {
    categoria,
    status: Number.isInteger(status) ? status : undefined,
  })
}

// Converte o buffer do Multer em stream e envia ao Cloudinary
export function uploadParaCloudinary(buffer: Buffer): Promise<string> {
  configurar()
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'tenis/fotos' },
      (error, result) => {
        if (error || !result?.secure_url) {
          registrarFalha(error)
          reject(new ErroNegocio(502, 'Não foi possível enviar a imagem ao Cloudinary.'))
          return
        }
        resolve(result.secure_url)
      },
    )
    // streamifier cria um stream legível a partir do buffer
    streamifier.createReadStream(buffer).pipe(uploadStream)
  })
}
