#!/bin/bash
# Fix common issues in app install handlers

for file in src/handlers/tools/mittwald-cli/app/install/*.ts; do
  echo "Fixing $file"
  
  # Fix import paths
  sed -i '' 's|from '\''../../../../../types/mittwald/conversation.js'\'';|from '\''../../../../../types/mittwald/conversation.js'\'';|g' "$file"
  sed -i '' 's|from '\''../../../../../utils/format-tool-response.js'\'';|from '\''../../../../../utils/format-tool-response.js'\'';|g' "$file"
  
  # Actually fix the import paths (5 levels up to 4 levels up)
  sed -i '' 's|../../../../../types|../../../../types|g' "$file"
  sed -i '' 's|../../../../../utils|../../../../utils|g' "$file"
  
  # Fix API client calls to use .api property
  sed -i '' 's|mittwaldClient\.user\.getProfile|mittwaldClient.api.user.getProfile|g' "$file"
  sed -i '' 's|mittwaldClient\.domain\.listIngresses|mittwaldClient.api.domain.listIngresses|g' "$file"
  sed -i '' 's|mittwaldClient\.app\.createAppinstallation|mittwaldClient.api.app.createAppinstallation|g' "$file"
  sed -i '' 's|mittwaldClient\.app\.getAppinstallation|mittwaldClient.api.app.getAppinstallation|g' "$file"
  
  # Fix throw Error to return formatToolResponse
  sed -i '' 's|throw new Error("Project ID is required");|return formatToolResponse("error", "Project ID is required");|g' "$file"
  sed -i '' 's|throw new Error("No hostname found.*");|return formatToolResponse("error", "No hostname found for project. Please specify a host parameter.");|g' "$file"
done

echo "Fixed app install handlers"