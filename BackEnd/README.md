# BackEnd API - Grupo Cazua

API RESTful para gerenciamento de usuários, autenticação, posts e recursos adicionais, construída com [NestJS](https://nestjs.com/), MongoDB, JWT e integrações como OpenAI, Cloudflare R2 e SMTP.

---

## 🚀 Como rodar

### 1. Configure o arquivo `.env`

Na pasta `BackEnd`, copie o arquivo de exemplo e preencha com suas variáveis reais:

```bash
cp BackEnd/.env.example BackEnd/.env
```

### 2. Instale dependências

```bash
cd BackEnd
npm install
```

### 3. Execute localmente

```bash
npm run start:dev
```

A API ficará disponível em `http://localhost:3001`.

### 4. Execute com Docker

```bash
cd BackEnd
docker-compose up --build
```

O serviço é exposto em `http://localhost:3001`.

---

## ⚙️ Variáveis de ambiente principais

- `PORT` – porta onde o serviço escuta (`3001`).
- `MONGO_URI` – string de conexão MongoDB.
- `JWT_SECRET` – segredo para geração de tokens.
- `JWT_EXPIRES_IN` – tempo de expiração do JWT.
- `OPENAI_API_KEY` – chave da OpenAI (quando necessário).
- `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_DOMAIN` – configurações do Cloudflare R2.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` – configurações para envio de e-mails.
- `FRONTEND_URL` – URL do frontend para redirecionamentos e links em e-mails.

---

## 📦 Endpoints principais

### Autenticação

- **POST /auth/login**
  - Autentica um usuário e retorna um token JWT.
  - Exemplo de corpo:

```json
{
  "email": "admin@admin.com",
  "password": "12345678"
}
```

- **GET /auth/profile**
  - Retorna o perfil do usuário autenticado.
  - Header: `Authorization: Bearer <token>`

---

### Usuários

- **GET /users**
  - Lista todos os usuários (apenas admin).

- **POST /users**
  - Cria um novo usuário (apenas admin).

```json
{
  "email": "user@email.com",
  "name": "Nome",
  "password": "senha",
  "isAdmin": false,
  "rule": 2
}
```

- **GET /users/:userId**
  - Busca usuário por ID.

- **PUT /users/:userId**
  - Atualiza usuário (apenas admin).

- **DELETE /users/:userId**
  - Remove usuário (apenas admin).

---

### Posts

- **GET /posts**
  - Lista todos os posts.

- **GET /posts/:postId**
  - Busca post por ID.

- **POST /posts**
  - Cria um novo post (usuário autenticado).

```json
{
  "title": "Título",
  "description": "Descrição",
  "content": "Conteúdo"
}
```

- **PUT /posts/:postId**
  - Atualiza um post.

- **DELETE /posts/:postId**
  - Remove um post.

---

## 🔒 Autenticação

- Use `/auth/login` para obter um token JWT.
- Envie o token no header `Authorization`:

```http
Authorization: Bearer <token>
```

---

## 🧰 Comandos úteis

```bash
npm run start       # Inicia em modo de produção
npm run start:dev   # Inicia em modo de desenvolvimento com watch
npm run build       # Compila o projeto
npm run lint        # Executa ESLint
npm run format      # Formata o código
npm run test        # Executa testes unitários
npm run test:e2e    # Executa testes end-to-end
```

---

## 🔍 Documentação

Swagger estará disponível em:

`http://localhost:3001/api`

---

## 📝 Observações

- O backend usa `BackEnd/docker-compose.yml` para orquestração Docker.
- O contêiner é construído a partir do `BackEnd/Dockerfile`.
- Verifique se as variáveis de ambiente obrigatórias estão definidas antes de iniciar.

---

## 📄 Licença

UNLICENSED

---

> Desenvolvido para o projeto Grupo Cazua.
