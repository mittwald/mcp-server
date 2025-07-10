const puppeteer = require('puppeteer');
const axios = require('axios');

// Configuration
const OPENSEARCH_URL = 'http://opensearch-api.p-y8ivea.project.space';
const INDEX_NAME = 'deployment-guides';
const PAGES_TO_CRAWL = [
  'https://developer.mittwald.de/docs/v2/platform/deployment/container-actions/',
  'https://developer.mittwald.de/docs/v2/platform/deployment/deployer/',
  'https://developer.mittwald.de/docs/v2/platform/deployment/terraform/',
  'https://developer.mittwald.de/docs/v2/platform/deployment/typo3surf/'
];

// Create index with custom mapping
async function createIndex() {
  try {
    await axios.put(`${OPENSEARCH_URL}/${INDEX_NAME}`, {
      mappings: {
        properties: {
          url: { type: 'keyword' },
          title: { type: 'text' },
          content: { type: 'text' },
          headings: { type: 'text' },
          timestamp: { type: 'date' }
        }
      }
    });
    console.log(`Index '${INDEX_NAME}' created successfully`);
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log(`Index '${INDEX_NAME}' already exists`);
    } else {
      console.error('Error creating index:', error.message);
    }
  }
}

// Crawl a single page
async function crawlPage(browser, url) {
  console.log(`Crawling: ${url}`);
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Extract content
    const pageData = await page.evaluate(() => {
      // Get title
      const title = document.querySelector('h1')?.textContent || document.title;
      
      // Get all text content
      const contentElements = document.querySelectorAll('p, li, pre, code');
      const content = Array.from(contentElements)
        .map(el => el.textContent)
        .filter(text => text && text.trim())
        .join(' ');
      
      // Get all headings for better search context
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'))
        .map(el => el.textContent)
        .filter(text => text && text.trim())
        .join(' ');
      
      return { title, content, headings };
    });
    
    await page.close();
    return pageData;
  } catch (error) {
    console.error(`Error crawling ${url}:`, error.message);
    await page.close();
    return null;
  }
}

// Index a document in OpenSearch
async function indexDocument(doc) {
  try {
    const response = await axios.post(`${OPENSEARCH_URL}/${INDEX_NAME}/_doc`, doc);
    console.log(`Indexed: ${doc.title}`);
    return response.data;
  } catch (error) {
    console.error('Error indexing document:', error.message);
    return null;
  }
}

// Main indexing function
async function main() {
  console.log('Starting deployment guides indexer...');
  
  // Create index
  await createIndex();
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Crawl each page
    for (const url of PAGES_TO_CRAWL) {
      const pageData = await crawlPage(browser, url);
      
      if (pageData) {
        // Prepare document for indexing
        const document = {
          url: url,
          title: pageData.title,
          content: pageData.content,
          headings: pageData.headings,
          timestamp: new Date().toISOString()
        };
        
        // Index the document
        await indexDocument(document);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('Indexing completed successfully!');
    
    // Verify index stats
    const statsResponse = await axios.get(`${OPENSEARCH_URL}/${INDEX_NAME}/_stats`);
    const docCount = statsResponse.data._all.primaries.docs.count;
    console.log(`Total documents indexed: ${docCount}`);
    
  } catch (error) {
    console.error('Error during indexing:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the indexer
main().catch(console.error);