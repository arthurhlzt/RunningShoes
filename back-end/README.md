# API – Loja de Tênis de Corrida

Estoque e venda de tênis de corrida (Olympikus, Adidas, Nike, Asics, New Balance e Fila).
Node.js + Express + TypeScript + Prisma (PostgreSQL).

## Tecnologias do semestre usadas

| Tecnologia | Onde |
|---|---|
| Login Social (`google-auth-library`) | `POST /auth/google` valida o ID Token e devolve o JWT da API |
| Multer + Cloudinary | `POST /tenis` recebe a foto (multipart), envia ao Cloudinary e salva a URL |
| Gemini (`@google/genai`) | Completa pontos fortes/fracos e amortecimento no cadastro do tênis |
| Swagger | `swagger-autogen` + `swagger-ui-express` em `/docs` |
| Dashboard | `GET /dashboard` entrega os dados dos 5 gráficos |

## Banco de dados (Neon)

O banco é PostgreSQL no [Neon](https://neon.tech). São duas strings de conexão:

| Variável | Host | Quem usa |
|---|---|---|
| `DATABASE_URL` | com `-pooler` | A API (Prisma Client) |
| `DIRECT_URL` | sem `-pooler` | Prisma CLI (`migrate dev`, `migrate deploy`), via `directUrl` no `schema.prisma` |

Se você tiver só a string com pooler, a direta é a mesma sem o `-pooler` no host.
Ambas precisam de `sslmode=require`. O `connect_timeout=15` ajuda no primeiro acesso depois
que o Neon "acorda" o banco (ele suspende por inatividade no plano gratuito).

## Como rodar

```bash
npm install
cp .env.example .env        # preencha as variáveis (incluindo as duas do Neon)
npx prisma migrate dev --name init
npm run seed                # marcas, admin, tênis, clientes e pedidos de exemplo
npm run swagger             # gera swagger-output.json
npm run dev                 # http://localhost:3000  (docs em /docs)
```

Seed: admin = `ADMIN_EMAIL` / `ADMIN_SENHA` do `.env`; clientes de exemplo
`cliente1@teste.com`, `cliente2@teste.com`, `cliente3@teste.com` (senha `123456`).

## Rotas

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/auth/cadastro` | público | Cadastro de cliente (e-mail/senha) |
| POST | `/auth/login` | público | Login do cliente |
| POST | `/auth/google` | público | Login Social (body: `{ credential }`) |
| POST | `/auth/admin/login` | público | Login do administrador |
| GET/POST/PUT/DELETE | `/marcas` | GET público; resto admin | CRUD de marcas |
| GET | `/tenis` | público | Vitrine (filtros: `marcaId`, `genero`, `terreno`, `distancia`, `busca`) |
| GET | `/tenis/:id` | público | Detalhe do tênis com variações |
| POST | `/tenis` | admin | Cadastro com foto (multipart) + consulta à IA |
| PUT | `/tenis/:id` | admin | Edição (foto opcional) |
| POST | `/tenis/:id/reconsultar-ia` | admin | Refaz a consulta à IA |
| DELETE | `/tenis/:id` | admin | Exclui (409 se já vendido) |
| POST | `/tenis/:tenisId/variacoes` | admin | Cria variação (tamanho + cor + quantidade) |
| PUT/DELETE | `/variacoes/:id` | admin | Ajusta estoque / exclui variação |
| POST | `/pedidos` | cliente | Cria pedido e baixa o estoque (transação) |
| GET | `/pedidos/meus` | cliente | Pedidos do cliente logado |
| GET | `/pedidos` | admin | Todos os pedidos (`?status=`) |
| GET | `/pedidos/:id` | cliente (próprio) / admin | Detalhe do pedido |
| PATCH | `/pedidos/:id/status` | admin | Avança: PENDENTE → PAGO → ENVIADO |
| PATCH | `/pedidos/:id/cancelar` | cliente (próprio) / admin | Cancela e devolve o estoque |
| GET | `/dashboard` | admin | Faturamento por mês, vendas por marca, mais vendidos, estoque baixo, pedidos por status |

Rotas protegidas usam o header `Authorization: Bearer <token>`.

## Regras de negócio

- **Estoque por variação:** modelo + tamanho + cor (`@@unique([tenisId, tamanho, cor])`).
- **Pedido:** em `$transaction`, cada item faz `updateMany` com `quantidade >= solicitada`
  e `decrement`. Se algum item não tiver estoque, nada é gravado (409).
- **Cancelamento:** só `PENDENTE` ou `PAGO`; devolve o estoque na mesma transação.
- **Pagamento simulado:** o admin apenas avança o status.
- **Entrega:** `POST /pedidos` exige o endereço (`entrega`: telefone, CEP, logradouro, número, complemento opcional, bairro, cidade e UF), gravado no próprio pedido.
- **IA:** consultada uma vez no cadastro e salva no banco. Se falhar, o tênis é salvo sem
  os dados da IA (use `/tenis/:id/reconsultar-ia` depois).
- **Dashboard:** faturamento, vendas por marca e itens mais vendidos consideram pedidos `PAGO` ou `ENVIADO`. O agrupamento mensal usa a data de criação do pedido.

## Deploy no Render e na Vercel

Use a migração versionada e um banco Neon dedicado à loja.

**Render (Web Service com banco Neon)**

- [API publicada](https://running-shoes-api-ozrd.onrender.com/) e [Swagger](https://running-shoes-api-ozrd.onrender.com/docs/).
- Root Directory: raiz do repositório (campo vazio).
- Build Command: `npm --prefix back-end ci --include=dev && npm --prefix back-end run build` (gera o Prisma Client e aplica as migrações).
- Start Command: `npm --prefix back-end start`
- Variáveis: `DATABASE_URL` (com pooler), `DIRECT_URL` (sem pooler; o `migrate deploy` usa), `JWT_KEY`, `GOOGLE_CLIENT_ID`, `GEMINI_API_KEY`, `GEMINI_MODEL`,
  `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
  `FRONT_URL` (URL da Vercel; aceita várias separadas por vírgula).
- O seed atual contém dados e contas de demonstração. Use-o apenas em banco de teste.
- O Swagger usa a origem da API em que a documentação é aberta.

**Vercel (Vite)**

- Root Directory: `front-end`. Configure `VITE_API_URL` com a URL HTTPS do Render e `VITE_GOOGLE_CLIENT_ID` para o login social.

**Google Cloud:** adicione a URL da Vercel em "Origens JavaScript autorizadas" do cliente OAuth.

## Observações

- O pacote `tsx` está em `dependencies` para o `npm start` funcionar no Render sem compilar.
- O pacote `prisma` está em `dependencies` para o build do Render conseguir rodar `prisma generate` e `migrate deploy`.
- Segurança: `helmet` (cabeçalhos) e limite de 20 tentativas falhas por IP a cada 15 min nas rotas de login e cadastro.
- Para conferir os tipos localmente, rode `npx prisma generate` e `npm run typecheck`.

## Atualizar o catálogo de demonstração

Depois de aplicar as migrações e disponibilizar os arquivos de front-end em `public/catalogo`, execute `npx prisma db execute --schema prisma/schema.prisma --file prisma/catalogo.sql` na pasta back-end. O script pode ser executado novamente sem duplicar produtos ou repor o estoque existente. Os modelos antigos do seed com a imagem de demonstração saem da vitrine, mantendo os vínculos com pedidos. Preços e estoque dos novos cadastros são ilustrativos.
