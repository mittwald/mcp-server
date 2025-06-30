#!/bin/bash
# Test just Contao installation with full setup

echo "Testing Contao installation..."
echo "============================="

# Run the full test but filter for Contao results
npx vitest run tests/functional/debug-app-creation.test.ts 2>&1 | grep -A20 -B5 "Testing Contao" | tail -50