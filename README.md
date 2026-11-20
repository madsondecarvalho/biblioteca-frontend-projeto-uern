# Biblioteca UERN — Frontend (Next.js)

[![CI](https://github.com/madsondecarvalho/biblioteca-frontend-projeto-uern/actions/workflows/ci.yml/badge.svg)](https://github.com/madsondecarvalho/biblioteca-frontend-projeto-uern/actions/workflows/ci.yml)

Frontend completo em **Next.js (App Router) + TypeScript + Tailwind CSS** para a **Biblioteca API** (OpenAPI 3.0.0, docs em `/api/docs`). A URL da API é configurada em `NEXT_PUBLIC_API_URL`.

## Requisitos

- Node 18+
- Backend acessível na URL configurada em `NEXT_PUBLIC_API_URL` (ex.: `http://localhost:3333/api`)

## Como rodar

```bash
npm i
cp .env.example .env.local   # já aponta para a API local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) e faça login com seu usuário.

## Build

```bash
npm run build
npm start
```

## Testes

Testes unitários e de componentes com **Vitest + React Testing Library**.

```bash
npm test               # executa toda a suíte uma vez
npm run test:watch     # modo watch
npm run test:coverage  # cobertura (relatório HTML em coverage/)
```

Estrutura:

- `src/__tests__/app/` — uma suíte para cada tela (`login`, dashboard, livros, detalhe/novo/edição de livro, autores, categorias, cópias, reservas, usuários e 404).
- `src/__tests__/components/` — guards, paginação e shell da aplicação.
- `src/__tests__/lib/` — schemas, services, hooks, contexto de auth, API, tipos e utilitários.
- `src/test/` — fixtures compartilhadas e helper de render com `QueryClientProvider`.
- `vitest.setup.ts` — `jest-dom`, limpeza de mocks/localStorage entre testes.

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda em todo push/PR para `main`: instala com `npm ci`, executa lint, verificação de tipos, testes com cobertura e build de produção. Em pushes para `main`, após o sucesso do job `quality`, o job `deploy` dispara o webhook do Render. O relatório de cobertura fica disponível como artifact da execução.

A documentação detalhada do pipeline está em [`docs/CI.md`](docs/CI.md).


## Funcionalidades

- **Auth JWT**: `POST /login`, token + user em `localStorage` + `AuthContext`, interceptor axios, 401 → logout + `/login`.
- **Guards**: `/login` pública; `/`, `/books`, `/reservations` exigem login; `/admin/*` e telas de escrita exigem `role === 'admin'`.
- **Rotas**:
  - `/login` — form zod, erro `Email ou senha inválidos`.
  - `/` — dashboard (totais de livros, cópias AVAILABLE, reservas PENDING, usuários se admin).
  - `/books` — grid com busca + filtros `?categoryId=&authorId=&page=&limit=`, paginação, CRUD admin.
  - `/books/[id]` — detalhe + cópias `GET /copies?bookId=` com badge de status e botão Reservar (`POST /reservations`, trata 409).
  - `/books/new`, `/books/[id]/edit` (admin) — form `BookInput`.
  - `/authors`, `/categories` — tabela paginada + CRUD modal (admin, trata 409).
  - `/copies` — filtros `?bookId=&status=`, CRUD modal `CopyInput` (admin), reservar direto.
  - `/reservations` — `GET ?status=PENDING|PICKED_UP|CANCELLED|EXPIRED`; admin transiciona `PUT { status }` + DELETE.
  - `/users` (admin) — CRUD `UserInput` / `UserUpdateInput`.
- **UI**: Tailwind + componentes estilo shadcn (`button, input, select, dialog, table, badge, card, skeleton`), `sonner` Toaster, skeletons, empty states, 404, pt-BR.

## Camada `lib/`

- `lib/api.ts` — axios + interceptores.
- `lib/types.ts` — types fiéis ao swagger (`Book, Author, Category, Copy, Reservation, User, ...`).
- `lib/services.ts` — funções para todos os paths `/login, /books, /authors, /categories, /copies, /reservations, /users`.
- `lib/hooks.ts` — React Query (`useBooks`, `useBook`, `useAuthors`, `useCategories`, `useCopies`, `useReservations`, `useUsers`).
- `lib/auth-context.tsx` — `login/logout`, `useRequireAuth()`, guards.
- `lib/schemas.ts` — zod espelhando `minLength`, `email`, `minimum:1`, enums.

## Env

```
NEXT_PUBLIC_API_URL=http://localhost:3333/api
```

## Deploy no Render

O deploy de produção é disparado pelo CI **somente depois** que lint, verificação de tipos, testes e build passam em um push para `main`.

1. No Render, abra o serviço → **Settings → Deploy Hook** e copie a URL do webhook.
2. No GitHub, vá em **Settings → Secrets and variables → Actions → New repository secret** e cadastre:
   - **Name:** `RENDER_DEPLOY_HOOK_URL`
   - **Secret:** a URL completa do deploy hook do Render
3. Cada push em `main` que passar pelo job `quality` executa o job `deploy`, que faz um `POST` nessa URL.
4. Se o Render estiver com **Auto-Deploy** habilitado, desative para evitar dois deploys (um automático e outro via CI).

> O secret não aparece nos logs. Se ele não estiver cadastrado, o job `deploy` falha com uma mensagem explícita.

No Render, configure também a variável `NEXT_PUBLIC_API_URL` apontando para a API. Por ser `NEXT_PUBLIC_*`, ela é embutida no bundle durante o build.

## Deploy na Vercel (alternativa)

O projeto também pode ser publicado na Vercel:

1. Suba o código para o GitHub:
   ```bash
   git add -A
   git commit -m "feat: frontend biblioteca UERN"
   git branch -M main
   git remote add origin <url-do-repo>  # se ainda não houver remoto
   git push -u origin main
   ```
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório. O framework **Next.js** é detectado automaticamente (build: `npm run build`, output: `.next`).
3. Em **Settings → Environment Variables**, adicione (nos 3 ambientes: Production, Preview e Development):
   ```
   NEXT_PUBLIC_API_URL=https://<url-do-backend>/api
   ```
   > Importante: por ser `NEXT_PUBLIC_*`, o valor é embutido no bundle **no momento do build**. Se alterar a variável depois, faça **Redeploy** (sem cache) para valer.
4. Deploy. Cada push em `main` gera um novo deploy de produção automaticamente.

Notas:
- `.env.local` **não** é commitado (está no `.gitignore`); a Vercel usa as variáveis do dashboard.
- Se o front for acessado de outro domínio e a API bloquear CORS, libere o domínio do front no backend.
- Se a API na Vercel estiver com Deployment Protection ativada, o front não conseguirá chamá-la sem bypass — desative em *Project Settings → Deployment Protection* no projeto do backend.

## Problemas comuns

- **POST /login retorna 405 Method Not Allowed**: a requisição está caindo no próprio front em vez da API (página Next só aceita GET). Abra o DevTools → Network → clique no POST com falha e veja a **Request URL**:
  - Se for `https://<seu-front>.vercel.app/login`, a `NEXT_PUBLIC_API_URL` está errada/ausente no build. Confira na Vercel que ela vale `https://<seu-backend>.vercel.app/api` (terminando em `/api`, sem `/docs`), marcada para **Production**, e faça **Redeploy sem cache**.
  - Se a Request URL já for a do backend e o 405 persistir, o problema está no backend (rota `POST /login` não registrada ou rewrite da Vercel capturando a rota).

## Critérios de aceite

- Login admin/user persiste; guards por role.
- CRUDs admin com toast + 400/401/403/404/409 tratados.
- Livros filtram + paginam; reserva cria cópia RESERVED e aparece em `/reservations`.
- `npm run build` sem erro TS.
