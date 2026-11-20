import { GoogleGenAI, Type } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export interface DadosIA {
  pontosFortes: string[]
  pontosFracos: string[]
  amortecimento: string
}

// Schema com os campos consultados
const schemaTenis = {
  type: Type.OBJECT,
  properties: {
    pontosFortes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Principais pontos fortes do tênis (3 a 5 itens)',
    },
    pontosFracos: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Principais pontos fracos do tênis (3 a 5 itens)',
    },
    amortecimento: {
      type: Type.STRING,
      enum: ['BAIXO', 'MEDIO', 'ALTO'],
      description: 'Nível de amortecimento do tênis',
    },
  },
  required: ['pontosFortes', 'pontosFracos', 'amortecimento'],
}

export async function buscarDadosComGemini(marca: string, modelo: string): Promise<DadosIA> {
  const resposta = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    contents: `Tênis de corrida: ${marca} ${modelo}, versão comercializada no Brasil.
Liste os principais pontos fortes, os principais pontos fracos e o nível de amortecimento.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: schemaTenis,
    },
  })

  return JSON.parse(resposta.text || '{}') as DadosIA
}
