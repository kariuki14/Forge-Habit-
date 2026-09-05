#!/usr/bin/env bash

# Color formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "🔍 Scanning codebase for potential hardcoded API keys and secrets..."

# Define regex patterns for common API keys and secrets
PATTERNS=(
  '([a-zA-Z0-9_]{32,45})'                              # Generic high-entropy keys
  'AIza[0-9A-Za-z-_]{35}'                             # Google API key
  'sk_live_[0-9a-zA-Z]{24}'                           # Stripe Live Secret Key
  'rk_live_[0-9a-zA-Z]{24}'                           # Stripe Live Restricted Key
  'sq0atp-[0-9A-Za-z--_]{22}'                         # Square Access Token
  'access_token\$production\$[0-9a-z]{16}\$[0-9a-f]{32}' # PayPal Access Token
  'ghp_[a-zA-Z0-9]{36}'                               # GitHub Personal Access Token
  'eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*' # Hardcoded JWT Tokens
  '(DATABASE_URL|SMTP_PASSWORD|SECRET|API_KEY)="?[a-zA-Z0-9_!@#$%^&*()]{8,}"?' # Generic assigned secrets
)

FOUND=0

# Exclude generated directories, build outputs, lockfiles, and environment files.
# prisma/migrations: ORM-generated SQL (index names false-positive the generic
# entropy pattern). tsbuildinfo: TypeScript incremental cache full of hashes.
EXCLUDE_DIRS="--exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude-dir=migrations"
EXCLUDE_FILES="--exclude=.env --exclude=.env.* --exclude=package-lock.json --exclude=yarn.lock --exclude=pnpm-lock.yaml --exclude=*.tsbuildinfo --exclude=tsconfig.json"

for PATTERN in "${PATTERNS[@]}"; do
  # Search matching files
  MATCHES=$(grep -ErnI $EXCLUDE_DIRS $EXCLUDE_FILES "$PATTERN" . 2>/dev/null)
  
  if [ -n "$MATCHES" ]; then
    echo -e "\n${RED}⚠️  Potential secret found matching pattern: ${PATTERN}${NC}"
    echo "$MATCHES"
    FOUND=1
  fi
done

if [ $FOUND -eq 0 ]; then
  echo -e "\n${GREEN}✅ No hardcoded secrets or API keys detected!${NC}"
  exit 0
else
  echo -e "\n${RED}❌ Action required: Move detected hardcoded secrets to your .env file.${NC}"
  exit 1
fi