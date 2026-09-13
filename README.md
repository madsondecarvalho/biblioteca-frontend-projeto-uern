# Biblioteca UERN — Frontend (Next.js)

Frontend completo em **Next.js (App Router) + TypeScript + Tailwind CSS** para a **Biblioteca API** (`http://localhost:3333/api`, OpenAPI 3.0.0, docs em `/api/docs`).

## Requisitos

- Node 18+
- Backend acessível em `http://localhost:3333/api`

## Como rodar

```bash
npm i
cp .env.example .env.local   # já aponta para a API na Vercel
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) e faça login com seu usuário.

## Build

```bash
npm run build
npm start
```

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

## Deploy na Vercel

O projeto já está pronto para deploy (Next.js com defaults, `npm run build` validado).

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
   NEXT_PUBLIC_API_URL=http://localhost:3333/api
   ```
   > Importante: por ser `NEXT_PUBLIC_*`, o valor é embutido no bundle **no momento do build**. Se alterar a variável depois, faça **Redeploy** (sem cache) para valer.
4. Deploy. Cada push em `main` gera um novo deploy de produção automaticamente.

Notas:
- `.env.local` **não** é commitado (está no `.gitignore`); a Vercel usa as variáveis do dashboard.
- Se o front for acessado de outro domínio e a API bloquear CORS, libere o domínio do front no backend.
- Se a API na Vercel estiver com Deployment Protection ativada, o front não conseguirá chamá-la sem bypass — desative em *Project Settings → Deployment Protection* no projeto do backend.

## Critérios de aceite

- Login admin/user persiste; guards por role.
- CRUDs admin com toast + 400/401/403/404/409 tratados.
- Livros filtram + paginam; reserva cria cópia RESERVED e aparece em `/reservations`.
- `npm run build` sem erro TS.
