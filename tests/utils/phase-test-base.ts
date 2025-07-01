/**
 * Base test class that supports three-phase testing:
 * 1. Setup (project creation)
 * 2. Test execution
 * 3. Teardown (cleanup)
 * 
 * Phases can be run independently or as a coordinated suite
 */

import { MCPTestClient } from './mcp-test-client';
import { TestProjectManager, TestProject } from './test-project-manager';
import { logger } from '../../src/utils/logger';
import fs from 'fs/promises';
import path from 'path';

export interface TestPhaseConfig {
  phase: 'setup' | 'test' | 'teardown' | 'all';
  projectName?: string; // For test/teardown phases
  skipCleanup?: boolean; // For debugging
  testSuiteName: string;
}

export interface TestState {
  projects: TestProject[];
  timestamp: string;
  suiteName: string;
}

export abstract class PhaseTestBase {
  protected client!: MCPTestClient;
  protected projectManager!: TestProjectManager;
  protected stateFilePath: string;
  protected testState?: TestState;
  
  constructor(protected config: TestPhaseConfig) {
    // State files stored in test-state directory
    this.stateFilePath = path.join(
      process.cwd(),
      'test-state',
      `${config.testSuiteName}.json`
    );
  }

  /**
   * Initialize test client and project manager
   */
  protected async initializeClients(): Promise<void> {
    this.client = new MCPTestClient();
    await this.client.initialize();
    this.projectManager = new TestProjectManager(this.client);
  }

  /**
   * Generate project name with [TEST] timestamp convention
   */
  protected generateProjectName(suffix?: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = `[TEST] ${timestamp}`;
    return suffix ? `${baseName} - ${suffix}` : baseName;
  }

  /**
   * Save test state to file for phase persistence
   */
  protected async saveTestState(state: TestState): Promise<void> {
    await fs.mkdir(path.dirname(this.stateFilePath), { recursive: true });
    await fs.writeFile(this.stateFilePath, JSON.stringify(state, null, 2));
    logger.info(`Test state saved to ${this.stateFilePath}`);
  }

  /**
   * Load test state from file
   */
  protected async loadTestState(): Promise<TestState | null> {
    try {
      const data = await fs.readFile(this.stateFilePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Clean up test state file
   */
  protected async cleanupStateFile(): Promise<void> {
    try {
      await fs.unlink(this.stateFilePath);
      logger.info(`Test state file removed: ${this.stateFilePath}`);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  /**
   * Phase 1: Setup - Create test projects
   */
  protected async runSetupPhase(): Promise<TestState> {
    logger.info('=== PHASE 1: SETUP ===');
    
    const projects = await this.createTestProjects();
    
    const state: TestState = {
      projects,
      timestamp: new Date().toISOString(),
      suiteName: this.config.testSuiteName
    };
    
    await this.saveTestState(state);
    logger.info(`Setup phase completed. Created ${projects.length} project(s)`);
    
    return state;
  }

  /**
   * Phase 2: Test - Run actual tests
   */
  protected async runTestPhase(): Promise<void> {
    logger.info('=== PHASE 2: TEST ===');
    
    // Load test state
    const state = await this.loadTestState();
    if (!state) {
      throw new Error(
        `No test state found for suite "${this.config.testSuiteName}". ` +
        `Run setup phase first or provide --project-name parameter.`
      );
    }
    
    this.testState = state;
    
    // Restore projects to project manager
    for (const project of state.projects) {
      this.projectManager['createdProjects'].push(project);
    }
    
    logger.info(`Loaded ${state.projects.length} project(s) from state`);
    
    // Run the actual tests
    await this.runTests(state.projects);
  }

  /**
   * Phase 3: Teardown - Clean up resources
   */
  protected async runTeardownPhase(): Promise<void> {
    logger.info('=== PHASE 3: TEARDOWN ===');
    
    // Load test state
    const state = await this.loadTestState();
    if (!state) {
      logger.warn(`No test state found for suite "${this.config.testSuiteName}"`);
      return;
    }
    
    // Restore projects to project manager for cleanup
    for (const project of state.projects) {
      this.projectManager['createdProjects'].push(project);
    }
    
    logger.info(`Cleaning up ${state.projects.length} project(s)`);
    
    // Run cleanup
    await this.projectManager.cleanup();
    
    // Remove state file
    await this.cleanupStateFile();
    
    logger.info('Teardown phase completed');
  }

  /**
   * Run all phases in sequence
   */
  protected async runAllPhases(): Promise<void> {
    // Setup
    const state = await this.runSetupPhase();
    
    try {
      // Test
      this.testState = state;
      await this.runTests(state.projects);
      
      // Teardown (unless skipped)
      if (!this.config.skipCleanup) {
        await this.runTeardownPhase();
      } else {
        logger.warn('Skipping cleanup as requested');
      }
    } catch (error) {
      // Always attempt cleanup on error unless explicitly skipped
      if (!this.config.skipCleanup) {
        logger.error('Test failed, running cleanup...', error);
        await this.runTeardownPhase();
      }
      throw error;
    }
  }

  /**
   * Main entry point for phase-aware test execution
   */
  async run(): Promise<void> {
    await this.initializeClients();
    
    try {
      switch (this.config.phase) {
        case 'setup':
          await this.runSetupPhase();
          break;
          
        case 'test':
          await this.runTestPhase();
          break;
          
        case 'teardown':
          await this.runTeardownPhase();
          break;
          
        case 'all':
          await this.runAllPhases();
          break;
          
        default:
          throw new Error(`Invalid phase: ${this.config.phase}`);
      }
    } finally {
      await this.client.close();
    }
  }

  /**
   * Abstract methods to be implemented by test classes
   */
  
  /**
   * Create test projects for this suite
   */
  protected abstract createTestProjects(): Promise<TestProject[]>;
  
  /**
   * Run the actual tests using the created projects
   */
  protected abstract runTests(projects: TestProject[]): Promise<void>;
}

/**
 * Helper to parse phase from environment or command line
 */
export function getTestPhaseConfig(suiteName: string): TestPhaseConfig {
  const phase = (process.env.TEST_PHASE || 'all') as TestPhaseConfig['phase'];
  const projectName = process.env.TEST_PROJECT_NAME;
  const skipCleanup = process.env.SKIP_CLEANUP === 'true';
  
  return {
    phase,
    projectName,
    skipCleanup,
    testSuiteName: suiteName
  };
}