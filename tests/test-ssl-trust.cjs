#!/usr/bin/env node

/**
 * Test SSL certificate trust with different configurations
 */

const https = require('https');
const fs = require('fs');

const url = 'https://localhost:3000/health';

console.log('🔐 Testing SSL certificate trust...');

// Test 1: Default Node.js behavior
console.log('\n=== Test 1: Default Node.js SSL behavior ===');
testSSL(url, {}, 'Default');

// Test 2: With custom CA
const caPath = '/Users/robert/Library/Application Support/mkcert/rootCA.pem';
if (fs.existsSync(caPath)) {
  console.log('\n=== Test 2: With mkcert CA ===');
  const ca = fs.readFileSync(caPath);
  testSSL(url, { ca: [ca] }, 'Custom CA');
} else {
  console.log('\n❌ mkcert CA not found at:', caPath);
}

// Test 3: Reject unauthorized disabled
console.log('\n=== Test 3: SSL verification disabled ===');
testSSL(url, { rejectUnauthorized: false }, 'No verification');

function testSSL(url, options, testName) {
  const urlObj = new URL(url);
  
  const requestOptions = {
    hostname: urlObj.hostname,
    port: urlObj.port,
    path: urlObj.pathname,
    method: 'GET',
    ...options
  };
  
  const req = https.request(requestOptions, (res) => {
    console.log(`✅ ${testName}: ${res.statusCode} - Certificate accepted`);
    res.on('data', () => {}); // consume data
  });
  
  req.on('error', (error) => {
    console.log(`❌ ${testName}: ${error.code} - ${error.message}`);
  });
  
  req.setTimeout(5000, () => {
    console.log(`⏰ ${testName}: Timeout`);
    req.destroy();
  });
  
  req.end();
}