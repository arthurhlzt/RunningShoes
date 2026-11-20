# Front-end – Loja de Tênis de Corrida (Passada)

Vite + React + TypeScript + React Router + Axios + Tailwind CSS v4.
Consome a API `loja-tenis-back`.

## Como rodar

```bash
npm install
cp .env.example .env     # VITE_API_URL e VITE_GOOGLE_CLIENT_ID
npm run dev              # http://localhost:5173
```

`http://localhost:5173` precisa estar em "Origens JavaScript autorizadas" do cliente OAuth no
Google Cloud (mesmo `GOOGLE_CLIENT_ID` usado no back-end). O back-end libera essa origem no CORS
pela variável `FRONT_URL`.

## Tecnologias do semestre

| Tecnologia | Onde |
|---|---|
| Context API + LocalStorage | `context/AuthContext.tsx` (token e usuário) e `context/CarrinhoContext.tsx` (itens), ambos persistidos |
| Login Social | `pages/Login.tsx` com `@react-oauth/google`; o `credential` vai para `POST /auth/google` |
| Upload (Multer + Cloudinary) | `pages/admin/AdminTenis.tsx` envia `FormData` com a foto para `POST /tenis` |
| Consulta com IA | A API preenche pontos fortes/fracos e amortecimento; aparecem em `TenisDetalhe` e há botão "Consultar IA" no admin |
| Dashboard | `pages/admin/AdminDashboard.tsx` com Recharts (5 painéis) |

## Rotas

| Rota | Acesso | Tela |
|---|---|---|
| `/` | público | Vitrine, com escolha por distância (5K, 10K, 42K) e filtros |
| `/tenis/:id` | público | Detalhe, escolha de cor e tamanho, adicionar ao carrinho |
| `/carrinho` | público | Carrinho; continuar exige login de cliente |
| `/checkout` | cliente | Endereço de entrega (CEP preenche o resto via ViaCEP) e finalização do pedido |
| `/login`, `/cadastro` | público | Entrar (Google ou e-mail/senha) e criar conta |
| `/pedidos` | cliente | Meus pedidos e cancelamento |
| `/admin/login` | público | Login do administrador |
| `/admin` | admin | Dashboard |
| `/admin/tenis` | admin | CRUD de tênis (foto + IA) |
| `/admin/tenis/:id/estoque` | admin | Estoque por tamanho e cor |
| `/admin/pedidos` | admin | Pedidos: avançar status e cancelar |
| `/admin/marcas` | admin | Marcas |

`components/RotaProtegida.tsx` redireciona quem não tem o perfil certo para o login correspondente.

## Estrutura

```
src/
  context/      AuthContext, CarrinhoContext
  lib/          api (Axios + token), format (rótulos, moeda)
  components/   Layout, AdminLayout, RotaProtegida, TenisCard, StatusBadge, Aviso
  pages/        Home, TenisDetalhe, Carrinho, Login, Cadastro, MeusPedidos
  pages/admin/  AdminLogin, AdminDashboard, AdminTenis, AdminEstoque, AdminPedidos, AdminMarcas
```

O nome da loja ("Passada") fica em `src/lib/format.ts` (`NOME_LOJA`) e no `index.html`.
