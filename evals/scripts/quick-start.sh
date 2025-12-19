#!/bin/bash

# Multi-Run Evaluation System Quick Start
# Creates a new run, sets it as active, and provides next steps

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Multi-Run Evaluation System Quick Start${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Prompt for run name
read -p "Enter run name (e.g., 'baseline-v1', 'oauth-fix-test'): " RUN_NAME
if [ -z "$RUN_NAME" ]; then
  echo "Error: Run name is required"
  exit 1
fi

# Prompt for description
read -p "Enter description (optional): " RUN_DESC
if [ -z "$RUN_DESC" ]; then
  RUN_DESC="Eval run created on $(date +%Y-%m-%d)"
fi

# Prompt for tags
read -p "Enter tags (comma-separated, optional): " RUN_TAGS
TAG_ARG=""
if [ ! -z "$RUN_TAGS" ]; then
  TAG_ARG="--tags $RUN_TAGS"
fi

echo ""
echo -e "${YELLOW}Creating run...${NC}"

# Create and activate run
RUN_OUTPUT=$(npx tsx "$(dirname "$0")/run-manager.ts" create \
  --name "$RUN_NAME" \
  --description "$RUN_DESC" \
  $TAG_ARG \
  --set-active 2>&1)

echo "$RUN_OUTPUT"

# Extract run ID from output
RUN_ID=$(echo "$RUN_OUTPUT" | grep "Created run:" | awk '{print $3}')

if [ -z "$RUN_ID" ]; then
  echo -e "${YELLOW}Warning: Could not extract run ID${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Run created and activated: $RUN_ID${NC}"
echo ""

# Display next steps
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Execute all domain WP files:"
echo "   cd kitty-specs/014-domain-grouped-eval-work-packages/tasks"
echo "   /spec-kitty.implement WP01-identity.md"
echo "   /spec-kitty.implement WP02-organization.md"
echo "   ... (continue for all WPs)"
echo ""
echo "2. Or execute all at once (bash):"
echo "   for wp in kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP*.md; do"
echo "     /spec-kitty.implement \"\$wp\""
echo "   done"
echo ""
echo "3. After execution, generate report:"
echo "   npx tsx evals/scripts/generate-multi-run-report.ts"
echo ""
echo "4. Compare with previous run (if available):"
echo "   npx tsx evals/scripts/run-manager.ts list  # Find previous run ID"
echo "   npx tsx evals/scripts/run-manager.ts compare <prev-run-id> $RUN_ID"
echo ""
echo -e "${GREEN}Active run is now: $RUN_ID${NC}"
echo -e "${GREEN}All eval results will be saved to: evals/results/runs/$RUN_ID/${NC}"
echo ""
