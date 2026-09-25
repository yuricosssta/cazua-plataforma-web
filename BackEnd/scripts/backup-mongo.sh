#!/bin/bash
# Backup MongoDB Atlas -> Cloudflare R2
# Uso: backup-mongo.sh

set -euo pipefail

source /app/.env
source /app/scripts/r2-utils.sh

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ARCHIVE="mongo_${TIMESTAMP}.tar.gz"
TMP_DIR=$(mktemp -d)

echo "🔄 Iniciando backup: ${ARCHIVE}"

# 1. mongodump
mongodump --uri="${MONGO_URI}" --out="${TMP_DIR}/dump" --gzip

# 2. Compacta
tar -czf "${TMP_DIR}/${ARCHIVE}" -C "${TMP_DIR}" dump

# 3. Upload R2
${AWS_CLI} cp "${TMP_DIR}/${ARCHIVE}" "s3://${R2_BUCKET_NAME}/${BACKUP_PREFIX}${ARCHIVE}"

# 4. Copia para artifact do GitHub Actions (se rodando no CI)
if [[ -n "${GITHUB_ACTIONS:-}" ]]; then
  cp "${TMP_DIR}/${ARCHIVE}" "${RUNNER_TEMP}/${ARCHIVE}"
  echo "artifact_path=${RUNNER_TEMP}/${ARCHIVE}" >> $GITHUB_OUTPUT
fi

# 5. Cleanup local
rm -rf "${TMP_DIR}"

# 6. Summary para GitHub Actions
if [[ -n "${GITHUB_ACTIONS:-}" ]]; then
  cat <<EOF >> $GITHUB_STEP_SUMMARY
## ✅ Backup MongoDB concluído

- **Arquivo:** \`${ARCHIVE}\`
- **Bucket R2:** \`s3://${R2_BUCKET_NAME}/${BACKUP_PREFIX}${ARCHIVE}\`
- **Timestamp:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
- **Tamanho:** $(du -h "${RUNNER_TEMP}/${ARCHIVE}" | cut -f1)

[Download via Artifacts](#) (expira em 7 dias)
EOF
fi

echo "✅ Backup salvo: s3://${R2_BUCKET_NAME}/${BACKUP_PREFIX}${ARCHIVE}"