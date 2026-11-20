import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Aviso from '../components/Aviso'
import { useCarrinho } from '../context/CarrinhoContext'
import { api, mensagemErro } from '../lib/api'
import { brl } from '../lib/format'

const vazio = { telefone: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' }

// Lembra o último endereço usado para o cliente não digitar de novo
function lerEndereco(): typeof vazio {
  try {
    const bruto = localStorage.getItem('entrega')
    return bruto ? { ...vazio, ...JSON.parse(bruto) } : vazio
  } catch {
    return vazio
  }
}

export default function Checkout() {
  const { itens, total, limpar } = useCarrinho()
  const navigate = useNavigate()
  const [form, setForm] = useState(lerEndereco)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  function atualizar(campo: keyof typeof vazio, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  // Preenche rua, bairro, cidade e UF a partir do CEP (ViaCEP). Se falhar, o cliente digita.
  async function buscarCep() {
    const cep = form.cep.replace(/\D/g, '')
    if (cep.length !== 8) return
    setBuscandoCep(true)
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const d = (await r.json()) as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string }
      if (!d.erro) {
        setForm((f) => ({
          ...f,
          logradouro: d.logradouro || f.logradouro,
          bairro: d.bairro || f.bairro,
          cidade: d.localidade || f.cidade,
          uf: d.uf || f.uf,
        }))
      }
    } catch {
      /* sem conexão com o ViaCEP: segue com o preenchimento manual */
    } finally {
      setBuscandoCep(false)
    }
  }

  async function finalizar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro('')
    try {
      // a API baixa o estoque e grava o pedido com o endereço na mesma transação
      await api.post('/pedidos', {
        itens: itens.map((i) => ({ variacaoId: i.variacaoId, quantidade: i.quantidade })),
        entrega: form,
      })
      localStorage.setItem('entrega', JSON.stringify(form))
      limpar()
      navigate('/pedidos')
    } catch (err) {
      setErro(mensagemErro(err))
    } finally {
      setEnviando(false)
    }
  }

  if (itens.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="titulo text-4xl">Entrega</h1>
        <p className="text-asfalto">Seu carrinho está vazio.</p>
        <Link to="/" className="btn-primario">Escolher um tênis</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="titulo text-4xl">Entrega</h1>
      <div className="grid gap-8 md:grid-cols-[1fr_20rem]">
        <form onSubmit={finalizar} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cep" className="rotulo">CEP</label>
              <input id="cep" required inputMode="numeric" autoComplete="postal-code" maxLength={9} placeholder="00000-000" className="campo" value={form.cep} onChange={(e) => atualizar('cep', e.target.value)} onBlur={buscarCep} />
              {buscandoCep && <p className="mt-1 text-xs text-asfalto">Buscando endereço…</p>}
            </div>
            <div>
              <label htmlFor="telefone" className="rotulo">Telefone com DDD</label>
              <input id="telefone" required inputMode="tel" autoComplete="tel" placeholder="(53) 99999-9999" className="campo" value={form.telefone} onChange={(e) => atualizar('telefone', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="logradouro" className="rotulo">Rua / Avenida</label>
              <input id="logradouro" required minLength={3} maxLength={100} autoComplete="address-line1" className="campo" value={form.logradouro} onChange={(e) => atualizar('logradouro', e.target.value)} />
            </div>
            <div>
              <label htmlFor="numero" className="rotulo">Número</label>
              <input id="numero" required maxLength={10} className="campo" value={form.numero} onChange={(e) => atualizar('numero', e.target.value)} />
            </div>
            <div>
              <label htmlFor="complemento" className="rotulo">Complemento (opcional)</label>
              <input id="complemento" maxLength={50} autoComplete="address-line2" className="campo" value={form.complemento} onChange={(e) => atualizar('complemento', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="bairro" className="rotulo">Bairro</label>
              <input id="bairro" required minLength={2} maxLength={60} className="campo" value={form.bairro} onChange={(e) => atualizar('bairro', e.target.value)} />
            </div>
            <div>
              <label htmlFor="cidade" className="rotulo">Cidade</label>
              <input id="cidade" required minLength={2} maxLength={60} autoComplete="address-level2" className="campo" value={form.cidade} onChange={(e) => atualizar('cidade', e.target.value)} />
            </div>
            <div>
              <label htmlFor="uf" className="rotulo">UF</label>
              <input id="uf" required minLength={2} maxLength={2} autoComplete="address-level1" placeholder="RS" className="campo uppercase" value={form.uf} onChange={(e) => atualizar('uf', e.target.value.toUpperCase())} />
            </div>
          </div>

          {erro && <Aviso>{erro}</Aviso>}
          <button type="submit" disabled={enviando} className="btn-primario w-full py-3 text-lg">
            {enviando ? 'Enviando pedido…' : 'Finalizar pedido'}
          </button>
          <p className="text-sm text-asfalto">O pagamento é simulado: o pedido entra como pendente e o administrador atualiza o status.</p>
        </form>

        <aside className="h-fit space-y-3 rounded-sm border border-linha bg-papel p-4">
          <h2 className="titulo text-2xl">Resumo</h2>
          <ul className="space-y-2 text-sm">
            {itens.map((i) => (
              <li key={i.variacaoId} className="flex justify-between gap-3">
                <span>
                  {i.quantidade}× {i.modelo} (tam. {i.tamanho}, {i.cor})
                </span>
                <span className="shrink-0">{brl(i.preco * i.quantidade)}</span>
              </li>
            ))}
          </ul>
          <p className="flex justify-between border-t border-linha pt-3 text-lg font-semibold">
            <span>Total</span>
            <span>{brl(total)}</span>
          </p>
          <Link to="/carrinho" className="text-sm text-raia underline">Voltar ao carrinho</Link>
        </aside>
      </div>
    </div>
  )
}
