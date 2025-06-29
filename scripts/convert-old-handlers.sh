#!/bin/bash

echo "=== Converting old-style handlers to MittwaldToolHandler ==="

# List of files that need conversion (from the script output earlier)
files_to_convert=(
  "src/handlers/tools/mittwald-cli/database/mysql/versions.ts"
  "src/handlers/tools/mittwald-cli/database/mysql/dump.ts"
  "src/handlers/tools/mittwald-cli/database/mysql/charsets.ts"
  "src/handlers/tools/mittwald-cli/database/mysql/shell.ts"
  "src/handlers/tools/mittwald-cli/database/mysql/port-forward.ts"
  "src/handlers/tools/mittwald-cli/database/mysql/phpmyadmin.ts"
  "src/handlers/tools/mittwald-cli/database/mysql/create.ts"
  "src/handlers/tools/mittwald-cli/database/mysql/list.ts"
  "src/handlers/tools/mittwald-cli/database/mysql/import.ts"
  "src/handlers/tools/mittwald-cli/database/mysql/delete.ts"
  "src/handlers/tools/mittwald-cli/app/get.ts"
  "src/handlers/tools/mittwald-cli/app/install/contao.ts"
  "src/handlers/tools/mittwald-cli/app/install.ts"
  "src/handlers/tools/mittwald-cli/app/dependency/versions.ts"
  "src/handlers/tools/mittwald-cli/app/dependency/list.ts"
  "src/handlers/tools/mittwald-cli/app/dependency/update.ts"
  "src/handlers/tools/mittwald-cli/app/list/upgrade-candidates.ts"
  "src/handlers/tools/mittwald-cli/app/download.ts"
)

for file in "${files_to_convert[@]}"; do
  if [ -f "$file" ]; then
    echo "Converting $file"
    
    # Count directory depth to get correct import path
    depth=$(echo "$file" | sed 's|src/handlers/tools/mittwald-cli/||' | tr -cd '/' | wc -c)
    dots=$(printf '../%.0s' $(seq 1 $((depth + 4))))
    
    # Add import statements if they don't exist
    if ! grep -q "import type { MittwaldToolHandler }" "$file"; then
      # Insert imports at the beginning of the file
      sed -i '' "1i\\
import type { MittwaldToolHandler } from '${dots}types/mittwald/conversation.js';\\
import { formatToolResponse } from '${dots}utils/format-tool-response.js';
" "$file"
    fi
    
    # Replace executeCommand imports with proper ones
    sed -i '' "s|import.*executeCommand.*||g" "$file"
    sed -i '' "s|import.*CallToolResult.*||g" "$file"
    
    # Mark for manual conversion due to complexity
    echo "  NEEDS MANUAL CONVERSION: $file"
  fi
done

echo "=== Conversion markers added. Manual conversion needed for complex handlers ==="