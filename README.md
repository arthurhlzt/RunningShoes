# Running Shoes – Estoque e venda de tênis de corrida

Trabalho de Programação Full Stack (ADS). Loja virtual de tênis de corrida das marcas
Olympikus, Adidas, Nike, Asics, New Balance e Fila, com controle de estoque por modelo,
tamanho e cor, pedidos e painel administrativo.

- [Loja publicada na Vercel](https://running-shoes-loja.vercel.app/)
- [API no Render](https://running-shoes-api-ozrd.onrender.com/) e [Swagger](https://running-shoes-api-ozrd.onrender.com/docs/)

A versão inicial foi gerada com o Claude. A evolução, os ajustes e a validação foram conduzidos por prompts, testes locais e conferência no ambiente publicado.

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
| Baixa de estoque | Ao criar o pedido, o estoque é reservado. O cancelamento devolve as unidades. |
| Pagamento | Simulado: o admin avança o status (PENDENTE, PAGO, ENVIADO) |
| Entrega | Endereço completo informado no checkout (CEP preenche rua, bairro, cidade e UF via ViaCEP) e gravado no próprio pedido |
| Perfis | Cliente (Login Social Google ou e-mail/senha) e Administrador (e-mail/senha) |
| Fotos | Capa e fotos por cor no catálogo de demonstração. Multer e Cloudinary no upload pelo painel. |
| IA (Gemini) | A consulta no cadastro salva pontos fortes, pontos fracos e amortecimento. O administrador pode consultar novamente. Se a IA falhar, o cadastro segue sem os dados gerados. |
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
misturar com tabelas de outros trabalhos.

### 1. Back-end

```bash
cd back-end
npm install
cp .env.example .env        # preencha (veja abaixo)
npx prisma migrate deploy   # aplica as migrações versionadas
npx prisma generate         # gera o Prisma Client
npm run seed                # dados fictícios, somente no banco de desenvolvimento
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

## Validação

- **Conferido em produção** — 18 modelos de seis marcas, 54 fotos, 324 variações e filtros da API. A vitrine e a navegação com **Voltar** também foram conferidas na Vercel.
- **Fluxo do cliente** — login por senha e Google, seleção de cor e tamanho, carrinho, checkout com ViaCEP, pedido no histórico e cancelamento. O pagamento é simulado.
- **Fluxo administrativo** — login e acesso autenticado ao dashboard. A API recebeu o cadastro com JPEG e a foto foi servida pelo Cloudinary. Uma reconsulta ao Gemini gravou pontos fortes, pontos fracos e amortecimento.
- **Conferido em ambiente local** — migração em banco vazio, recusa de pedido acima do estoque, cancelamento simultâneo com uma única devolução, sessão expirada, limite de tentativas de login e os cinco painéis do dashboard.
- **Cobertura complementar** — ainda há cenários a testar na interface, como edição de marcas e variações, endereço no painel de pedidos, tamanhos sem estoque e transição até envio. Também falta simular uma falha do Gemini em ambiente de teste e conferir o cadastro sem os dados gerados.

## Publicação

A Vercel publica o frontend na pasta `front-end`. O Render executa a API e aplica as migrações no Neon. Os comandos e as variáveis estão no [README da API](./back-end/README.md). O Swagger usa a origem da API em que é aberto.
