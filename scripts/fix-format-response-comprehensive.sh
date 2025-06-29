#!/bin/bash

echo "=== Fixing formatToolResponse calls comprehensively ==="

# Fix all remaining formatToolResponse calls with object syntax
find src/handlers/tools/mittwald-cli -name "*.ts" -type f | while read file; do
  # Check if file has old formatToolResponse pattern
  if grep -q "formatToolResponse({" "$file"; then
    echo "Fixing $file"
    
    # Create a temporary file for complex replacements
    temp_file="${file}.tmp"
    cp "$file" "$temp_file"
    
    # Use perl for more complex regex replacements
    perl -i -pe '
      # Match formatToolResponse({ success: true, data: ... })
      s/formatToolResponse\(\s*\{\s*success:\s*true,\s*data:\s*(.*?)\s*\}\s*\)/formatToolResponse("success", "Operation successful", $1)/gs;
      
      # Match formatToolResponse({ success: false, error: ... })
      s/formatToolResponse\(\s*\{\s*success:\s*false,\s*error:\s*(.*?)\s*\}\s*\)/formatToolResponse("error", $1)/gs;
    ' "$temp_file"
    
    # Move temp file back
    mv "$temp_file" "$file"
  fi
done

echo "=== Done fixing formatToolResponse calls ==="