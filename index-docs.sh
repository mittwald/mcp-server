#!/bin/bash

# OpenSearch endpoint (internal network)
OPENSEARCH_URL="http://opensearch:9200"

# Create index with proper mappings
curl -X PUT "$OPENSEARCH_URL/deployment-guides" -H 'Content-Type: application/json' -d '{
  "mappings": {
    "properties": {
      "title": { "type": "text" },
      "url": { "type": "keyword" },
      "content": { "type": "text" },
      "category": { "type": "keyword" },
      "timestamp": { "type": "date" }
    }
  }
}'

# Function to fetch and index a page
index_page() {
  local url=$1
  local title=$2
  local category=$3
  local doc_id=$(echo "$url" | sed 's/[^a-zA-Z0-9]/-/g')
  
  echo "Fetching $url..."
  
  # Fetch the page content
  content=$(curl -s "$url" | sed 's/<[^>]*>//g' | tr '\n' ' ' | sed 's/  */ /g' | sed 's/"/\\"/g')
  
  # Create JSON document
  json_doc=$(cat <<EOF
{
  "title": "$title",
  "url": "$url",
  "content": "$content",
  "category": "$category",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
)
  
  # Index the document
  echo "Indexing $title..."
  curl -X POST "$OPENSEARCH_URL/deployment-guides/_doc/$doc_id" \
    -H 'Content-Type: application/json' \
    -d "$json_doc"
  
  echo "Done with $title"
  echo ""
}

# Index all deployment guide pages
index_page "https://developer.mittwald.de/docs/v2/platform/deployment/container-actions/" "Container Actions Deployment Guide" "deployment"
index_page "https://developer.mittwald.de/docs/v2/platform/deployment/deployer/" "Deployer Deployment Guide" "deployment"
index_page "https://developer.mittwald.de/docs/v2/platform/deployment/terraform/" "Terraform Deployment Guide" "deployment"
index_page "https://developer.mittwald.de/docs/v2/platform/deployment/typo3surf/" "TYPO3 Surf Deployment Guide" "deployment"

# Refresh the index
curl -X POST "$OPENSEARCH_URL/deployment-guides/_refresh"

echo "All documents indexed successfully!"

# Test search
echo "Testing search for 'container'..."
curl -X GET "$OPENSEARCH_URL/deployment-guides/_search?q=container&pretty"