#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "== npm audit =="
npm audit --audit-level=moderate || true
echo ""
echo "== required env (production) =="
for v in ANTHROPIC_API_KEY APP_PASSWORD_HASH APP_SECRET; do
  if [ -z "${!v:-}" ] && [ -f .env.local ] && grep -q "^${v}=" .env.local; then
    echo "OK  $v (from .env.local)"
  elif [ -n "${!v:-}" ]; then
    echo "OK  $v"
  else
    echo "MISS $v"
  fi
done
echo ""
echo "== optional =="
for v in TOTP_SECRET ALLOWED_ORIGINS; do
  if [ -f .env.local ] && grep -q "^${v}=" .env.local 2>/dev/null; then
    echo "SET  $v"
  else
    echo "---- $v (optional)"
  fi
done
