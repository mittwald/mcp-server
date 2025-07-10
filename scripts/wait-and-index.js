const axios = require('axios');

// Configuration
const OPENSEARCH_API_URL = 'https://opensearch-api.p-y8ivea.project.space';
const INDEX_NAME = 'deployment-guides';
const MAX_RETRIES = 120; // 10 minutes max wait
const RETRY_DELAY = 5000; // 5 seconds

// Sample documents to index
const DOCUMENTS = [
  {
    url: "https://developer.mittwald.de/docs/v2/platform/deployment/container-actions/",
    title: "Container Actions - Deployment Guide",
    content: "This guide covers container deployment actions on Mittwald platform. Learn how to deploy, manage, and scale containers effectively. Topics include Docker container management, Kubernetes deployments, and container orchestration best practices. Container actions allow you to start, stop, restart, and manage container lifecycles through the Mittwald API and CLI tools.",
    timestamp: new Date().toISOString()
  },
  {
    url: "https://developer.mittwald.de/docs/v2/platform/deployment/deployer/",
    title: "Deployer - PHP Deployment Tool",
    content: "Deployer is a deployment tool for PHP applications. This guide explains how to use Deployer with Mittwald hosting. Learn about deployment recipes, parallel deployments, rollback strategies, and zero-downtime deployments for PHP applications. Deployer integrates seamlessly with Git repositories and supports multiple deployment stages.",
    timestamp: new Date().toISOString()
  },
  {
    url: "https://developer.mittwald.de/docs/v2/platform/deployment/terraform/",
    title: "Terraform - Infrastructure as Code",
    content: "Deploy and manage Mittwald infrastructure using Terraform. This guide covers Terraform provider configuration, resource management, state handling, and best practices for infrastructure as code on Mittwald platform. Use Terraform to provision projects, databases, domains, and other resources programmatically.",
    timestamp: new Date().toISOString()
  },
  {
    url: "https://developer.mittwald.de/docs/v2/platform/deployment/typo3surf/",
    title: "TYPO3 Surf - TYPO3 Deployment",
    content: "TYPO3 Surf is a professional deployment tool for TYPO3 CMS. Learn how to configure Surf deployments, manage multiple stages, handle database migrations, and implement continuous deployment for TYPO3 projects on Mittwald. Surf provides advanced features like smoke tests, rollback capabilities, and deployment notifications.",
    timestamp: new Date().toISOString()
  }
];

// Wait for OpenSearch to be ready
async function waitForOpenSearch() {
  console.log('Waiting for OpenSearch to be ready...');
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.get(OPENSEARCH_API_URL, {
        timeout: 5000,
        validateStatus: (status) => status < 500
      });
      
      if (response.status === 200) {
        console.log('✅ OpenSearch is ready!');
        return true;
      }
    } catch (error) {
      if (error.code === 'ENOTFOUND') {
        console.log(`Waiting for DNS/SSL... (${i + 1}/${MAX_RETRIES})`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`Service not ready... (${i + 1}/${MAX_RETRIES})`);
      } else {
        console.log(`Connection error: ${error.message} (${i + 1}/${MAX_RETRIES})`);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  }
  
  return false;
}

// Create index
async function createIndex() {
  try {
    await axios.put(`${OPENSEARCH_API_URL}/${INDEX_NAME}`, {
      mappings: {
        properties: {
          url: { type: 'keyword' },
          title: { type: 'text' },
          content: { type: 'text' },
          timestamp: { type: 'date' }
        }
      }
    });
    console.log('✅ Index created successfully');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('ℹ️  Index already exists');
    } else {
      console.error('❌ Error creating index:', error.message);
    }
  }
}

// Index documents
async function indexDocuments() {
  console.log('Indexing documents...');
  
  for (const doc of DOCUMENTS) {
    try {
      const response = await axios.post(`${OPENSEARCH_API_URL}/${INDEX_NAME}/_doc`, doc);
      console.log(`✅ Indexed: ${doc.title}`);
    } catch (error) {
      console.error(`❌ Failed to index ${doc.title}:`, error.message);
    }
  }
}

// Verify indexing
async function verifyIndexing() {
  try {
    const response = await axios.get(`${OPENSEARCH_API_URL}/${INDEX_NAME}/_count`);
    console.log(`\n📊 Total documents indexed: ${response.data.count}`);
    
    // Test search
    const searchResponse = await axios.get(`${OPENSEARCH_API_URL}/${INDEX_NAME}/_search?q=deployment`);
    console.log(`🔍 Search for 'deployment' returned ${searchResponse.data.hits.total.value} results`);
  } catch (error) {
    console.error('❌ Error verifying index:', error.message);
  }
}

// Main function
async function main() {
  console.log('Starting OpenSearch indexer...');
  console.log(`Target: ${OPENSEARCH_API_URL}`);
  
  // Wait for OpenSearch
  const ready = await waitForOpenSearch();
  if (!ready) {
    console.error('❌ OpenSearch is not ready after maximum retries');
    process.exit(1);
  }
  
  // Create index
  await createIndex();
  
  // Index documents
  await indexDocuments();
  
  // Verify
  await verifyIndexing();
  
  console.log('\n✅ Indexing completed successfully!');
}

// Run
main().catch(console.error);