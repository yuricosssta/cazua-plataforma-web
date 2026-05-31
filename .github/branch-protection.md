# Branch Protection — Recomendações para este repositório

Recomendações para configurar proteção de branches (via GitHub UI ou `gh` CLI) para garantir que pull requests passem por CI e revisão antes do merge.

Regras sugeridas (aplicar a `main` e outras branches de produção):

- Require pull request reviews before merging: 1 approving review mínimo.
- Require status checks to pass before merging: habilitar o check `ci` (nome do job do workflow: `ci`).
- Require branches to be up to date before merging.
- Require linear history (opcional).
- Include administrators (recomendado para evitar merges diretos acidentais).
- Dismiss stale pull request approvals when new commits are pushed.

Exemplo (GitHub UI):

1. Vá em `Settings` → `Branches` → `Branch protection rules` → `Add rule`.
2. Em `Branch name pattern`, coloque `main`.
3. Marque `Require pull request reviews before merging` e defina `1`.
4. Marque `Require status checks to pass before merging` e selecione `ci`.
5. Marque `Require branches to be up to date before merging`.
6. Opcional: marque `Require linear history` e `Include administrators`.

Exemplo (gh CLI):

```bash
# criar uma regra de proteção (substitua OWNER/REPO pelo seu repositório)
gh api repos/OWNER/REPO/branches/main/protection -X PUT -f required_status_checks='{contexts:["ci"]}' -f enforce_admins=true -f required_pull_request_reviews='{"required_approving_review_count":1}'
```

Observação: o nome do check a exigir deve corresponder ao nome do job no workflow. Aqui o job é `ci`, então o status check será `ci`.
