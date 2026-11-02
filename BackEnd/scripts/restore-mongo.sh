#!/bin/bash
# Restore MongoDB a partir do Cloudflare R2
# Uso: restore-mongo.sh <arquivo.tar.gz> [--drop]
# Para outro cluster/banco:
#   TARGET_MONGO_URI="mongodb+srv://..." SOURCE_DB="test" TARGET_DB="cazua_prod" restore-mongo.sh <arquivo.tar.gz> [--drop]

set -euo pipefail

# source /app/.env
source /app/scripts/r2-utils.sh

# Permite sobrescrever MONGO_URI e bancos via env
TARGET_URI="${TARGET_MONGO_URI:-${MONGO_URI}}"
TARGET_DB_NAME="${TARGET_DB:-${MONGO_DB_NAME:-cazua_prod}}"
SOURCE_DB_NAME="${SOURCE_DB:-}"

ARCHIVE="${1:-}"
DROP_FLAG="${2:-}"

if [[ -z "${ARCHIVE}" ]]; then
  echo "Uso: [TARGET_MONGO_URI=<uri>] [SOURCE_DB=<db_origem>] [TARGET_DB=<db_destino>] $0 <arquivo.tar.gz> [--drop]"
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

# Auto-detecta banco de origem no dump se SOURCE_DB não foi informado
if [[ -z "${SOURCE_DB_NAME}" ]]; then
  DETECTED_DBS=($(ls -1 "${TMP_DIR}/dump" 2>/dev/null || true))
  if [[ ${#DETECTED_DBS[@]} -eq 1 ]]; then
    SOURCE_DB_NAME="${DETECTED_DBS[0]}"
  fi
fi

# Remove db path da URI caso estejamos usando --nsFrom/--nsTo para evitar conflito no mongorestore
CLEAN_TARGET_URI=$(echo "${TARGET_URI}" | sed -E 's|(mongodb(\+srv)?://[^/]+)/[^?]*(\?.*)?|\1/\3|')

if [[ -n "${SOURCE_DB_NAME}" && -n "${TARGET_DB_NAME}" && "${SOURCE_DB_NAME}" != "${TARGET_DB_NAME}" ]]; then
  echo "♻️  Restaurando e migrando namespace: ${SOURCE_DB_NAME}.* -> ${TARGET_DB_NAME}.*"
  mongorestore --uri="${CLEAN_TARGET_URI}" --gzip ${DROP_FLAG} \
    --nsInclude="${SOURCE_DB_NAME}.*" \
    --nsFrom="${SOURCE_DB_NAME}.*" \
    --nsTo="${TARGET_DB_NAME}.*" \
    "${TMP_DIR}/dump"
else
  echo "♻️  Restaurando no cluster (banco: ${TARGET_DB_NAME})..."
  mongorestore --uri="${CLEAN_TARGET_URI}" --gzip ${DROP_FLAG} "${TMP_DIR}/dump"
fi

rm -rf "${TMP_DIR}"

echo "✅ Restore concluído no banco ${TARGET_DB_NAME} a partir de ${ARCHIVE}"