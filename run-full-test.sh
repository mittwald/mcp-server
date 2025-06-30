#!/bin/bash
# Script to run the full lifecycle test with proper output

echo "Starting full lifecycle test at $(date)"
echo "This test will take approximately 30 minutes to complete..."
echo "=========================================="

# Run the test with verbose output
npx vitest run tests/functional/full-lifecycle.test.ts --reporter=verbose 2>&1 | tee full-test-results.log

echo "=========================================="
echo "Test completed at $(date)"
echo "Results saved to full-test-results.log"