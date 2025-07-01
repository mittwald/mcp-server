/**
 * Phase-aware test runner for executing tests in separate phases
 */

import { spawn } from 'child_process';
import { logger } from '../../src/utils/logger';

export interface PhaseTestRunnerConfig {
  testFile: string;
  phase: 'setup' | 'test' | 'teardown' | 'all';
  projectName?: string;
  skipCleanup?: boolean;
  timeout?: number;
}

export class PhaseTestRunner {
  /**
   * Run a test file with specific phase configuration
   */
  static async runTest(config: PhaseTestRunnerConfig): Promise<void> {
    const env = {
      ...process.env,
      TEST_PHASE: config.phase,
      ...(config.projectName && { TEST_PROJECT_NAME: config.projectName }),
      ...(config.skipCleanup && { SKIP_CLEANUP: 'true' })
    };

    logger.info(`Running ${config.testFile} in ${config.phase} phase`);

    return new Promise((resolve, reject) => {
      const args = [
        'run',
        'test:single',
        '--',
        config.testFile,
        ...(config.timeout ? [`--testTimeout=${config.timeout}`] : [])
      ];

      const child = spawn('npm', args, {
        env,
        stdio: 'inherit',
        shell: true
      });

      child.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Test failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Run multiple test files in sequence with the same phase
   */
  static async runTestSuite(
    testFiles: string[],
    phase: 'setup' | 'test' | 'teardown' | 'all',
    options: Partial<PhaseTestRunnerConfig> = {}
  ): Promise<void> {
    for (const testFile of testFiles) {
      await this.runTest({
        testFile,
        phase,
        ...options
      });
    }
  }

  /**
   * Run a complete test cycle across all phases
   */
  static async runFullCycle(
    testFiles: string[],
    options: Partial<PhaseTestRunnerConfig> = {}
  ): Promise<void> {
    try {
      // Phase 1: Setup
      logger.info('=== RUNNING SETUP PHASE FOR ALL TESTS ===');
      await this.runTestSuite(testFiles, 'setup', options);

      // Phase 2: Test
      logger.info('=== RUNNING TEST PHASE FOR ALL TESTS ===');
      await this.runTestSuite(testFiles, 'test', options);

      // Phase 3: Teardown (unless skipped)
      if (!options.skipCleanup) {
        logger.info('=== RUNNING TEARDOWN PHASE FOR ALL TESTS ===');
        await this.runTestSuite(testFiles, 'teardown', options);
      }
    } catch (error) {
      // Always attempt cleanup on error unless explicitly skipped
      if (!options.skipCleanup) {
        logger.error('Test cycle failed, attempting cleanup...', error);
        try {
          await this.runTestSuite(testFiles, 'teardown', options);
        } catch (cleanupError) {
          logger.error('Cleanup also failed:', cleanupError);
        }
      }
      throw error;
    }
  }
}

/**
 * CLI entry point for phase test runner
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: phase-test-runner <phase> <test-file> [options]');
    console.error('Phases: setup, test, teardown, all');
    console.error('Options:');
    console.error('  --project-name=<name>  Specify project name for test/teardown phases');
    console.error('  --skip-cleanup         Skip cleanup phase');
    console.error('  --timeout=<ms>         Test timeout in milliseconds');
    process.exit(1);
  }

  const [phase, testFile, ...options] = args;
  
  const config: PhaseTestRunnerConfig = {
    testFile,
    phase: phase as any,
    projectName: options.find(o => o.startsWith('--project-name='))?.split('=')[1],
    skipCleanup: options.includes('--skip-cleanup'),
    timeout: parseInt(options.find(o => o.startsWith('--timeout='))?.split('=')[1] || '0') || undefined
  };

  PhaseTestRunner.runTest(config)
    .then(() => {
      logger.info(`Test completed successfully`);
      process.exit(0);
    })
    .catch((error) => {
      logger.error(`Test failed:`, error);
      process.exit(1);
    });
}