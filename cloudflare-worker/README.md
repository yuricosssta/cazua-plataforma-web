# Cloudflare Worker - Cazuá Tenant Router

Worker para roteamento de subdomínios multi-tenant (`*.grupocazua.com.br`) para o frontend Next.js na Vercel.

## Arquitetura

```
construtora-alpha.grupocazua.com.br
         │
         ▼ (DNS: CNAME → Worker)
Cloudflare Worker (este código)
         │
         ├── Extrai slug: "construtora-alpha"
         ├── Adiciona header: x-cazua-tenant-slug: construtora-alpha
         │
         ▼ (Forward para Vercel)
www.grupocazua.com.br (Next.js na Vercel)
         │
         ▼ (Middleware lê header)
Roteia para /src/app/sites/construtora-alpha.grupocazua.com.br
         │
         ▼
Backend: GET /public/landing-pages/by-slug/construtora-alpha
```

## Pré-requisitos

- Conta Cloudflare (gratuita)
- Domínio `grupocazua.com.br` gerenciado no Cloudflare
- Frontend deployado na Vercel com domínio `www.grupocazua.com.br` verificado
- Backend com endpoint `/public/landing-pages/by-slug/:slug` implementado

## Configuração Local

```bash
cd cloudflare-worker
pnpm install
```

## Variáveis de Ambiente (Secrets)

Configure no dashboard Cloudflare ou via CLI:

```bash
# No dashboard: Workers > cazua-tenant-router > Settings > Variables (Encrypted)
# Ou via CLI:
pnpm run secret:root      # Digite: grupocazua.com.br
pnpm run secret:app       # Digite: www.grupocazua.com.br
pnpm run secret:vercel    # Digite: vanguardatech.vercel.app
pnpm run secret:purge     # Token Bearer para /__purge (ex: openssl rand -hex 32)
pnpm run secret:cf_token  # API Token do Cloudflare com permissão Zone.Cache Purge:Edit
```

| Variável | Tipo | Descrição | Exemplo |
|----------|------|-----------|---------|
| `ROOT_DOMAIN` | Secret | Domínio raiz do Cazuá | `grupocazua.com.br` |
| `APP_DOMAIN` | Secret | Domínio do app Next.js na Vercel | `www.grupocazua.com.br` |
| `VERCEL_ORIGIN` | Secret | Host nativo Vercel (sem proxy) | `vanguardatech.vercel.app` |
| `PURGE_TOKEN` | Secret | Token Bearer para autorizar `/__purge` | `openssl rand -hex 32` |
| `CF_API_TOKEN` | Secret | API Token com permissão `Zone.Cache Purge:Edit` | - |
| `CF_ZONE_ID` | Var (não-sensível) | ID da zona no Cloudflare | `2d7f309d05280aac75a42614147625a0` |

> `CF_ZONE_ID` está no `wrangler.toml` como var. Os demais são **secrets** (encrypted) para evitar exposição no painel.

## Cache Management

O Worker expõe uma rota admin para purgar o cache do Cloudflare via API.

### Setup
1. Cloudflare Dashboard → My Profile → API Tokens → Create Token
2. Template: **Custom Token** → Permissions: `Zone → Cache Purge:Edit`
3. Zone Resources: `Include → Specific zone → grupocazua.com.br`
4. Copie o token e rode `pnpm run secret:cf_token`
5. Gere um token admin forte: `openssl rand -hex 32` e rode `pnpm run secret:purge`

### Uso
```bash
# Purgar um subdomínio específico (purgar `/` e `/login`)
curl -X POST "https://cazua-tenant-router.<conta>.workers.dev/__purge" \
  -H "X-Admin-Token: $PURGE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"hostname": "construtora.grupocazua.com.br"}'

# Purgar uma URL exata
curl -X POST "https://cazua-tenant-router.<conta>.workers.dev/__purge" \
  -H "X-Admin-Token: $PURGE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://construtora.grupocazua.com.br/login"}'

# Purgar múltiplas URLs de uma vez
curl -X POST "https://cazua-tenant-router.<conta>.workers.dev/__purge" \
  -H "X-Admin-Token: $PURGE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"files": ["https://a.grupocazua.com.br/", "https://b.grupocazua.com.br/"]}'
```

Resposta:
```json
{
  "ok": true,
  "status": 200,
  "result": { "success": true, "errors": [], "messages": [] }
}
```

## Deploy

### Via Dashboard (Recomendado para primeira vez)
1. Acesse [Cloudflare Workers](https://dash.cloudflare.com/?account=workers)
2. Create Worker > Nome: `cazua-tenant-router`
3. Cole o conteúdo de `worker.js`
4. Settings > Variables > Adicione `ROOT_DOMAIN` e `APP_DOMAIN` como **Encrypted**
5. Save and Deploy

### Via CLI (Atualizações)
```bash
cd cloudflare-worker
pnpm run deploy
```

## DNS Cloudflare

Adicione no dashboard DNS de `grupocazua.com.br`:

| Tipo | Nome | Conteúdo | Proxy | TTL |
|------|------|----------|-------|-----|
| CNAME | `www` | `vanguardatech.vercel.app` | 🟠 Proxied | Auto |
| CNAME | `*` | `cazua-tenant-router.<sua-conta>.workers.dev` | 🟠 Proxied | Auto |

> O wildcard `*` captura todos os subdomínios de tenant (`construtora-alpha`, `outra-org`, etc).

## Testes

```bash
# Teste local (requer login wrangler)
pnpm run dev
# Acesse http://localhost:8787 simulando headers

# Logs em produção
pnpm run tail
```

### Validação Manual

```bash
# Subdomínio de tenant (deve retornar landing page)
curl -H "Host: construtora-alpha.grupocazua.com.br" https://cazua-tenant-router.<conta>.workers.dev/

# Domínio principal (deve passar direto para app)
curl -H "Host: www.grupocazua.com.br" https://cazua-tenant-router.<conta>.workers.dev/

# Com www no subdomínio (normaliza)
curl -H "Host: www.construtora-alpha.grupocazua.com.br" https://cazua-tenant-router.<conta>.workers.dev/
```

## Segurança

| Vetor | Mitigação |
|-------|-----------|
| Header spoofing | Worker **sempre sobrescreve** `x-cazua-tenant-slug` |
| Enumeração de slugs | Backend exige `isActive: true` no endpoint `/by-slug` |
| SSRF | Worker só faz forward para `APP_DOMAIN` fixo (allowlist) |
| Cache indevido | `cf: { cacheTtl: 0, cacheEverything: false }` |
| Domínio customizado | Middleware Next.js prioriza `host` real |

## Troubleshooting

### Página em branco / 404
1. Verifique se `ROOT_DOMAIN` e `APP_DOMAIN` estão corretos nos secrets
2. Confirme DNS: `dig construtora-alpha.grupocazua.com.br` deve resolver para Worker
3. Backend: `GET /public/landing-pages/by-slug/construtora-alpha` retorna 200?
4. Frontend: Middleware lê `x-cazua-tenant-slug`? (logs no Vercel)

### Worker não intercepta
- Verifique se DNS wildcard `*` está **Proxied** (laranja) no Cloudflare
- `APP_DOMAIN` deve bater com o host que o Vercel espera

### Loop de redirecionamento
- Worker não deve chamar a si mesmo: `APP_DOMAIN` ≠ domínio do Worker
- `cf.cacheTtl: 0` evita cache agressivo

## Atualizações Futuras

- Adicionar rate limiting por slug (KV namespace)
- Métricas de acesso por tenant (Analytics Engine)
- Suporte a domínios customizados via Worker (fallback)

## Referências

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)