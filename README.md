# Running Shoes – Estoque e venda de tênis de corrida

Trabalho de Programação Full Stack (ADS). Loja virtual de tênis de corrida das marcas
Olympikus, Adidas, Nike, Asics, New Balance e Fila, com controle de estoque por modelo,
tamanho e cor, pedidos e painel administrativo.

```
loja-tenis-corrida/
  README.md       este arquivo (visão geral, decisões e roteiro)
  back-end/       API Node.js + Express + TypeScript + Prisma (PostgreSQL no Neon)
  front-end/      React + Vite + TypeScript + Tailwind CSS
```

## Decisões do projeto

| Tema | Decisão |
|---|---|
| Modelo de venda | Loja virtual (carrinho e pedido) |
| Estoque | Por variação: modelo + tamanho + cor |
| Baixa de estoque | Ao criar o pedido (reserva na hora); cancelar devolve o estoque |
| Pagamento | Simulado: o admin avança o status (PENDENTE, PAGO, ENVIADO) |
| Entrega | Endereço completo informado no checkout (CEP preenche rua, bairro, cidade e UF via ViaCEP) e gravado no próprio pedido |
| Perfis | Cliente (Login Social Google ou e-mail/senha) e Administrador (e-mail/senha) |
| Fotos | Uma por tênis (Multer + Cloudinary) |
| IA (Gemini) | Consultada uma vez no cadastro e salva no banco: pontos fortes, pontos fracos e amortecimento. Se falhar, o cadastro segue sem esses dados. Tipo de pisada foi descartado (é característica da pessoa, não do tênis) |
| Campos do tênis | Marca, modelo, preço, gênero, terreno (asfalto/trilha), distância (5K/10K/maratona), drop e peso |
| Dashboard (admin) | Faturamento por mês, vendas por marca, mais vendidos, estoque baixo por variação e pedidos por status |
| Front-end | Context API (Auth e Carrinho separados) + LocalStorage; Vite + React + TypeScript + React Router + Axios + Tailwind |
| Organização | Loja e painel admin no mesmo app, com rotas protegidas (`/admin/...`) |
| Swagger | Rotas principais (login, tênis, pedidos, dashboard) detalhadas; todas as rotas agrupadas por tag. `swagger-output.json` já vem gerado |
| Segurança | `helmet`, limite de 20 tentativas falhas por IP/15 min no login e cadastro, senhas com bcrypt, JWT de 8 h; no front, sessão expirada volta ao login com aviso |
| Banco | PostgreSQL no Neon, um único banco |

## Tecnologias do semestre

Login Social e OAuth 2.0 · Multer + Cloudinary · Swagger · Dashboards (Recharts) ·
Context API + LocalStorage · Consulta com IA (Gemini) · Deploy (Render + Vercel).

## Como rodar localmente

**Pré-requisito:** projeto no Neon com um **database novo** (ex.: `loja_tenis`), para não
misturar com tabelas de outros trabalhos (o `prisma migrate dev` pede reset se o banco não estiver vazio).

### 1. Back-end

```bash
cd back-end
npm install
cp .env.example .env        # preencha (veja abaixo)
npx prisma migrate dev --name init
npm run seed
npm run swagger
npm run dev                 # http://localhost:3000  (docs em /docs)
```

Variáveis do `.env`:

| Variável | Observação |
|---|---|
| `DATABASE_URL` | String do Neon **com pooler** (host com `-pooler`) |
| `DIRECT_URL` | String do Neon **sem pooler** (usada pelo Prisma CLI) |
| `JWT_KEY` | Qualquer texto longo e aleatório |
| `ADMIN_EMAIL`, `ADMIN_SENHA` | Credenciais do administrador criado pelo seed |
| `GOOGLE_CLIENT_ID` | Mesmo Client ID usado no front-end |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Chave do Google AI Studio e modelo |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Credenciais do Cloudinary |
| `FRONT_URL` | Origem liberada no CORS (`http://localhost:5173` em desenvolvimento) |

Não versione o `.env` (já está no `.gitignore`) e nunca compartilhe as strings do banco.

