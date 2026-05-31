# Skill: Post-Implementation Container Verification

## Objetivo
Garantir que o container Docker roda normalmente após uma implementação de novo módulo NestJS.

## Checklist Pre-Build

### 1. **Verificar Dependências**
```bash
# Se adicionar imports de terceiros no código (multer, xlsx, etc):
cd BackEnd && pnpm install
# Verificar que o pnpm-lock.yaml foi atualizado
```

### 2. **Compilar Localmente**
```bash
cd BackEnd && pnpm build
# Verificar se dist/ foi gerado sem erros
```

### 3. **Executar Testes (se houver)**
```bash
cd BackEnd && pnpm test:e2e
# Ou testes unitários:
cd BackEnd && pnpm exec jest --config jest.config.ts
```

## Checklist Build Docker

### 4. **Remover Dist Anterior (se necessário)**
```bash
cd BackEnd && sudo rm -rf dist
# Limpar permissões se houver conflitos
```

### 5. **Build e Up do Container**
```bash
cd /home/yuri/grupocazua
docker-compose down
docker-compose up --build backend
```

### 6. **Verificar Logs**
```bash
# Monitorar em tempo real ou após:
docker-compose logs backend | tail -100

# Procurar por:
# ✅ "Nest application successfully started"
# ✅ Seus novos Controllers mapeados (ex: "[RouterExplorer] Mapped {/planning/...")
# ❌ "Cannot find module 'xxx'" → faltou pnpm install
# ❌ "Error: Cannot find..." → verificar imports
```

## Erros Comuns Resolvidos

### Erro: "Cannot find module 'multer'"
**Causa**: Importação de terceiros sem adicionar à `package.json`
**Solução**:
```bash
# 1. Adicionar ao BackEnd/package.json:
"multer": "^1.4.5-lts.1"

# 2. Rodar pnpm install
cd BackEnd && pnpm install

# 3. Rebuild
pnpm build
docker-compose down && docker-compose up --build backend
```

### Erro: "Permission denied" ao remover dist
**Solução**:
```bash
# Usar sudo para remover:
sudo rm -rf dist

# Ou verificar owner:
ls -la dist/
chmod -R u+w dist/
rm -rf dist
```

### Container não inicia, sem logs de erro
**Ações**:
1. Verificar `docker-compose logs backend`
2. Testar build local: `pnpm build`
3. Verificar se há permissões: `docker-compose down && docker system prune`
4. Rebuild: `docker-compose up --build backend`

## Checklist ao Adicionar Novo Módulo NestJS

- [ ] Schema criado em `src/modulo/schemas/`
- [ ] Validações Zod criadas em `src/modulo/validations/`
- [ ] Service implementado com métodos principais
- [ ] Controller criado com endpoints
- [ ] Module registrado com `MongooseModule.forFeature()`
- [ ] Module importado em `src/app.module.ts`
- [ ] Dependências adicionadas a `package.json`
- [ ] `pnpm install` executado
- [ ] `pnpm build` rodou sem erros
- [ ] Testes unitários criados (`*.spec.ts`)
- [ ] `pnpm test` passou
- [ ] Docker build bem-sucedido
- [ ] Backend logs mostram module inicializado
- [ ] Endpoints mapeados no RouterExplorer

## Verificação Rápida

```bash
# One-liner para verificar se backend iniciou:
docker-compose logs backend | grep -E "(successfully started|Cannot find|Error:)" | tail -5
```

## Sucesso!
Quando você ver:
```
[Nest] XX - MM/DD/YYYY, H:MM:SS PM     LOG [NestApplication] Nest application successfully started
```

Seu novo módulo está pronto e rodando no container! 🚀
