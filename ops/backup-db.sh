#!/bin/bash
# Nightly Postgres dump for the pilot. Keeps the last $KEEP_DAYS locally and,
# if S3_BUCKET is set, copies each dump off the instance.
#
# The study's reward data lives in a Docker volume on a single host — losing the
# instance would mean losing the basis for paying participants. Hence this.
#
# Install (on the server, as root):
#   /opt/clearair/ops/backup-db.sh --install
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/clearair}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/clearair}"
KEEP_DAYS="${KEEP_DAYS:-30}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
S3_BUCKET="${S3_BUCKET:-}"

if [ "${1:-}" = "--install" ]; then
  install -d -m 700 "$BACKUP_DIR"
  cat > /etc/cron.d/clearair-backup <<CRON
# ClearAir nightly DB backup — 03:15 Singapore time (19:15 UTC).
15 19 * * * root APP_DIR=$APP_DIR BACKUP_DIR=$BACKUP_DIR S3_BUCKET=$S3_BUCKET $APP_DIR/ops/backup-db.sh >> /var/log/clearair-backup.log 2>&1
CRON
  chmod 644 /etc/cron.d/clearair-backup
  echo "Installed /etc/cron.d/clearair-backup (nightly 19:15 UTC = 03:15 SGT)"
  exit 0
fi

cd "$APP_DIR"
# shellcheck disable=SC1091
set -a; [ -f .env ] && . ./.env; set +a

# Dumps contain participant PII and password hashes — keep them owner-only.
install -d -m 700 "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$BACKUP_DIR/clearair-$STAMP.sql.gz"

umask 077
docker compose -f "$COMPOSE_FILE" exec -T db \
  pg_dump -U "${POSTGRES_USER:-clearair}" -d "${POSTGRES_DB:-clearair}" \
  | gzip > "$OUT"

# A dump that fails halfway still leaves a file — make sure it's a real one.
if [ ! -s "$OUT" ] || ! gzip -t "$OUT" 2>/dev/null; then
  echo "ERROR: backup $OUT is empty or corrupt" >&2
  rm -f "$OUT"
  exit 1
fi

echo "$(date -u +%FT%TZ) wrote $OUT ($(du -h "$OUT" | cut -f1))"

if [ -n "$S3_BUCKET" ]; then
  aws s3 cp "$OUT" "s3://$S3_BUCKET/$(basename "$OUT")" --only-show-errors \
    && echo "uploaded to s3://$S3_BUCKET/$(basename "$OUT")"
fi

find "$BACKUP_DIR" -name 'clearair-*.sql.gz' -mtime "+$KEEP_DAYS" -delete
