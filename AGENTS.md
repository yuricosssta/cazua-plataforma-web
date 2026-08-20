# AGENTS.md

Monorepo "Sistema Cazuá" (PropTech SaaS B2B): `BackEnd/` (NestJS + MongoDB) e `FrontEnd/` (Next.js App Router). Código e docs em português.

## Layout & gotchas
- `api-transcreve-audio/` e `frontend-transcreve-audio/` são projetos legados rastreados como gitlinks (mode 160000) com `.git` próprio e **sem `.gitmodules`**. São repositórios separados — nunca faça stage/commit por eles a partir da raiz.
- Não há package.json na raiz; cada subprojeto é seu próprio pacote.
- `documento-arquitetura-vivo.txt` = doc vivo de arquitetura. `BackEnd/README.md` e `FrontEnd/README.md` contêm as regras "inegociáveis".
- `BackEnd/.env` e `FrontEnd/.env` existem localmente. `docker-compose.override.yml` é gitignored (volumes de dev).
- BackEnd traz dumps gerados de referência: `all-controllers.txt`, `all-schemas.txt`, `all-validations.txt`.

## Gerenciador de pacotes
- `pnpm-lock.yaml` commitado em BackEnd e FrontEnd (use `pnpm` para instalar), mas o CI em `BackEnd/workflows/main.yml` ainda roda `npm install`/`npm run test` — mantenha ambos funcionando.
- Alias tsconfig: BackEnd `src/*` -> `./src/*`; FrontEnd `@/*` -> `./src/*`.

## BackEnd (`BackEnd/`)
- NestJS 10, Mongoose, Zod, EventEmitter2 (orientado a eventos); integrações com OpenAI, Cloudflare R2 (storage) e Resend (SMTP). Deploy na Vercel como serverless function única (`vercel.json`).
- Comandos (em `BackEnd/`): `pnpm run start:dev`, `build`, `start:prod` (node dist/main), `test` (jest --config jest.config.ts), `test:e2e` (jest --config ./test/jest-e2e.json), `format`.
- `lint` roda eslint com `--fix` (edita arquivos automaticamente). O ESLint exige nomes de interface com prefixo `I` (PascalCase `I*`).
- **Regras inegociáveis:**
  - Services nunca importam/instanciam Models do Mongoose; só Repositories acessam o banco.
  - IDs do MongoDB sempre validados/instanciados com `new Types.ObjectId(id)`.
  - Cálculos monetários/estoque DEVEM usar mitigação de ponto flutuante (ex: `Precision.round`).
  - Sem hard delete; soft delete via `isActive: false`, condicionado a validações de saldo (`currentStock === 0`).
  - Todo payload validado com DTOs Zod + `ZodValidationPipe` antes dos controllers.
- Multi-tenant: rotas protegidas exigem `Authorization: Bearer <jwt>`, `x-org-id` e `x-org-role` (`OWNER`/`ADMIN`/`MEMBER`).

## FrontEnd (`FrontEnd/`)
- Next.js 15 (App Router), React 18, Redux Toolkit (estado global), Web Storage (preferências locais), Tailwind CSS v4, Shadcn UI.
- Comandos (em `FrontEnd/`): `pnpm run dev`, `build`, `start`, `lint` (`next lint`). Não há config/dependência de ESLint commitada, então `lint` pode exigir setup interativo.
- **Regras inegociáveis de UI/UX (design B2B minimalista e de alto contraste):**
  - Proibido usar cores hexadecimais estáticas ou utilitários `gray`/`slate`/`zinc` para fundo e texto.
  - Dark mode nativo: usar EXCLUSIVAMENTE variáveis semânticas (`bg-background`, `bg-card`, `bg-primary`, `text-foreground`, `border-border`). `stone` permitida só para acentos.
  - Border-radius fixo de 4px — usar `rounded-md` apenas.
  - Ícones exclusivamente via `lucide-react`.
  - Padrão BFF: nenhuma chamada externa de Client Components; tudo via `src/app/api/*`.
- Route groups em `src/app/`: `(auth)`, `(main)` com `account` e `dashboard/{projects,resources,planning,people,storage,marketing,master-admin}`, além de `api/` (camada BFF).
- Env: `NEXT_PUBLIC_API_BASE_URL` (ex: http://localhost:3001), `INTERNAL_API_URL` (docker: http://backend:3001), `NEXT_PUBLIC_INITIAL_MAP_CENTER`, `NEXT_PUBLIC_ROOT_DOMAIN`.
- `middleware.ts` reescreve subdomínios para `src/app/sites/${hostname}` (landing pages multi-tenant); `next.config.ts` usa `output: 'standalone'`.

## Docker
- `docker-compose.yml` raiz: backend + frontend em `app-network`, portas 3001/3000. Dev local: `docker compose up --build -d` (usa o `docker-compose.override.yml` gitignored para mounts).
- O README referencia um `docker-compose.prod.yml` não commitado — não confie nele.

## Verificação
- Sem scripts na raiz. BackEnd: `pnpm run lint` e `pnpm run test`. FrontEnd: `pnpm run build` (type-check); não há testes.
