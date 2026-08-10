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
npm install

# Rodar em modo desenvolvimento
npm run start:dev

# Build e execução para produção
npm run build
npm run start:prod

```

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
npm run lint       # Auditoria estática de código (ESLint)
npm run format     # Formatação (Prettier)
npm run test       # Execução da suíte unitária
npm run test:e2e   # Execução de testes de integração e fluxo

```
