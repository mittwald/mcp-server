#\!/bin/bash
# Check current app installations without creating new ones

echo "Checking current app installations in project p-m0gl8n..."
echo "=================================================="

# Just run the list test
npx vitest run tests/functional/debug-app-creation.test.ts -t "should list all app installations" 2>&1 | grep -A100 "Checking App Installations"
EOF < /dev/null