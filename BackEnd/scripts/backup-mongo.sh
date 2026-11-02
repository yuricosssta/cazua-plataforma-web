#!/bin/bash
# Backup MongoDB Atlas -> Cloudflare R2
# Uso: backup-mongo.sh

set -euo pipefail

# source /app/.env
source /app/scripts/r2-utils.sh

: "${MONGO_URI:?Variável MONGO_URI é obrigatória}"
: "${R2_ENDPOINT:?Variável R2_ENDPOINT é obrigatória}"
: "${R2_BUCKET_NAME:?Variável R2_BUCKET_NAME é obrigatória}"

DB_NAME="${MONGO_DB_NAME:-cazua_prod}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ARCHIVE="${DB_NAME}_${TIMESTAMP}.tar.gz"
TMP_DIR=$(mktemp -d)

echo "Iniciando backup (${DB_NAME}): ${ARCHIVE}"

# 1. mongodump (garante DB_NAME caso não esteja explícito na URI)
if [[ "${MONGO_URI}" =~ mongodb(\+srv)?://[^/]+/\? ]] || [[ "${MONGO_URI}" =~ mongodb(\+srv)?://[^/]+$ ]]; then
  mongodump --uri="${MONGO_URI}" --db="${DB_NAME}" --out="${TMP_DIR}/dump" --gzip
else
  mongodump --uri="${MONGO_URI}" --out="${TMP_DIR}/dump" --gzip
fi

# 2. Compacta
tar -czf "${TMP_DIR}/${ARCHIVE}" -C "${TMP_DIR}" dump

# 3. Upload R2
${AWS_CLI} cp "${TMP_DIR}/${ARCHIVE}" "s3://${R2_BUCKET_NAME}/${BACKUP_PREFIX}${ARCHIVE}"

# 4. Copia para artifact do GitHub Actions (se rodando no CI)
if [[ -n "${EXPORT_DIR:-}" ]]; then
  cp "${TMP_DIR}/${ARCHIVE}" "${EXPORT_DIR}/${ARCHIVE}"
  chmod 666 "${EXPORT_DIR}/${ARCHIVE}"
fi

# 5. Cleanup local
rm -rf "${TMP_DIR}"

echo "✅ Backup salvo: s3://${R2_BUCKET_NAME}/${BACKUP_PREFIX}${ARCHIVE}"

# 6. Summary para GitHub Actions
if [[ -n "${GITHUB_ACTIONS:-}" ]]; then
  cat <<EOF >> $GITHUB_STEP_SUMMARY
## Backup MongoDB concluído

- **Arquivo:** \`${ARCHIVE}\`
- **Bucket R2:** \`s3://${R2_BUCKET_NAME}/${BACKUP_PREFIX}${ARCHIVE}\`
- **Timestamp:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
- **Tamanho:** $(du -h "${RUNNER_TEMP}/${ARCHIVE}" | cut -f1)

[Download via Artifacts](#) (expira em 7 dias)
EOF
fi

echo "Backup salvo: s3://${R2_BUCKET_NAME}/${BACKUP_PREFIX}${ARCHIVE}"