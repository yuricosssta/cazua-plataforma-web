# Sistema Cazuá - Plataforma PropTech (SaaS B2B)

Repositório central (Monorepo) do Sistema Cazuá, um SaaS B2B orientado a eventos para gestão de obras e projetos, controle de almoxarifado, orçamentação e comunicação corporativa no setor da construção civil.

Este repositório contém a stack completa da aplicação, separada logicamente em diretórios para facilitar o gerenciamento de dependências, deploy (Vercel) e orquestração de contêineres.

## 📂 Estrutura do Repositório

```text
/
├── BackEnd/        # API RESTful (NestJS, MongoDB, Zod, EventEmitter2)
├── FrontEnd/       # Interface de Usuário (Next.js App Router, Redux, Tailwind v4, Shadcn UI)
├── docker-compose.yml
└── README.md       # Documentação global

```

## 🛑 Regras Arquiteturais Inegociáveis (Global)

O projeto segue padrões rígidos de desenvolvimento para garantir escalabilidade e consistência.

### Back-End

1. **Padrão de Repositório:** Isolamento absoluto da camada de banco de dados. `Services` orquestram regras de negócio; `Repositories` acessam o Mongoose. Um Service nunca instancia um Model diretamente.
2. **Tratamento de IDs:** IDs do MongoDB devem ser validados e instanciados usando `new Types.ObjectId(id)`.
3. **Precisão Financeira:** Cálculos monetários e de estoque utilizam mitigação de ponto flutuante (ex: `Precision.round`).
4. **Deleção Lógica (Soft Delete):** A exclusão física de registros é proibida. Utilize `isActive: false` estritamente condicionado a regras de negócio (ex: estoque zerado).
5. **Validação:** Todo payload deve ser validado via DTOs usando Zod (`ZodValidationPipe`) antes dos controllers.

### Front-End

1. **Design System & Dark Mode:** Uso exclusivo de variáveis semânticas do Tailwind (`bg-background`, `bg-card`, `text-foreground`, `border-border`). É estritamente proibido usar classes de cores hexadecimais estáticas ou utilitários padrão (ex: `slate`, `zinc`).
2. **Geometria:** O border-radius padrão do sistema é cravado em 4px (`rounded-md`).
3. **Ícones:** Permitido exclusivamente o uso da biblioteca `lucide-react`.
4. **Comunicação (BFF):** Nenhuma chamada à API externa é feita diretamente por Client Components. Todas as requisições passam pela camada BFF em `src/app/api`.

## 🚀 Como Rodar o Projeto (Docker)

A aplicação possui orquestração global via Docker Compose para ambiente de desenvolvimento e produção.

### 1. Configuração de Variáveis de Ambiente

Certifique-se de configurar os arquivos `.env` em seus respectivos diretórios antes de iniciar os serviços:

```bash
cp BackEnd/.env.example BackEnd/.env
cp FrontEnd/.env.example FrontEnd/.env

```

### 2. Execução dos Serviços

Na raiz do repositório, levante a infraestrutura completa:

```bash
docker-compose up --build -d

```

* **BackEnd:** Disponível na rede interna `app-network` e exposto para o host na porta configurada (Padrão: `3001`).
* **FrontEnd:** Disponível no host na porta `3000` (ou a definida no FrontEnd).

Para ambientes de produção, utilize os arquivos de sobrescrita correspondentes:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

```

---

> Para documentações específicas de configuração de infraestrutura, rotas da API, integrações (Cloudflare R2, OpenAI, Resend) e componentes de UI, consulte os arquivos `README.md` localizados nas pastas `/BackEnd` e `/FrontEnd`.

---
