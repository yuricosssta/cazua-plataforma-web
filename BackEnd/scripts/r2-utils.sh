#!/bin/bash
# Helpers para Cloudflare R2 (API compatível S3)
# Carrega variáveis do .env automaticamente

set -euo pipefail

source /app/.env

# Endpoint R2 (extrai account_id se necessário)
if [[ "${R2_ENDPOINT}" =~ ^https://([^.]+)\.r2\.cloudflarestorage\.com$ ]]; then
  R2_ACCOUNT_ID="${BASH_REMATCH[1]}"
else
  R2_ACCOUNT_ID=""
fi

# Cliente AWS CLI configurado para R2
AWS_CLI="aws --endpoint-url=${R2_ENDPOINT} s3"

# Prefixo dos backups no bucket
BACKUP_PREFIX="backups/mongo/"

# Função: listar backups
list_backups() {
  echo "Backups em s3://${R2_BUCKET_NAME}/${BACKUP_PREFIX}:"
  ${AWS_CLI} ls "s3://${R2_BUCKET_NAME}/${BACKUP_PREFIX}"
}

# Função: deletar backup
delete_backup() {
  local archive="${1:-}"
  if [[ -z "${archive}" ]]; then
    echo "Uso: delete_backup <arquivo.tar.gz>"
    exit 1
  fi
  ${AWS_CLI} rm "s3://${R2_BUCKET_NAME}/${BACKUP_PREFIX}${archive}"
  echo "🗑️ Removido: ${archive}"
}

# Função: gerar URL pré-assinada (válida 1h por padrão)
presign_url() {
  local archive="${1:-}"
  local expires="${2:-3600}"
  if [[ -z "${archive}" ]]; then
    echo "Uso: presign_url <arquivo.tar.gz> [segundos]"
    exit 1
  fi
  aws --endpoint-url="${R2_ENDPOINT}" s3 presign "s3://${R2_BUCKET_NAME}/${BACKUP_PREFIX}${archive}" --expires-in "${expires}"
}

# Função: download direto
download_backup() {
  local archive="${1:-}"
  local dest="${2:-.}"
  if [[ -z "${archive}" ]]; then
    echo "Uso: download_backup <arquivo.tar.gz> [destino]"
    exit 1
  fi
  ${AWS_CLI} cp "s3://${R2_BUCKET_NAME}/${BACKUP_PREFIX}${archive}" "${dest}/"
  echo "✅ Baixado para ${dest}/${archive}"
}

# CLI simples
case "${1:-}" in
  list) list_backups ;;
  delete) delete_backup "${2:-}" ;;
  presign) presign_url "${2:-}" "${3:-}" ;;
  download) download_backup "${2:-}" "${3:-}" ;;
  *)
    echo "Uso: $0 {list|delete|presign|download} [args...]"
    echo "  list                    - Lista backups no R2"
    echo "  delete <arquivo>        - Remove backup do R2"
    echo "  presign <arquivo> [s]   - Gera URL temporária (padrão 3600s)"
    echo "  download <arquivo> [dir] - Baixa arquivo localmente"
    ;;
esac