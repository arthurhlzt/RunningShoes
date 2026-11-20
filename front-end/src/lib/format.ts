import type { Distancia, Entrega, Genero, StatusPedido, Terreno } from '../types'

export const NOME_LOJA = 'Passada'

export const brl = (valor: number | string) =>
  Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const dataBR = (iso: string) => new Date(iso).toLocaleDateString('pt-BR')

export const distanciaRotulo: Record<Distancia, string> = {
  CINCO_K: '5K',
  DEZ_K: '10K',
  MARATONA: 'Maratona',
}

export const generoRotulo: Record<Genero, string> = {
  MASCULINO: 'Masculino',
  FEMININO: 'Feminino',
  UNISSEX: 'Unissex',
}

export const terrenoRotulo: Record<Terreno, string> = {
  ASFALTO: 'Asfalto',
  TRILHA: 'Trilha',
}

export const statusRotulo: Record<StatusPedido, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  ENVIADO: 'Enviado',
  CANCELADO: 'Cancelado',
}

export const statusCor: Record<StatusPedido, string> = {
  PENDENTE: '#b7791f',
  PAGO: '#2447c9',
  ENVIADO: '#1b7f4c',
  CANCELADO: '#b42318',
}

export const amortecimentoRotulo: Record<string, string> = {
  BAIXO: 'Baixo',
  MEDIO: 'Médio',
  ALTO: 'Alto',
}

export const cepBR = (cep: string) => cep.replace(/^(\d{5})(\d{3})$/, '$1-$2')

export const telefoneBR = (tel: string) =>
  tel.length === 11 ? tel.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3') : tel.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')

export const enderecoLinha = (e: Entrega) =>
  `${e.logradouro}, ${e.numero}${e.complemento ? ` (${e.complemento})` : ''} - ${e.bairro}, ${e.cidade}/${e.uf}, CEP ${cepBR(e.cep)}`
