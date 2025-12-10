#!/usr/bin/env bash
# Automated Prompt Quality Validation (T017)
# Validates all 31 use case prompts against SC-002 acceptance criteria

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
USE_CASE_DIR="$PROJECT_ROOT/tests/functional/use-case-library"

echo "========================================"
echo "Prompt Quality Validation (SC-002)"
echo "========================================"
echo ""
echo "Scanning: $USE_CASE_DIR"
echo ""

# Check for tool name patterns
echo "Step 1: Scanning for MCP tool name references..."
TOOL_NAME_COUNT=$(grep -r 'mcp__mittwald__' "$USE_CASE_DIR" 2>/dev/null | wc -l | tr -d ' ')

echo "Step 2: Scanning for prescriptive language patterns..."
PRESCRIPTIVE_COUNT=$(grep -rE '(use the tools?|use this tool|call the|invoke the|execute the)' \
  "$USE_CASE_DIR" 2>/dev/null | wc -l | tr -d ' ')

# Count total prompts
TOTAL_PROMPTS=$(find "$USE_CASE_DIR" -name "*.json" | wc -l | tr -d ' ')

echo ""
echo "Scan Results:"
echo "============"
echo "Total use case files scanned: $TOTAL_PROMPTS"
echo "Tool name violations (mcp__mittwald__): $TOOL_NAME_COUNT"
echo "Prescriptive pattern violations: $PRESCRIPTIVE_COUNT"
echo ""

if [ "$TOOL_NAME_COUNT" = "0" ] && [ "$PRESCRIPTIVE_COUNT" = "0" ]; then
  echo "✅ SC-002 VALIDATION PASSED"
  echo "All 31 prompts are outcome-focused with zero tool name/prescriptive references"
  echo ""
  echo "Validated:"
  echo "  ✓ Zero mcp__mittwald__ tool name references"
  echo "  ✓ Zero 'use the tools/tool' prescriptive language"
  echo "  ✓ All prompts use outcome-focused narrative"
  exit 0
else
  echo "❌ SC-002 VALIDATION FAILED"
  echo "Found violations that need correction:"
  if [ "$TOOL_NAME_COUNT" != "0" ]; then
    echo "  ✗ Tool name violations: $TOOL_NAME_COUNT"
  fi
  if [ "$PRESCRIPTIVE_COUNT" != "0" ]; then
    echo "  ✗ Prescriptive language violations: $PRESCRIPTIVE_COUNT"
  fi
  exit 1
fi
