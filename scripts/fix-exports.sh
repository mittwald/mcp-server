#!/bin/bash

# Fix export naming consistency for a given category
# Usage: ./scripts/fix-exports.sh <category>

set -e

CATEGORY=$1
if [ -z "$CATEGORY" ]; then
    echo "Usage: $0 <category>"
    echo "Example: $0 database"
    exit 1
fi

CATEGORY_DIR="src/constants/tool/mittwald-cli/$CATEGORY"

if [ ! -d "$CATEGORY_DIR" ]; then
    echo "Category directory not found: $CATEGORY_DIR"
    exit 1
fi

echo "🔧 Fixing exports for category: $CATEGORY"

# Find all TypeScript files in the category (except index.ts)
find "$CATEGORY_DIR" -name "*.ts" -not -name "index.ts" | while read -r file; do
    if [ -f "$file" ]; then
        echo "  📝 Processing: $file"
        
        # Extract the relative path for tool naming (macOS compatible)
        rel_path=$(echo "$file" | sed "s|^$CATEGORY_DIR/||")
        tool_suffix=$(echo "$rel_path" | sed 's|\.ts$||' | sed 's|/|_|g' | sed 's|-|_|g')
        expected_name="mittwald_${CATEGORY}_${tool_suffix}"
        
        # Check if file has an export and fix it if needed
        if grep -q "export const" "$file"; then
            # Replace any existing export const with the standardized name
            sed -i '' "s/export const [^:]*:/export const $expected_name:/" "$file"
            echo "    ✅ Fixed export name to: $expected_name"
        else
            echo "    ⚠️  No export found in: $file"
        fi
    fi
done

echo "✅ Completed fixing exports for category: $CATEGORY"