#!/usr/bin/env node

/**
 * Test script to verify connection logging is working
 * Makes simple HTTP requests to test the enhanced logging
 */

const https = require('https');
const http = require('http');

// Allow self-signed certificates for testing
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('🧪 Testing connection logging...');

// Test HTTPS connection (port 3000)
const httpsOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
  headers: {
    'User-Agent': 'ConnectionLogTest/1.0'
  }
};

console.log('📡 Testing HTTPS connection to port 3000...');
const httpsReq = https.request(httpsOptions, (res) => {
  console.log(`✅ HTTPS Response: ${res.statusCode}`);
  res.on('data', () => {}); // consume data
  res.on('end', () => {
    console.log('✅ HTTPS request completed');
    
    // Test HTTP fallback connection (port 3001)
    console.log('📡 Testing HTTP fallback connection to port 3001...');
    const httpOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET',
      headers: {
        'User-Agent': 'ConnectionLogTest/1.0'
      }
    };
    
    const httpReq = http.request(httpOptions, (res) => {
      console.log(`✅ HTTP Response: ${res.statusCode}`);
      res.on('data', () => {}); // consume data
      res.on('end', () => {
        console.log('✅ HTTP request completed');
        console.log('🎉 Connection logging test completed');
      });
    });
    
    httpReq.on('error', (err) => {
      console.log(`❌ HTTP request failed: ${err.message}`);
    });
    
    httpReq.end();
  });
});

httpsReq.on('error', (err) => {
  console.log(`❌ HTTPS request failed: ${err.message}`);
});

httpsReq.end();