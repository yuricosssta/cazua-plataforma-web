# BackEnd API - Sistema Cazuá (PropTech SaaS B2B)

API RESTful orientada a eventos e baseada em micro-serviços lógicos, desenvolvida para gestão de obras e projetos, controle de almoxarifado, orçamentação e comunicação para o setor da construção civil. Construída com [NestJS](https://nestjs.com/), MongoDB (Mongoose), JWT, Zod, EventEmitter2 e integrações com OpenAI, Cloudflare R2 e SMTP (Resend).


## 🛑 Regras Arquiteturais Inegociáveis

Esta aplicação segue padrões rígidos para garantir escalabilidade, precisão e manutenibilidade. É estritamente proibido ignorar as regras abaixo ao desenvolver novas features ou abrir PRs:

1. **Padrão de Repositório Estrito:** Isolamento absoluto da camada de dados. `Services` orquestram regras de negócio e disparam eventos; `Repositories` acessam o Mongoose. Um Service **nunca** deve importar ou instanciar um Model do Mongoose diretamente.
2. **Tratamento de IDs do MongoDB:** Ao buscar ou manipular referências no banco, valide e instancie estritamente os IDs usando `new Types.ObjectId(id)`.
3. **Precisão Financeira e de Estoque:** Qualquer cálculo monetário ou manipulação de quantidades de estoque DEVE utilizar mitigação de ponto flutuante via bibliotecas de precisão (ex: `Precision.round`).
4. **Deleção de Dados (Soft Delete):** Nenhum registro transacional ou relacional é excluído fisicamente. Utilize sempre deleção lógica (`isActive: false`), estritamente condicionada a validações de saldo e dependências (ex: `currentStock === 0`).
5. **Validação de Entrada (Zod):** Todo payload transita por DTOs e deve ser validado obrigatoriamente usando `ZodValidationPipe` antes de atingir a lógica do Controller.

---

## 🚀 Como Rodar

### 1. Configuração de Ambiente

Na raiz do diretório `BackEnd`, crie o arquivo `.env` baseado no exemplo fornecido:

```bash
cp .env.example .env

```

### 2. Instalação e Execução Local

```bash
# Instalar dependências
pnpm install

# Rodar em modo desenvolvimento
pnpm run start:dev

# Build e execução para produção
pnpm run build
pnpm run start:prod

```

> O lockfile versionado é o `pnpm-lock.yaml` (use `pnpm`). O CI em `workflows/main.yml` ainda roda `npm install`/`npm run test` — mantenha ambos funcionando.

### 3. Docker

```bash
docker-compose up --build -d

```

O serviço ficará exposto na porta definida na variável `PORT` (Padrão: `3001`).

---

## ⚙️ Variáveis de Ambiente Mapeadas

| Categoria | Variáveis |
| --- | --- |
| **Aplicação & JWT** | `PORT`, `NODE_ENV`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL` |
| **Banco de Dados** | `MONGO_URI`, `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD` |
| **Armazenamento (R2)** | `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_DOMAIN` |
| **Mensageria (Resend)** | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` |
| **Inteligência** | `OPENAI_API_KEY` |
| **Administração** | `SUPER_ADMIN_EMAIL` *(Definido na infra para acessos Master)* |

---

## 🏢 Arquitetura Multi-Tenant e RBAC

O sistema opera em um modelo SaaS B2B, com isolamento lógico de dados por Organização (`orgId`).
A autenticação primária exige token JWT no header `Authorization: Bearer <token>`.

As rotas protegidas que manipulam dados empresariais requerem headers de contexto:

* `x-org-id`: ID da organização atual ativa.
* `x-org-role`: Nível de acesso do usuário no escopo daquela organização (`OWNER`, `ADMIN`, `MEMBER`).

---

## 📦 Domínios e Endpoints Principais

### Obras & Projetos (Módulo Core) - `/organizations/:orgId/projects`

Orquestra o ciclo de vida das demandas de construção e alocação de equipes.

* **POST `/**`: Criação de nova demanda/obra.
* **POST `/bulk-import**`: Importação estruturada em massa (Restrito a `ADMIN`/`OWNER`).
* **GET `/timeline**`: Timeline unificada de projetos da organização.
* **POST `/:projectId/parecer**`: Emissão de parecer técnico e definição de métricas de prioridade.
* **Membros**: Endpoints associados à alocação (`assign`) e remoção de colaboradores nas obras.

### Recursos & Almoxarifado - `/organizations/:orgId/resources`

Gestão de inventário, aprovação e rastreabilidade de materiais alocados.

* **Catálogo & Estoque**: Criação de recursos, entrada de estoque (`stock`) e desativação (`inactivate`).
* **Transações**: Controle de requisições de material via `request`, `approve`, `reject`, `allocate-direct`, `return` e `cancel`.
* **Extratos**: Geração de statements (`/statement/:projectId`) para auditoria de consumo por obra.
* **Equipe Técnica**: Gestão de membros com permissão de almoxarife.

### Gestão Organizacional - `/organizations`

* Endpoints para criação de tenants, convites de membros, definição de regras de acesso (RBAC) e atualização de configurações e planos operacionais.

### Planejamento & Custos - `/planning`

* Processamento e busca agrupada de dados orçamentários, planilhas de composição e custos. O upload de bases (`/upload` e `/upload-costs`) é estritamente reservado ao Master Admin.

### Storage & Assets - `/storage`

* **POST `/presigned-url**`: Geração de URLs seguras do Cloudflare R2 com validação de limite de franquia/plano.
* **POST `/confirm-upload**`: Registro no banco e dedução de cota de armazenamento corporativo.
* **DELETE `/assets/:id**`: Exclusão de arquivos (Restrito a `ADMIN`/`OWNER`).

### Serviços Auxiliares

* **Autenticação (`/auth`) & Usuários (`/users`)**: Gerenciamento de credenciais, perfis, reset de senha.
* **IA e Automações**:
* `/summary`: Geração de resumos em texto suportados pela OpenAI.
* `/transcription`: Transcrição de áudio via arquivos físicos.


* **Posts (`/posts`)**: Feed geral e busca.

---

## 🧰 Comandos de Manutenção

```bash
pnpm run lint       # Auditoria estática de código (ESLint) — roda com --fix
pnpm run format     # Formatação (Prettier)
pnpm run test       # Execução da suíte unitária
pnpm run test:e2e   # Execução de testes de integração e fluxo

```

---

## 🗄️ Backup Automatizado do MongoDB (Cloudflare R2)

O backup do banco de dados MongoDB Atlas é feito automaticamente para o bucket **Cloudflare R2** configurado nas variáveis de ambiente (`R2_*`).

### Arquitetura

| Componente | Responsabilidade |
|------------|------------------|
| **GitHub Actions** | Scheduler (cron `0 2 * * *` UTC + manual `workflow_dispatch`) |
| **Script `backup-mongo.sh`** | `mongodump` → gzip → upload R2 + artifact no GitHub |
| **Script `restore-mongo.sh`** | Download R2 → `mongorestore` (suporta cluster alvo via `TARGET_MONGO_URI`) |
| **Docker Compose (local)** | Wrapper para rodar scripts localmente (profile `tools`) |

### Estrutura

```
BackEnd/
├── scripts/
│   ├── backup-mongo.sh       # Backup + upload R2
│   ├── restore-mongo.sh      # Restore (aceita TARGET_MONGO_URI externo)
│   └── r2-utils.sh           # Helpers: list, delete, presign, download
├── Dockerfile.backup         # Imagem mongo:8-tools + aws-cli
└── .github/workflows/
    └── mongo-backup.yml      # GitHub Actions workflow
```

### Produção (GitHub Actions)

- **Automático:** Todo dia às **02:00 UTC** (23:00 BRT)
- **Manual:** GitHub Actions → "Run workflow" → botão "Run workflow"
- **Confirmação:** Aba **Summary** do run mostra arquivo, bucket, timestamp, tamanho
- **Download local:** Aba **Artifacts** → `mongo-backup-<run_id>` (expira em 7 dias)
- **Retenção no R2:** 7 dias (configurável no `workflow_dispatch`)

### Local (Docker Compose)

```bash
# Build da imagem
docker compose build mongo-backup

# Backup manual
docker compose --profile tools run --rm mongo-backup /app/scripts/backup-mongo.sh

# Listar backups no R2
docker compose --profile tools run --rm mongo-backup /app/scripts/r2-utils.sh list

# Restore local (mesmo cluster)
docker compose --profile tools run --rm mongo-restore /app/scripts/restore-mongo.sh mongo_20250925_020000.tar.gz

# Restore em OUTRO cluster
TARGET_MONGO_URI="mongodb+srv://user:pass@outro-cluster.mongodb.net/db" \
docker compose --profile tools run --rm mongo-restore /app/scripts/restore-mongo.sh mongo_20250925_020000.tar.gz

# Restore com --drop (recria collections)
docker compose --profile tools run --rm mongo-restore /app/scripts/restore-mongo.sh mongo_20250925_020000.tar.gz --drop
```

### Secrets Necessários (GitHub Settings → Secrets → Actions)

| Secret | Valor |
|--------|-------|
| `MONGO_URI` | URI completa do Atlas (com user/pass/db) |
| `R2_ENDPOINT` | `https://<account_id>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | Access Key do R2 |
| `R2_SECRET_ACCESS_KEY` | Secret Key do R2 |
| `R2_BUCKET_NAME` | Nome do bucket (ex: `cazua-assets-prod`) |

### Prefixo no Bucket

Backups ficam em: `s3://${R2_BUCKET_NAME}/backups/mongo/mongo_YYYYMMDD_HHMMSS.tar.gz`

> Para gotchas operacionais, comandos e o restante das regras inegociáveis, consulte o `AGENTS.md` na raiz do monorepo.
