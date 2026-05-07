#!/bin/bash
# Usage: ./switch-env.sh dev | ./switch-env.sh prod

set -e

ENV=$1

if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
  echo "Usage: $0 dev|prod"
  exit 1
fi

cp ".env.$ENV" .env.local
echo "✓ Switched to $ENV — .env.local now points to $ENV DB"
echo "  Restart the dev server for changes to take effect."
