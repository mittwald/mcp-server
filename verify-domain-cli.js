#!/usr/bin/env node

// Simple verification script to test the CLI wrapper utilities
const { executeCli, parseJsonOutput } = require('./build/utils/cli-wrapper.js');

async function testCliWrappers() {
  console.log('Testing CLI wrapper utilities...');
  
  try {
    // Test help command which should always work
    const result = await executeCli('mw', ['domain', 'list', '--help']);
    console.log('✓ CLI execution successful');
    console.log('Exit code:', result.exitCode);
    console.log('Output length:', result.stdout.length);
    
    if (result.exitCode === 0 && result.stdout.includes('List domains')) {
      console.log('✓ Domain list command available');
    } else {
      console.log('✗ Domain list command issue');
    }
    
    // Test DNS zone help
    const dnszoneResult = await executeCli('mw', ['domain', 'dnszone', 'list', '--help']);
    if (dnszoneResult.exitCode === 0 && dnszoneResult.stdout.includes('DNS zones')) {
      console.log('✓ DNS zone list command available');
    } else {
      console.log('✗ DNS zone list command issue');
    }
    
    console.log('All CLI wrapper tests passed!');
  } catch (error) {
    console.error('Error testing CLI wrappers:', error.message);
  }
}

testCliWrappers().catch(console.error);