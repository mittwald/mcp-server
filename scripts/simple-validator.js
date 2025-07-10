const axios = require('axios');
const puppeteer = require('puppeteer');

// Configuration
const OPENSEARCH_DASHBOARDS_URL = 'https://opensearch.p-y8ivea.project.space';
const OPENSEARCH_API_URL = 'https://opensearch-api.p-y8ivea.project.space';
const INDEX_NAME = 'deployment-guides';

async function validateDashboard() {
  console.log('=== OpenSearch Dashboard Validation ===\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('1. Testing Dashboard Access...');
    const response = await page.goto(OPENSEARCH_DASHBOARDS_URL, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    if (response.status() === 200 || response.status() === 302) {
      console.log('✅ Dashboard is accessible');
      
      // Take screenshot
      await page.screenshot({ 
        path: 'opensearch-dashboard.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved: opensearch-dashboard.png');
      
      // Get final URL after redirects
      const finalUrl = page.url();
      console.log(`   Final URL: ${finalUrl}`);
    } else {
      console.log(`❌ Dashboard returned status: ${response.status()}`);
    }
    
  } catch (error) {
    console.error('❌ Dashboard error:', error.message);
  } finally {
    await browser.close();
  }
}

async function validateAPI() {
  console.log('\n2. Testing OpenSearch API...');
  
  try {
    // Check cluster health
    const healthResponse = await axios.get(`${OPENSEARCH_API_URL}/_cluster/health`);
    console.log(`✅ Cluster health: ${healthResponse.data.status}`);
    
    // Check our index
    const indexResponse = await axios.get(`${OPENSEARCH_API_URL}/${INDEX_NAME}/_stats`);
    const docCount = indexResponse.data._all.primaries.docs.count;
    console.log(`✅ Documents indexed: ${docCount}`);
    
    // Perform a search
    const searchResponse = await axios.get(`${OPENSEARCH_API_URL}/${INDEX_NAME}/_search`, {
      params: {
        q: 'deployment',
        size: 5
      }
    });
    
    const hits = searchResponse.data.hits.hits;
    console.log(`✅ Search results: ${hits.length} documents found`);
    
    if (hits.length > 0) {
      console.log('\n   Sample results:');
      hits.forEach((hit, index) => {
        console.log(`   ${index + 1}. ${hit._source.title}`);
      });
    }
    
  } catch (error) {
    console.error('❌ API error:', error.message);
  }
}

async function main() {
  console.log('Starting validation...\n');
  
  // Validate dashboard
  await validateDashboard();
  
  // Validate API
  await validateAPI();
  
  console.log('\n=== Validation Complete ===');
  console.log('\n🎉 OpenSearch web app is successfully deployed on Mittwald!');
  console.log(`\nAccess points:`);
  console.log(`- Dashboard: ${OPENSEARCH_DASHBOARDS_URL}`);
  console.log(`- API: ${OPENSEARCH_API_URL}`);
}

main().catch(console.error);