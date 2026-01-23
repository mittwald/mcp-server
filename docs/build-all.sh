#!/bin/bash
# Build both documentation sites with flexible BASE_URL configuration
# Supports local development and production deployment scenarios

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SETUP_DIR="$SCRIPT_DIR/setup-and-guides"
REFERENCE_DIR="$SCRIPT_DIR/reference"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
BASE_URL="${BASE_URL:=/}"
SETUP_SITE_URL="${SETUP_SITE_URL:=/}"
REFERENCE_SITE_URL="${REFERENCE_SITE_URL:=/reference}"
SCENARIO="${1:-local}"

echo -e "${BLUE}=== Building Mittwald MCP Documentation Sites ===${NC}"
echo "Scenario: $SCENARIO"
echo "BASE_URL: $BASE_URL"
echo "SETUP_SITE_URL: $SETUP_SITE_URL"
echo "REFERENCE_SITE_URL: $REFERENCE_SITE_URL"
echo ""

case "$SCENARIO" in
  local)
    # Local development: both sites at root level
    echo -e "${BLUE}Building for local development...${NC}"
    export BASE_URL="/"
    export SETUP_SITE_URL="/"
    export REFERENCE_SITE_URL="/reference"
    ;;

  production)
    # Production: both sites at root level (hosted on separate domains)
    echo -e "${BLUE}Building for production (separate domains)...${NC}"
    export BASE_URL="/"
    export SETUP_SITE_URL="https://setup.mittwald-mcp.example.com/"
    export REFERENCE_SITE_URL="https://reference.mittwald-mcp.example.com/"
    ;;

  github-pages)
    # GitHub Pages: both sites under repo path
    echo -e "${BLUE}Building for GitHub Pages...${NC}"
    export BASE_URL="/mittwald-mcp/"
    export SETUP_SITE_URL="/mittwald-mcp/setup/"
    export REFERENCE_SITE_URL="/mittwald-mcp/reference/"
    ;;

  custom)
    # Custom: use environment variables as provided
    echo -e "${BLUE}Building with custom configuration...${NC}"
    echo "Using BASE_URL=$BASE_URL"
    echo "Using SETUP_SITE_URL=$SETUP_SITE_URL"
    echo "Using REFERENCE_SITE_URL=$REFERENCE_SITE_URL"
    ;;

  *)
    echo "Unknown scenario: $SCENARIO"
    echo ""
    echo "Usage: $0 [scenario]"
    echo ""
    echo "Scenarios:"
    echo "  local           - Local development (default)"
    echo "  production      - Production deployment (separate domains)"
    echo "  github-pages    - GitHub Pages deployment"
    echo "  custom          - Use environment variables (BASE_URL, SETUP_SITE_URL, REFERENCE_SITE_URL)"
    echo ""
    echo "Examples:"
    echo "  ./build-all.sh local"
    echo "  ./build-all.sh github-pages"
    echo "  BASE_URL=/docs ./build-all.sh custom"
    exit 1
    ;;
esac

# Build setup-and-guides site
echo -e "${GREEN}Building Setup & Guides site...${NC}"
cd "$SETUP_DIR"
rm -rf dist
REFERENCE_SITE_URL="$REFERENCE_SITE_URL" npm run build
echo -e "${GREEN}✓ Setup & Guides build complete${NC}"
echo ""

# Build reference site
echo -e "${GREEN}Building Tool Reference site...${NC}"
cd "$REFERENCE_DIR"
rm -rf dist
SETUP_SITE_URL="$SETUP_SITE_URL" npm run build
echo -e "${GREEN}✓ Tool Reference build complete${NC}"
echo ""

echo -e "${BLUE}=== Build Summary ===${NC}"
echo "Setup & Guides: $SETUP_DIR/dist"
echo "Tool Reference: $REFERENCE_DIR/dist"
echo ""
echo -e "${GREEN}All sites built successfully!${NC}"
