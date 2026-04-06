# Dockerfile para o BackEnd NestJS produção
# Estágio 1: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Habilita o pnpm usando o Corepack nativo do Node 22
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copia apenas os arquivos de dependência
COPY pnpm-lock.yaml package.json ./

# Instala todas as dependências para o build
RUN pnpm install --frozen-lockfile

# Copia o código e gera o build (dist/)
COPY . .
RUN pnpm run build

# Remove as devDependencies para deixar a node_modules leve
RUN pnpm prune --prod

# Estágio 2: Runner
FROM node:22-alpine
WORKDIR /usr/app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# No NestJS, precisamos da node_modules (com as prod-deps) e da dist/
COPY --from=builder /usr/app/node_modules ./node_modules
COPY --from=builder /usr/app/dist ./dist
COPY --from=builder /usr/app/package.json ./

USER appuser
EXPOSE 3001

# O NestJS compila para dist/main.js
CMD ["node", "dist/main"]
