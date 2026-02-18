#!/bin/bash
#
# Fresh Checkout Deployment Test
#
# Simulates what a customer (e.g., Martin Helmich) would experience
# after checking out the repo and trying to run it.
#
# This catches issues like:
# - Production code importing test files (ERR_MODULE_NOT_FOUND)
# - Missing dependencies
# - Build failures
# - Startup errors
#
# Usage: ./scripts/test-fresh-checkout.sh [--keep-temp]
#
# Options:
#   --keep-temp    Don't delete the temp directory after testing

set -e

KEEP_TEMP=false
if [[ "$1" == "--keep-temp" ]]; then
  KEEP_TEMP=true
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Fresh Checkout Deployment Test ===${NC}"
echo ""

# Get the repo URL from current git config
REPO_URL=$(git config --get remote.origin.url)
BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMIT=$(git rev-parse HEAD)

echo "Repository: $REPO_URL"
echo "Branch: $BRANCH"
echo "Commit: $COMMIT"
echo ""

# Create temp directory
TEMP_DIR=$(mktemp -d)
echo -e "${YELLOW}Created temp directory: $TEMP_DIR${NC}"

cleanup() {
  if [[ "$KEEP_TEMP" == "false" ]]; then
    echo -e "${YELLOW}Cleaning up temp directory...${NC}"
    rm -rf "$TEMP_DIR"
  else
    echo -e "${YELLOW}Keeping temp directory at: $TEMP_DIR${NC}"
  fi
}
trap cleanup EXIT

# Clone the repository
echo ""
echo -e "${YELLOW}Step 1: Cloning repository...${NC}"
cd "$TEMP_DIR"
git clone --depth 1 --branch "$BRANCH" "$REPO_URL" repo
cd repo

echo -e "${GREEN}✓ Clone successful${NC}"

# Install dependencies
echo ""
echo -e "${YELLOW}Step 2: Installing dependencies (npm ci)...${NC}"
npm ci --ignore-scripts > /dev/null 2>&1
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Build all packages
echo ""
echo -e "${YELLOW}Step 3: Building all packages...${NC}"
npm run build:all 2>&1 | tee build.log

if grep -q "error TS" build.log; then
  echo -e "${RED}✗ Build failed with TypeScript errors${NC}"
  cat build.log | grep "error TS"
  exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"

# Check for test file imports in production code
echo ""
echo -e "${YELLOW}Step 4: Checking for test imports in production code...${NC}"
if grep -r "from.*tests/" src/ --include="*.ts" --include="*.js" 2>/dev/null | grep -v ".test." | grep -v "__tests__"; then
  echo -e "${RED}✗ Found test imports in production code!${NC}"
  exit 1
fi
if grep -r "from.*tests/" build/ --include="*.js" 2>/dev/null; then
  echo -e "${RED}✗ Found test imports in compiled code!${NC}"
  exit 1
fi
echo -e "${GREEN}✓ No test imports in production code${NC}"

# Start the server and check for module errors
echo ""
echo -e "${YELLOW}Step 5: Starting server to check for module errors...${NC}"

# Create minimal env for startup test
export NODE_ENV=production
export PORT=3099
export JWT_SECRET=test-secret-for-fresh-checkout
export OAUTH_BRIDGE_JWT_SECRET=test-secret-for-fresh-checkout
export OAUTH_ISSUER=http://localhost:3099

# Start server in background, capture output
timeout 10 node build/index.js > startup.log 2>&1 &
SERVER_PID=$!

# Wait a bit for startup
sleep 3

# Check if server started (it might fail due to missing Redis, that's OK)
# What we care about is ERR_MODULE_NOT_FOUND errors
if grep -q "ERR_MODULE_NOT_FOUND" startup.log; then
  echo -e "${RED}✗ Found ERR_MODULE_NOT_FOUND errors during startup!${NC}"
  echo ""
  echo "Error details:"
  grep "ERR_MODULE_NOT_FOUND" startup.log
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi

if grep -q "Cannot find module" startup.log; then
  echo -e "${RED}✗ Found 'Cannot find module' errors during startup!${NC}"
  echo ""
  echo "Error details:"
  grep -A2 "Cannot find module" startup.log
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi

# Kill the server
kill $SERVER_PID 2>/dev/null || true

echo -e "${GREEN}✓ No module errors during startup${NC}"

# Check tool loading
echo ""
echo -e "${YELLOW}Step 6: Verifying tool definitions load correctly...${NC}"
node -e "
import { loadCliTools } from './build/constants/tools.js';
loadCliTools().then(tools => {
  console.log('Loaded ' + tools.length + ' tools');
  if (tools.length < 100) {
    console.error('ERROR: Expected at least 100 tools, got ' + tools.length);
    process.exit(1);
  }
  console.log('✓ Tools loaded successfully');
}).catch(err => {
  console.error('ERROR loading tools:', err.message);
  process.exit(1);
});
" 2>&1 | tee tools.log

if grep -q "ERROR" tools.log; then
  echo -e "${RED}✗ Tool loading failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ All tools loaded correctly${NC}"

# Summary
echo ""
echo -e "${GREEN}=== All Checks Passed ===${NC}"
echo ""
echo "Fresh checkout deployment test completed successfully."
echo "This build is safe to deploy."
