
# Front-End - Sistema Cazuá (PropTech SaaS B2B)

Interface web do SaaS para gestão de obras, controle de almoxarifado, orçamentação e comunicação corporativa no setor de construção civil. Desenvolvida com Next.js (App Router), implementa o padrão BFF (Backend For Frontend) e obedece a um design system B2B minimalista e de alto contraste.

---

## 🛠️ Stack Tecnológica

* **Framework:** Next.js (App Router) + React 18
* **Estado Global:** Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
* **Estado Local/Preferências:** Web Storage API
* **Estilização:** Tailwind CSS v4
* **Componentes UI:** Shadcn UI
* **Ícones:** `lucide-react`
* **Requisições HTTP:** Axios (via BFF)

---

## 🛑 Regras Arquiteturais e de UI/UX Inegociáveis

Para garantir a consistência visual, suporte automático a Dark Mode e manutenibilidade do código, as seguintes regras devem ser estritamente seguidas ao desenvolver novos componentes ou telas:

1. **Uso de Variáveis Semânticas (Dark Mode Nativo):**
* É **estritamente proibido** o uso de classes de cores utilitárias genéricas (ex: `bg-gray-100`, `bg-slate-100`, `text-zinc-900`, cores hexadecimais estáticas) para superfícies, fundos e textos principais.
* Utilize exclusivamente as variáveis semânticas do Shadcn/Tailwind: `bg-background`, `bg-card`, `bg-primary`, `text-foreground`, `text-muted-foreground`, `border-border`.
* A escala `stone` está autorizada unicamente para detalhes específicos de acento.


2. **Geometria:** O border-radius padrão do sistema é `4px`. Utilize estritamente a classe `rounded-md` do Tailwind.
3. **Ícones:** Permitido exclusivamente o uso da biblioteca `lucide-react`.
4. **Padrão BFF (Backend For Frontend):** Nenhuma chamada direta à API externa deve ser feita a partir de Client Components. Toda requisição deve passar pelas rotas internas em `src/app/api`, protegendo credenciais e tokens.

---

## 📁 Estrutura de Domínios (App Router)

A navegação e divisão de módulos utiliza Route Groups para separar contextos:

```text
src/app/
├── (auth)/                # Fluxos deslogados (Login, Cadastro, Recuperação de Senha)
├── (main)/
│   ├── account/           # Configurações corporativas, perfil e segurança
│   └── dashboard/         # Core Operacional do SaaS B2B
│       ├── projects/      # Gestão de Obras, Demandas e Pareceres
│       ├── resources/     # Almoxarifado, Estoque e Transações
│       ├── planning/      # Orçamentos e Composições de Custo
│       ├── people/        # Gestão de Equipes (RBAC)
│       ├── storage/       # Acervo Digital (Cloudflare R2)
│       ├── marketing/     # Automações de IA (Reels/Resumos)
│       └── master-admin/  # Painel de Controle de Tenants (Super Admin)
├── api/                   # Camada BFF (Proxy para o NestJS backend)

```

---

## ⚙️ Configuração e Execução

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto contendo as seguintes definições:

```env
# URL base pública da API (Acessada via BFF)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# URL usada pelo Next.js BFF na Rede Docker interna
INTERNAL_API_URL=http://backend:3001

# Coordenadas Iniciais para Módulos de Mapa/Geolocalização
NEXT_PUBLIC_INITIAL_MAP_CENTER=-43.79, -20.65

# Domínio raiz (usado pelo middleware.ts para landing pages multi-tenant)
NEXT_PUBLIC_ROOT_DOMAIN=grupocazua.com.br

```

### 2. Instalação e Execução Local

```bash
# Instale as dependências
pnpm install

# Inicie o servidor em modo de desenvolvimento
pnpm run dev

# Acesse a aplicação em http://localhost:3000

```

> O lockfile versionado é o `pnpm-lock.yaml` (use `pnpm`).

### 3. Build e Produção

```bash
# Gere o build estático/otimizado
pnpm run build

# Inicie a aplicação em produção
pnpm run start

```

### 4. Execução via Docker

A orquestração de contêineres está configurada na infraestrutura raiz do projeto. Para iniciar o frontend de forma isolada via Docker:

```bash
docker-compose up --build -d

```

O serviço será exposto na porta mapeada (padrão `3000` ou `8080`, dependendo da definição no seu `docker-compose.yml`).

---

## 🏢 Multi-Tenancy

O `middleware.ts` na raiz do projeto reescreve subdomínios não-raiz para `src/app/sites/${hostname}` (landing pages multi-tenant), usando `NEXT_PUBLIC_ROOT_DOMAIN`. Ajustes de roteamento por subdomínio devem ser feitos nesse arquivo.

> Para gotchas operacionais, comandos e o restante das regras inegociáveis, consulte o `AGENTS.md` na raiz do monorepo.