### 2. Front-end

```bash
cd front-end
npm install
cp .env.example .env        # VITE_API_URL e VITE_GOOGLE_CLIENT_ID
npm run dev                 # http://localhost:5173
```

No Google Cloud, `http://localhost:5173` deve estar em "Origens JavaScript autorizadas" do cliente OAuth.

## Checklist de validação (antes do deploy)

**Banco e API**
- [ ] `npm run dev` sobe sem erro (o client do Prisma é gerado pelo `migrate dev`)
- [ ] `migrate dev` cria as 7 tabelas sem pedir reset
- [ ] `npm run seed` conclui; tabelas `marcas`, `tenis`, `variacoes`, `clientes`, `admins`, `pedidos`, `itens_pedido` com dados no painel do Neon
- [ ] `/docs` abre e lista as rotas principais
- [ ] `POST /auth/admin/login` devolve token; com ele, `GET /dashboard` responde

**Fluxo do cliente**
- [ ] Cadastro e login com e-mail/senha
- [ ] Login com Google (cria o cliente na primeira vez)
- [ ] Vitrine com filtro por distância, marca, gênero e terreno
- [ ] Detalhe: escolher cor e tamanho; tamanho sem estoque fica desabilitado
- [ ] Carrinho persiste ao recarregar a página (F5)
- [ ] Checkout: CEP preenche o endereço; telefone e campos obrigatórios são validados
- [ ] Finalizar pedido: estoque da variação diminui
- [ ] Pedido com quantidade maior que o estoque é recusado, sem gravar nada
- [ ] Cancelar pedido: status CANCELADO e estoque devolvido

**Fluxo do administrador**
- [ ] Login em `/admin/login`; cliente não acessa `/admin`
- [ ] Token inválido/expirado: o front volta ao login com o aviso "Sua sessão expirou"
- [ ] 21 tentativas de login erradas seguidas: a API responde 429 (depois de 15 min libera)
- [ ] Cadastrar tênis com foto: imagem vai ao Cloudinary e a IA preenche pontos fortes/fracos e amortecimento
- [ ] Com a chave da IA inválida: o tênis ainda é salvo, e "Consultar IA" refaz depois
- [ ] Cadastrar e ajustar variações (tamanho + cor + quantidade)
- [ ] Pedidos do admin mostram telefone e endereço de entrega
- [ ] Avançar status do pedido: PENDENTE, PAGO, ENVIADO
- [ ] Dashboard mostra os 5 painéis (faturamento por mês, status, marca, mais vendidos, estoque baixo)

## Verificações já feitas (neste ambiente, sem banco)

- Front-end: `npm run build` passa (TypeScript + bundle).
- Contrato front x back: as 27 chamadas de API do front têm rota correspondente no back (mesmo método e caminho).
- Swagger: `npm run swagger` gera 18 rotas, todas com tag; corpos JSON, upload multipart (campo `foto` como arquivo) e Bearer conferidos.
- Back-end: checagem de tipos sem erros além dos que dependem do client do Prisma, que só existe depois de `prisma generate`/`migrate dev`.

**Só passa a ser verificado quando você rodar:** conexão com o Neon, migração, seed, transações de
pedido/cancelamento, Login Social, Cloudinary, Gemini e a aparência das telas no navegador.

## Próxima etapa: deploy

Depois da validação local: **Render** (back-end, Web Service) e **Vercel** (front-end).
O roteiro com variáveis, comandos de build/start e ajustes (CORS, origens do Google,
URL no Swagger) está em `back-end/README.md`, na seção "Deploy".

Já preparado para o deploy:
- `front-end/vercel.json` (rewrite para o React Router: recarregar `/admin` ou `/carrinho` não dá 404).
- `prisma` em `dependencies` e `engines.node >= 20` (o build do Render roda `prisma generate` e `migrate deploy`).
- `swagger-output.json` incluído (precisa estar no repositório; ao publicar, troque `servers.url` no `swagger.ts` pela URL do Render e rode `npm run swagger`).
- `trust proxy` ativado para o limite de tentativas enxergar o IP real atrás do Render.
