#!/usr/bin/env node

/**
 * OAuth Test Runner
 * Runs OAuth integration tests in small batches to prevent CLI output overflow
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const testFiles = [
  'oauth-components',
  'oauth-basic'
];

// Optional: Check if Redis and MockOAuth2Server are available
const checkDependencies = async () => {
  console.log('🔍 Checking test dependencies...');
  
  // Check if Redis is available
  try {
    const redis = spawn('redis-cli', ['ping'], { stdio: 'pipe' });
    await new Promise((resolve, reject) => {
      redis.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Redis is available');
          resolve();
        } else {
          console.log('⚠️  Redis not available - some tests may be skipped');
          resolve();
        }
      });
      redis.on('error', () => {
        console.log('⚠️  Redis not available - some tests may be skipped');
        resolve();
      });
    });
  } catch (error) {
    console.log('⚠️  Redis not available - some tests may be skipped');
  }

  // Check if MockOAuth2Server is available
  try {
    const response = await fetch('http://localhost:8080/default/.well-known/openid-configuration');
    if (response.ok) {
      console.log('✅ MockOAuth2Server is available');
    } else {
      console.log('⚠️  MockOAuth2Server not available - some tests may be skipped');
    }
  } catch (error) {
    console.log('⚠️  MockOAuth2Server not available - some tests may be skipped');
  }
};

const runTest = async (testName) => {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Running ${testName}...`);
    
    const testProcess = spawn('npm', ['test', testName], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' }
    });

    let stdout = '';
    let stderr = '';

    testProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    testProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testName} passed`);
        // Only show summary, not full output
        const lines = stdout.split('\n');
        const summaryLine = lines.find(line => line.includes('Tests') && line.includes('passed'));
        if (summaryLine) {
          console.log(`   ${summaryLine.trim()}`);
        }
        resolve({ testName, passed: true, code });
      } else {
        console.log(`❌ ${testName} failed`);
        // Show limited error output
        const errorLines = stderr.split('\n').slice(0, 10);
        if (errorLines.length > 0) {
          console.log('   Error output:');
          errorLines.forEach(line => {
            if (line.trim()) console.log(`   ${line}`);
          });
        }
        resolve({ testName, passed: false, code });
      }
    });

    testProcess.on('error', (error) => {
      console.log(`❌ ${testName} error: ${error.message}`);
      reject(error);
    });
  });
};

const runAllTests = async () => {
  console.log('🚀 Starting OAuth Integration Tests');
  
  await checkDependencies();
  
  const results = [];
  
  for (const testFile of testFiles) {
    const testPath = join('tests', 'integration', `${testFile}.test.ts`);
    
    if (!existsSync(testPath)) {
      console.log(`⚠️  Test file not found: ${testPath}`);
      continue;
    }
    
    try {
      const result = await runTest(testFile);
      results.push(result);
    } catch (error) {
      console.error(`💥 Failed to run ${testFile}:`, error.message);
      results.push({ testName: testFile, passed: false, error: error.message });
    }
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`   ${status} ${result.testName}`);
  });
  
  console.log(`\n🎯 ${passed}/${total} test files passed`);
  
  if (passed === total) {
    console.log('🎉 All OAuth integration tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some OAuth integration tests failed');
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}