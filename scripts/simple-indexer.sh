#!/bin/bash

# OpenSearch endpoint (internal)
OPENSEARCH_URL="http://opensearch:9200"
INDEX_NAME="deployment-guides"

# Create index
echo "Creating index..."
curl -X PUT "$OPENSEARCH_URL/$INDEX_NAME" \
  -H 'Content-Type: application/json' \
  -d '{
    "mappings": {
      "properties": {
        "url": { "type": "keyword" },
        "title": { "type": "text" },
        "content": { "type": "text" },
        "timestamp": { "type": "date" }
      }
    }
  }' 2>/dev/null || echo "Index might already exist"

echo ""
echo "Indexing sample documents..."

# Index sample documents for each deployment guide
curl -X POST "$OPENSEARCH_URL/$INDEX_NAME/_doc" \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://developer.mittwald.de/docs/v2/platform/deployment/container-actions/",
    "title": "Container Actions - Deployment Guide",
    "content": "This guide covers container deployment actions on Mittwald platform. Learn how to deploy, manage, and scale containers effectively. Topics include Docker container management, Kubernetes deployments, and container orchestration best practices.",
    "timestamp": "2025-07-03T12:00:00Z"
  }'

curl -X POST "$OPENSEARCH_URL/$INDEX_NAME/_doc" \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://developer.mittwald.de/docs/v2/platform/deployment/deployer/",
    "title": "Deployer - PHP Deployment Tool",
    "content": "Deployer is a deployment tool for PHP applications. This guide explains how to use Deployer with Mittwald hosting. Learn about deployment recipes, parallel deployments, rollback strategies, and zero-downtime deployments for PHP applications.",
    "timestamp": "2025-07-03T12:00:00Z"
  }'

curl -X POST "$OPENSEARCH_URL/$INDEX_NAME/_doc" \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://developer.mittwald.de/docs/v2/platform/deployment/terraform/",
    "title": "Terraform - Infrastructure as Code",
    "content": "Deploy and manage Mittwald infrastructure using Terraform. This guide covers Terraform provider configuration, resource management, state handling, and best practices for infrastructure as code on Mittwald platform.",
    "timestamp": "2025-07-03T12:00:00Z"
  }'

curl -X POST "$OPENSEARCH_URL/$INDEX_NAME/_doc" \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://developer.mittwald.de/docs/v2/platform/deployment/typo3surf/",
    "title": "TYPO3 Surf - TYPO3 Deployment",
    "content": "TYPO3 Surf is a professional deployment tool for TYPO3 CMS. Learn how to configure Surf deployments, manage multiple stages, handle database migrations, and implement continuous deployment for TYPO3 projects on Mittwald.",
    "timestamp": "2025-07-03T12:00:00Z"
  }'

echo ""
echo "Waiting for indexing to complete..."
sleep 2

# Check document count
echo ""
echo "Checking indexed documents..."
curl -s "$OPENSEARCH_URL/$INDEX_NAME/_count" | grep -o '"count":[0-9]*'

echo ""
echo "Sample search for 'terraform':"
curl -s "$OPENSEARCH_URL/$INDEX_NAME/_search?q=terraform" | grep -o '"hits":{"total":{"value":[0-9]*'

echo ""
echo "Indexing completed!"