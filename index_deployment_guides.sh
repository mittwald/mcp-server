#\!/bin/bash

# URLs to index
declare -a urls=(
    "https://developer.mittwald.de/docs/v2/platform/deployment/container-actions/"
    "https://developer.mittwald.de/docs/v2/platform/deployment/deployer/"
    "https://developer.mittwald.de/docs/v2/platform/deployment/terraform/"
    "https://developer.mittwald.de/docs/v2/platform/deployment/typo3surf/"
)

declare -a titles=(
    "Container Actions Deployment Guide"
    "Deployer Deployment Guide"
    "Terraform Deployment Guide"
    "TYPO3 Surf Deployment Guide"
)

# Function to extract text content from HTML
extract_text() {
    url=$1
    # Use curl with a user agent and extract text content
    curl -s -H "User-Agent: Mozilla/5.0" "$url" | \
    sed 's/<script[^>]*>.*<\/script>//g' | \
    sed 's/<style[^>]*>.*<\/style>//g' | \
    sed 's/<[^>]*>//g' | \
    tr -s ' \t\n' ' ' | \
    sed 's/&nbsp;/ /g' | \
    sed 's/&lt;/</g' | \
    sed 's/&gt;/>/g' | \
    sed 's/&quot;/"/g' | \
    head -c 5000
}

# Create the index first
echo "Creating OpenSearch index..."
curl -X PUT "http://localhost:9200/deployment-guides" \
     -H 'Content-Type: application/json' \
     -d '{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  },
  "mappings": {
    "properties": {
      "title": {"type": "text"},
      "url": {"type": "keyword"},
      "content": {"type": "text"},
      "category": {"type": "keyword"}
    }
  }
}'

echo -e "\n\nIndexing deployment guide pages..."

# Index each page
for i in "${\!urls[@]}"; do
    url="${urls[$i]}"
    title="${titles[$i]}"
    
    echo -e "\nFetching $title from $url..."
    
    # Extract text content
    content=$(extract_text "$url")
    
    # Escape JSON special characters
    content=$(echo "$content" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | tr -d '\n')
    
    # Create JSON document and index it
    curl -X POST "http://localhost:9200/deployment-guides/_doc" \
         -H 'Content-Type: application/json' \
         -d "{
  \"title\": \"$title\",
  \"url\": \"$url\",
  \"content\": \"$content\",
  \"category\": \"deployment\"
}"
    
    echo " - Indexed: $title"
done

echo -e "\n\nVerifying indexed documents..."
curl -X GET "http://localhost:9200/deployment-guides/_count?pretty"

echo -e "\n\nTesting search for 'terraform'..."
curl -X GET "http://localhost:9200/deployment-guides/_search?pretty" \
     -H 'Content-Type: application/json' \
     -d '{
  "query": {
    "match": {
      "content": "terraform"
    }
  }
}'
