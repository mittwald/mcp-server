#!/usr/bin/env ts-node
/**
 * Coordinated test runner for phase-aware tests
 * Allows running all tests in a specific phase or running complete test cycles
 */

import { PhaseTestRunner } from './utils/phase-test-runner';
import { logger } from '../src/utils/logger';
import * as path from 'path';
import * as fs from 'fs/promises';

interface TestSuiteConfig {
  name: string;
  testFile: string;
  enabled: boolean;
  timeout?: number;
}

// Define all phase-aware test suites
const TEST_SUITES: TestSuiteConfig[] = [
  {
    name: 'Simple Deployment',
    testFile: 'tests/functional/simple-deployment.test.ts',
    enabled: true,
    timeout: 900000 // 15 minutes
  },
  {
    name: 'Container Operations',
    testFile: 'tests/functional/containers.test.ts',
    enabled: true,
    timeout: 600000 // 10 minutes
  },
  {
    name: 'Full Lifecycle',
    testFile: 'tests/functional/full-lifecycle.test.ts',
    enabled: false, // Enable after refactoring
    timeout: 1800000 // 30 minutes
  },
  {
    name: 'App Create',
    testFile: 'tests/functional/app-create.test.ts',
    enabled: false, // Enable after refactoring
    timeout: 600000 // 10 minutes
  },
  {
    name: 'App Installations',
    testFile: 'tests/functional/app-installations.test.ts',
    enabled: false, // Enable after refactoring
    timeout: 900000 // 15 minutes
  }
];

async function runPhaseTests() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const phase = args[0] || 'all';
  const suiteName = args[1]; // Optional: run specific suite
  const skipCleanup = args.includes('--skip-cleanup');
  
  // Validate phase
  const validPhases = ['setup', 'test', 'teardown', 'all'];
  if (!validPhases.includes(phase)) {
    console.error(`Invalid phase: ${phase}`);
    console.error(`Valid phases: ${validPhases.join(', ')}`);
    process.exit(1);
  }
  
  // Filter test suites
  let suitesToRun = TEST_SUITES.filter(suite => suite.enabled);
  if (suiteName) {
    suitesToRun = suitesToRun.filter(suite => 
      suite.name.toLowerCase().includes(suiteName.toLowerCase())
    );
    if (suitesToRun.length === 0) {
      console.error(`No matching suite found for: ${suiteName}`);
      process.exit(1);
    }
  }
  
  logger.info(`Running phase: ${phase}`);
  logger.info(`Suites to run: ${suitesToRun.map(s => s.name).join(', ')}`);
  if (skipCleanup) {
    logger.info('Cleanup will be skipped');
  }
  
  try {
    if (phase === 'all') {
      // Run complete cycle for each suite
      for (const suite of suitesToRun) {
        logger.info(`\n${'='.repeat(60)}`);
        logger.info(`Running complete cycle for: ${suite.name}`);
        logger.info(`${'='.repeat(60)}\n`);
        
        await PhaseTestRunner.runFullCycle(
          [suite.testFile],
          { skipCleanup, timeout: suite.timeout }
        );
      }
    } else if (phase === 'setup') {
      // Run setup phase for all suites to create shared project
      logger.info(`\n${'='.repeat(60)}`);
      logger.info('PHASE 1: SETUP - Creating test projects');
      logger.info(`${'='.repeat(60)}\n`);
      
      // For setup, we can run tests individually to create separate projects
      // Or run them together to share a project (depending on test design)
      for (const suite of suitesToRun) {
        logger.info(`Setting up: ${suite.name}`);
        await PhaseTestRunner.runTest({
          testFile: suite.testFile,
          phase: 'setup',
          timeout: suite.timeout
        });
      }
    } else if (phase === 'test') {
      // Run test phase for all suites
      logger.info(`\n${'='.repeat(60)}`);
      logger.info('PHASE 2: TEST - Running tests');
      logger.info(`${'='.repeat(60)}\n`);
      
      for (const suite of suitesToRun) {
        logger.info(`Testing: ${suite.name}`);
        await PhaseTestRunner.runTest({
          testFile: suite.testFile,
          phase: 'test',
          timeout: suite.timeout
        });
      }
    } else if (phase === 'teardown') {
      // Run teardown phase for all suites
      logger.info(`\n${'='.repeat(60)}`);
      logger.info('PHASE 3: TEARDOWN - Cleaning up');
      logger.info(`${'='.repeat(60)}\n`);
      
      for (const suite of suitesToRun) {
        logger.info(`Cleaning up: ${suite.name}`);
        await PhaseTestRunner.runTest({
          testFile: suite.testFile,
          phase: 'teardown',
          timeout: suite.timeout
        });
      }
    }
    
    logger.info('\n✅ All tests completed successfully');
    
    // Clean up test state directory if running full cycle
    if (phase === 'all' && !skipCleanup) {
      try {
        const stateDir = path.join(process.cwd(), 'test-state');
        await fs.rmdir(stateDir, { recursive: true });
        logger.info('Cleaned up test state directory');
      } catch (error) {
        // Ignore if directory doesn't exist
      }
    }
    
  } catch (error) {
    logger.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Show usage if no arguments
if (process.argv.length === 2) {
  console.log(`
Usage: npm run test:phases [phase] [suite-name] [options]

Phases:
  setup     - Create test projects and infrastructure
  test      - Run tests using existing projects
  teardown  - Clean up all test resources
  all       - Run complete test cycle (default)

Options:
  --skip-cleanup  - Skip cleanup phase (for debugging)

Examples:
  npm run test:phases                    # Run all tests, all phases
  npm run test:phases setup              # Only run setup phase
  npm run test:phases test               # Only run test phase
  npm run test:phases teardown           # Only run cleanup phase
  npm run test:phases all deployment     # Run all phases for deployment tests
  npm run test:phases test container     # Run test phase for container tests
  npm run test:phases all --skip-cleanup # Run all phases but skip cleanup

Available test suites:
${TEST_SUITES.map(s => `  - ${s.name} (${s.enabled ? 'enabled' : 'disabled'})`).join('\n')}
`);
  process.exit(0);
}

// Run the tests
runPhaseTests().catch(error => {
  logger.error('Unexpected error:', error);
  process.exit(1);
});