#!/bin/bash
# Restore MongoDB a partir do Cloudflare R2
# Uso: restore-mongo.sh <arquivo.tar.gz> [--drop]
# Para outro cluster: TARGET_MONGO_URI="mongodb+srv://..." restore-mongo.sh <arquivo.tar.gz> [--drop]

set -euo pipefail

source /app/.env
source /app/scripts/r2-utils.sh

# Permite sobrescrever MONGO_URI via env (para outro cluster)
TARGET_URI="${TARGET_MONGO_URI:-${MONGO_URI}}"

ARCHIVE="${1:-}"
DROP_FLAG="${2:-}"

if [[ -z "${ARCHIVE}" ]]; then
  echo "Uso: TARGET_MONGO_URI=<uri> $0 <arquivo.tar.gz> [--drop]"
  echo ""
  echo "Backups disponíveis no R2:"
  ${AWS_CLI} ls "s3://${R2_BUCKET_NAME}/${BACKUP_PREFIX}"
  exit 1
fi

TMP_DIR=$(mktemp -d)

echo "🔄 Baixando ${ARCHIVE} do R2..."
${AWS_CLI} cp "s3://${R2_BUCKET_NAME}/${BACKUP_PREFIX}${ARCHIVE}" "${TMP_DIR}/"

echo "📦 Extraindo..."
tar -xzf "${TMP_DIR}/${ARCHIVE}" -C "${TMP_DIR}"

echo "♻️  Restaurando no cluster: ${TARGET_URI}"
mongorestore --uri="${TARGET_URI}" --gzip ${DROP_FLAG} "${TMP_DIR}/dump"

rm -rf "${TMP_DIR}"

echo "✅ Restore concluído em ${TARGET_URI} a partir de ${ARCHIVE}"