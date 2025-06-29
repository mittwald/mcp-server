#!/bin/bash

echo "=== Fixing remaining TypeScript errors ==="

# 1. Fix formatToolResponse calls with object syntax
echo "1. Fixing formatToolResponse calls..."
find src/handlers/tools/mittwald-cli -name "*.ts" -type f | while read file; do
  if grep -q "formatToolResponse({" "$file"; then
    echo "  Fixing formatToolResponse in $file"
    # Fix success: true pattern
    sed -i '' 's/return formatToolResponse({[[:space:]]*success:[[:space:]]*true,[[:space:]]*data:[[:space:]]*\(.*\)[[:space:]]*})/return formatToolResponse("success", "Operation successful", \1)/g' "$file"
    # Fix success: false pattern
    sed -i '' 's/return formatToolResponse({[[:space:]]*success:[[:space:]]*false,[[:space:]]*error:[[:space:]]*\(.*\)[[:space:]]*})/return formatToolResponse("error", \1)/g' "$file"
  fi
done

# 2. Fix handlers using old async function syntax instead of MittwaldToolHandler
echo "2. Fixing handlers not using MittwaldToolHandler type..."
find src/handlers/tools/mittwald-cli -name "*.ts" -type f | while read file; do
  if grep -q "export async function handle" "$file"; then
    echo "  Converting to MittwaldToolHandler in $file"
    # This is complex, so we'll just note which files need manual fixing
    echo "    NEEDS MANUAL FIX: $file"
  fi
done

# 3. Fix import paths with too many ../
echo "3. Fixing import paths..."
find src/handlers/tools/mittwald-cli -name "*.ts" -type f | while read file; do
  # Count the directory depth from src/handlers/tools/mittwald-cli
  depth=$(echo "$file" | sed 's|src/handlers/tools/mittwald-cli/||' | tr -cd '/' | wc -c)
  # Add 4 for the base path
  total_depth=$((depth + 4))
  
  # Fix paths that have too many ../
  if grep -q "../../../../../" "$file"; then
    echo "  Fixing import paths in $file (depth: $total_depth)"
    sed -i '' 's|../../../../../types|../../../../types|g' "$file"
    sed -i '' 's|../../../../../utils|../../../../utils|g' "$file"
  fi
done

# 4. Fix API calls using wrong parameter names
echo "4. Fixing API parameter names..."
find src/handlers/tools/mittwald-cli -name "*.ts" -type f | while read file; do
  # Fix pathParameters that should be in the main object
  if grep -q "pathParameters:" "$file"; then
    echo "  Fixing pathParameters in $file"
    # This needs careful handling - mark for manual review
    echo "    NEEDS REVIEW: $file uses pathParameters"
  fi
done

# 5. Fix missing .api in API client calls
echo "5. Fixing missing .api in client calls..."
for pattern in "mittwaldClient\.user\." "mittwaldClient\.app\." "mittwaldClient\.project\." "mittwaldClient\.domain\." "mittwaldClient\.backup\." "mittwaldClient\.cronjob\."; do
  find src/handlers/tools/mittwald-cli -name "*.ts" -type f | while read file; do
    if grep -q "$pattern" "$file"; then
      echo "  Adding .api to $pattern in $file"
      base=$(echo "$pattern" | sed 's/\\//g' | sed 's/\.$//g')
      sed -i '' "s|$pattern|${base}.api.|g" "$file"
    fi
  done
done

echo "=== Script complete ==="
echo "Files that need manual fixing:"
find src/handlers/tools/mittwald-cli -name "*.ts" -type f -exec grep -l "export async function handle" {} \; | head -20