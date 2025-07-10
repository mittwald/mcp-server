const puppeteer = require('puppeteer');

// Configuration
const OPENSEARCH_DASHBOARDS_URL = 'https://opensearch.p-y8ivea.project.space';
const VALIDATION_TIMEOUT = 60000; // 60 seconds

// Test data
const SEARCH_QUERIES = [
  'container',
  'deployment',
  'terraform',
  'deployer',
  'typo3surf'
];

// Validate that OpenSearch Dashboards is accessible
async function validateDashboardAccess(page) {
  console.log('Testing OpenSearch Dashboards accessibility...');
  
  try {
    const response = await page.goto(OPENSEARCH_DASHBOARDS_URL, { 
      waitUntil: 'networkidle2',
      timeout: VALIDATION_TIMEOUT 
    });
    
    if (response.status() !== 200) {
      throw new Error(`Dashboard returned status ${response.status()}`);
    }
    
    // Wait for the main app to load - try multiple selectors
    try {
      await page.waitForSelector('body', { timeout: 5000 });
      
      // Check if we're on the home page or need to wait for redirect
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      // Wait for any sign that OpenSearch Dashboards has loaded
      await Promise.race([
        page.waitForSelector('[data-test-subj="homeApp"]', { timeout: 15000 }),
        page.waitForSelector('.euiPageBody', { timeout: 15000 }),
        page.waitForSelector('#opensearchDashboards', { timeout: 15000 }),
        page.waitForSelector('.osdWelcomeView', { timeout: 15000 }),
        page.waitForSelector('[class*="application"]', { timeout: 15000 })
      ]);
    } catch (selectorError) {
      console.log('Primary selectors not found, checking page content...');
      const pageContent = await page.content();
      if (pageContent.includes('OpenSearch') || pageContent.includes('opensearch')) {
        console.log('OpenSearch content detected in page');
      } else {
        throw new Error('No OpenSearch content found');
      }
    }
    
    console.log('✅ OpenSearch Dashboards is accessible');
    return true;
  } catch (error) {
    console.error('❌ Failed to access OpenSearch Dashboards:', error.message);
    return false;
  }
}

// Navigate to Discover section
async function navigateToDiscover(page) {
  console.log('Navigating to Discover section...');
  
  try {
    // Try to find and click the Discover link
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const discoverLink = links.find(link => 
        link.textContent.includes('Discover') || 
        link.href.includes('/app/discover')
      );
      if (discoverLink) {
        discoverLink.click();
      } else {
        // Try navigation menu
        const menuItems = Array.from(document.querySelectorAll('[data-test-subj*="navDrawer"] a, .euiSideNavItemButton'));
        const discoverItem = menuItems.find(item => 
          item.textContent.includes('Discover')
        );
        if (discoverItem) {
          discoverItem.click();
        }
      }
    });
    
    // Wait for Discover page to load
    await page.waitForFunction(
      () => window.location.href.includes('/app/discover'),
      { timeout: 15000 }
    );
    
    console.log('✅ Successfully navigated to Discover');
    return true;
  } catch (error) {
    console.error('❌ Failed to navigate to Discover:', error.message);
    return false;
  }
}

// Perform search validation
async function validateSearch(page, query) {
  console.log(`Testing search for: "${query}"...`);
  
  try {
    // Find search input
    const searchInput = await page.waitForSelector(
      'input[type="text"][placeholder*="Search"], input[data-test-subj*="queryInput"], .euiFieldSearch',
      { timeout: 10000 }
    );
    
    // Clear and type search query
    await searchInput.click({ clickCount: 3 });
    await searchInput.type(query);
    
    // Submit search (Enter key)
    await page.keyboard.press('Enter');
    
    // Wait for results to load
    await page.waitForTimeout(3000);
    
    // Check for results
    const hasResults = await page.evaluate(() => {
      // Look for result indicators
      const hitCount = document.querySelector('[data-test-subj*="hitCount"], .euiText--small');
      const resultRows = document.querySelectorAll('[data-test-subj*="docTableRow"], .discover-table-row');
      const noResults = document.querySelector('[data-test-subj*="noResults"]');
      
      return {
        hitCount: hitCount ? hitCount.textContent : 'unknown',
        resultCount: resultRows.length,
        hasNoResultsMessage: !!noResults
      };
    });
    
    if (hasResults.resultCount > 0 || (hasResults.hitCount && !hasResults.hitCount.includes('0'))) {
      console.log(`✅ Search for "${query}" returned results (${hasResults.hitCount} hits)`);
      return true;
    } else {
      console.log(`⚠️  Search for "${query}" returned no results`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Failed to search for "${query}":`, error.message);
    return false;
  }
}

// Take screenshot for debugging
async function takeScreenshot(page, name) {
  try {
    const filename = `screenshot-${name}-${Date.now()}.png`;
    await page.screenshot({ 
      path: filename,
      fullPage: true 
    });
    console.log(`📸 Screenshot saved: ${filename}`);
  } catch (error) {
    console.error('Failed to take screenshot:', error.message);
  }
}

// Main validation function
async function main() {
  console.log('Starting OpenSearch validation...');
  console.log(`Target URL: ${OPENSEARCH_DASHBOARDS_URL}`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const results = {
    dashboardAccessible: false,
    discoverAccessible: false,
    searchResults: {}
  };
  
  try {
    const page = await browser.newPage();
    
    // Set user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    
    // Test dashboard access
    results.dashboardAccessible = await validateDashboardAccess(page);
    if (!results.dashboardAccessible) {
      await takeScreenshot(page, 'dashboard-failed');
      throw new Error('Dashboard is not accessible');
    }
    
    await takeScreenshot(page, 'dashboard-loaded');
    
    // Navigate to Discover
    results.discoverAccessible = await navigateToDiscover(page);
    if (results.discoverAccessible) {
      await takeScreenshot(page, 'discover-loaded');
      
      // Perform searches
      for (const query of SEARCH_QUERIES) {
        results.searchResults[query] = await validateSearch(page, query);
        await page.waitForTimeout(1000); // Brief pause between searches
      }
    }
    
    // Summary
    console.log('\n=== Validation Summary ===');
    console.log(`Dashboard Accessible: ${results.dashboardAccessible ? '✅' : '❌'}`);
    console.log(`Discover Accessible: ${results.discoverAccessible ? '✅' : '❌'}`);
    
    if (Object.keys(results.searchResults).length > 0) {
      console.log('\nSearch Results:');
      for (const [query, success] of Object.entries(results.searchResults)) {
        console.log(`  ${query}: ${success ? '✅' : '❌'}`);
      }
    }
    
    const successfulSearches = Object.values(results.searchResults).filter(v => v).length;
    const totalSearches = Object.keys(results.searchResults).length;
    
    console.log(`\nOverall: ${successfulSearches}/${totalSearches} searches successful`);
    
    if (results.dashboardAccessible && successfulSearches > 0) {
      console.log('\n🎉 Validation PASSED! OpenSearch is working correctly.');
    } else {
      console.log('\n⚠️  Validation FAILED. Please check the logs above.');
    }
    
  } catch (error) {
    console.error('Validation error:', error.message);
    await takeScreenshot(await browser.newPage(), 'error');
  } finally {
    await browser.close();
  }
}

// Run validation
main().catch(console.error);