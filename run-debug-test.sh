#!/bin/bash
# Run the debug app creation test

echo "Starting debug app creation test..."
echo "Using existing project p-m0gl8n"
echo "=========================================="

# Run the test with detailed output
npx vitest run tests/functional/debug-app-creation.test.ts --reporter=verbose 2>&1 | tee debug-app-creation.log

echo "=========================================="
echo "Test completed. Results saved to debug-app-creation.log"