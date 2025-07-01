/**
 * Phase-aware comprehensive tests for Mittwald container operations
 * Tests stack management, service deployment, volume management, and registry operations
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { PhaseTestBase, getTestPhaseConfig, TestProject } from '../utils/phase-test-base';
import { MCPTestClient } from '../utils/mcp-test-client';
import { TestProjectManager } from '../utils/test-project-manager';
import { parseToolContent, isDockerRunning } from '../utils/test-helpers';
import { logger } from '../../src/utils/logger';
import { 
  waitForServices, 
  waitForVolumes, 
  waitForStackProcessing,
  waitForStackReady,
  waitForServiceStatus 
} from '../utils/container-helpers';

// Test configuration
const TEST_CONFIG = {
  testTimeout: 600000, // 10 minutes for container operations
  setupTimeout: 300000, // 5 minutes for setup
  cleanupTimeout: 300000, // 5 minutes for cleanup
};

interface ContainerTestState {
  stackId: string;
  createdRegistries: string[];
  createdServices: Map<string, string>; // service name -> service ID
  createdVolumes: Map<string, string>; // volume name -> volume ID
}

class ContainerOperationsTest extends PhaseTestBase {
  private containerState: ContainerTestState = {
    stackId: '',
    createdRegistries: [],
    createdServices: new Map(),
    createdVolumes: new Map()
  };

  constructor() {
    super(getTestPhaseConfig('container-operations'));
  }

  /**
   * Phase 1: Create test projects and prepare container infrastructure
   */
  protected async createTestProjects(): Promise<TestProject[]> {
    const projects: TestProject[] = [];
    
    // Create one project for container operations
    const project = await this.projectManager.createTestProject('Container Operations');
    projects.push(project);
    
    // Get the default stack for the project
    const stacksResponse = await this.client.callTool('mittwald_container_list_stacks', {
      projectId: project.projectId,
      output: 'json'
    });
    
    const stacksContent = parseToolContent(stacksResponse.result);
    if (stacksContent.status === 'success' && stacksContent.data && stacksContent.data.length > 0) {
      this.containerState.stackId = stacksContent.data[0].id;
      logger.info(`Found existing stack: ${this.containerState.stackId}`);
      
      // Save container-specific state along with project state
      const state = await this.loadTestState();
      if (state) {
        (state as any).containerState = this.containerState;
        await this.saveTestState(state);
      }
    } else {
      logger.warn('No stack found for project. Container operations may fail.');
    }
    
    return projects;
  }

  /**
   * Phase 2: Run the container tests
   */
  protected async runTests(projects: TestProject[]): Promise<void> {
    if (projects.length === 0) {
      throw new Error('No projects available for testing');
    }
    
    const testProject = projects[0];
    
    // Load container state if running in test phase
    if (this.config.phase === 'test') {
      const state = await this.loadTestState();
      if (state && (state as any).containerState) {
        this.containerState = (state as any).containerState;
      }
    }
    
    if (!this.containerState.stackId) {
      throw new Error('No stack ID available for container tests');
    }
    
    // Run all container test suites
    await this.testStackOperations(testProject.projectId);
    await this.testRegistryOperations(testProject.projectId);
    await this.testServiceDeployment(testProject.projectId);
    await this.testVolumeManagement(testProject.projectId);
    await this.testServiceLogs(testProject.projectId);
    await this.testComplexContainerScenarios(testProject.projectId);
    await this.testContainerWithProjectVolume(testProject.projectId);
  }

  /**
   * Override cleanup to handle container-specific cleanup
   */
  protected async runTeardownPhase(): Promise<void> {
    logger.info('=== PHASE 3: TEARDOWN (Container-specific) ===');
    
    // Load test state
    const state = await this.loadTestState();
    if (!state) {
      logger.warn(`No test state found for suite "${this.config.testSuiteName}"`);
      return;
    }
    
    // Load container state
    if ((state as any).containerState) {
      this.containerState = (state as any).containerState;
    }
    
    // Clean up services and volumes by declaring empty stack
    if (this.containerState.stackId) {
      try {
        logger.info('Removing all services and volumes from stack...');
        await this.client.callTool('mittwald_container_declare_stack', {
          stackId: this.containerState.stackId,
          desiredServices: {},
          desiredVolumes: {}
        });
      } catch (error) {
        logger.error('Failed to clean up stack:', error);
      }
    }
    
    // Continue with standard project cleanup
    await super.runTeardownPhase();
  }

  /**
   * Test Stack Operations
   */
  private async testStackOperations(projectId: string): Promise<void> {
    logger.info('=== Testing Stack Operations ===');
    
    const response = await this.client.callTool('mittwald_container_list_stacks', {
      projectId: projectId,
      output: 'json'
    });
    
    const content = parseToolContent(response.result);
    expect(content.status).toBe('success');
    expect(content.data).toBeInstanceOf(Array);
    
    logger.info(`Found ${content.data.length} stacks in project`);
  }

  /**
   * Test Registry Operations
   */
  private async testRegistryOperations(projectId: string): Promise<void> {
    logger.info('=== Testing Registry Operations ===');
    
    // Note: Actual registry creation is skipped as it requires valid credentials
    logger.info('Skipping registry creation tests (requires valid credentials)');
    
    // List registries
    const response = await this.client.callTool('mittwald_container_list_registries', {
      projectId: projectId,
      output: 'json'
    });
    
    const content = parseToolContent(response.result);
    expect(content.status).toBe('success');
    expect(content.data).toBeInstanceOf(Array);
    expect(content.data.length).toBeGreaterThanOrEqual(2);
    
    logger.info(`Found ${content.data.length} registries`);
  }

  /**
   * Test Service Deployment
   */
  private async testServiceDeployment(projectId: string): Promise<void> {
    logger.info('=== Testing Service Deployment ===');
    
    // Deploy nginx container
    logger.info('Deploying nginx container...');
    const nginxResponse = await this.client.callTool('mittwald_container_declare_stack', {
      stackId: this.containerState.stackId,
      desiredServices: {
        nginx: {
          imageUri: 'nginx:latest',
          environment: {
            NGINX_HOST: 'example.com',
            NGINX_PORT: '80'
          },
          ports: [
            {
              containerPort: 80,
              protocol: 'tcp'
            }
          ]
        }
      }
    });
    
    const nginxContent = parseToolContent(nginxResponse.result);
    expect(nginxContent.status).toBe('success');
    
    // Wait for deployment
    const stackDetails = await waitForStackReady(this.client, this.containerState.stackId, { timeout: 60000 });
    
    // Deploy Redis with volume
    logger.info('Deploying Redis container with volume...');
    const redisResponse = await this.client.callTool('mittwald_container_declare_stack', {
      stackId: this.containerState.stackId,
      desiredServices: {
        nginx: {
          imageUri: 'nginx:latest',
          environment: {
            NGINX_HOST: 'example.com',
            NGINX_PORT: '80'
          },
          ports: [
            {
              containerPort: 80,
              protocol: 'tcp'
            }
          ]
        },
        redis: {
          imageUri: 'redis:7-alpine',
          environment: {
            REDIS_PASSWORD: 'testpass123'
          },
          ports: [
            {
              containerPort: 6379,
              protocol: 'tcp'
            }
          ],
          volumes: [
            {
              name: 'redis-data',
              mountPath: '/data',
              readOnly: false
            }
          ]
        }
      },
      desiredVolumes: {
        'redis-data': {
          size: '1Gi'
        }
      }
    });
    
    const redisContent = parseToolContent(redisResponse.result);
    expect(redisContent.status).toBe('success');
    
    // Wait and verify services
    const services = await waitForServices(this.client, projectId, 2, { timeout: 30000 });
    expect(services.length).toBeGreaterThanOrEqual(2);
    logger.info(`Deployed ${services.length} services`);
  }

  /**
   * Test Volume Management
   */
  private async testVolumeManagement(projectId: string): Promise<void> {
    logger.info('=== Testing Volume Management ===');
    
    // List volumes
    const volumes = await waitForVolumes(this.client, projectId, ['redis-data'], { timeout: 30000 });
    expect(volumes).toBeInstanceOf(Array);
    
    const volumeNames = volumes.map((v: any) => v.name);
    expect(volumeNames).toContain('redis-data');
    logger.info(`Found ${volumes.length} volumes`);
    
    // Add another volume
    logger.info('Adding shared data volume...');
    const response = await this.client.callTool('mittwald_container_declare_stack', {
      stackId: this.containerState.stackId,
      desiredServices: {
        nginx: {
          imageUri: 'nginx:latest',
          environment: {
            NGINX_HOST: 'example.com',
            NGINX_PORT: '80'
          },
          ports: [
            {
              containerPort: 80,
              protocol: 'tcp'
            }
          ]
        },
        redis: {
          imageUri: 'redis:7-alpine',
          environment: {
            REDIS_PASSWORD: 'testpass123'
          },
          ports: [
            {
              containerPort: 6379,
              protocol: 'tcp'
            }
          ],
          volumes: [
            {
              name: 'redis-data',
              mountPath: '/data',
              readOnly: false
            }
          ]
        }
      },
      desiredVolumes: {
        'redis-data': {
          size: '1Gi'
        },
        'shared-data': {
          size: '2Gi'
        }
      }
    });
    
    const content = parseToolContent(response.result);
    expect(content.status).toBe('success');
    
    // Verify new volume
    await waitForVolumes(this.client, projectId, ['redis-data', 'shared-data'], { timeout: 30000 });
    logger.info('Added shared data volume');
  }

  /**
   * Test Service Logs
   */
  private async testServiceLogs(projectId: string): Promise<void> {
    logger.info('=== Testing Service Logs ===');
    
    const servicesResponse = await this.client.callTool('mittwald_container_list_services', {
      projectId: projectId,
      output: 'json'
    });
    
    const servicesContent = parseToolContent(servicesResponse.result);
    expect(servicesContent.status).toBe('success');
    
    if (servicesContent.data && servicesContent.data.length > 0) {
      const service = servicesContent.data[0];
      
      const logsResponse = await this.client.callTool('mittwald_container_get_service_logs', {
        stackId: service.stackId,
        serviceId: service.id,
        limit: 10
      });
      
      const logsContent = parseToolContent(logsResponse.result);
      expect(logsContent.status).toBe('success');
      
      logger.info(`Retrieved logs for service ${service.id}`);
    } else {
      logger.warn('No services found to get logs from');
    }
  }

  /**
   * Test Complex Container Scenarios
   */
  private async testComplexContainerScenarios(projectId: string): Promise<void> {
    logger.info('=== Testing Complex Container Scenarios ===');
    
    // Deploy multi-container application
    logger.info('Deploying multi-container application...');
    const response = await this.client.callTool('mittwald_container_declare_stack', {
      stackId: this.containerState.stackId,
      desiredServices: {
        webapp: {
          imageUri: 'node:18-alpine',
          environment: {
            NODE_ENV: 'production',
            PORT: '3000',
            REDIS_HOST: 'redis',
            REDIS_PORT: '6379'
          },
          ports: [
            {
              containerPort: 3000,
              protocol: 'tcp'
            }
          ],
          volumes: [
            {
              name: 'app-data',
              mountPath: '/app/data',
              readOnly: false
            }
          ]
        },
        redis: {
          imageUri: 'redis:7-alpine',
          environment: {
            REDIS_PASSWORD: 'testpass123'
          },
          ports: [
            {
              containerPort: 6379,
              protocol: 'tcp'
            }
          ],
          volumes: [
            {
              name: 'redis-data',
              mountPath: '/data',
              readOnly: false
            }
          ]
        },
        postgres: {
          imageUri: 'postgres:15-alpine',
          environment: {
            POSTGRES_USER: 'appuser',
            POSTGRES_PASSWORD: 'apppass123',
            POSTGRES_DB: 'appdb'
          },
          ports: [
            {
              containerPort: 5432,
              protocol: 'tcp'
            }
          ],
          volumes: [
            {
              name: 'postgres-data',
              mountPath: '/var/lib/postgresql/data',
              readOnly: false
            }
          ]
        }
      },
      desiredVolumes: {
        'app-data': {
          size: '5Gi'
        },
        'redis-data': {
          size: '1Gi'
        },
        'postgres-data': {
          size: '10Gi'
        }
      }
    });
    
    const content = parseToolContent(response.result);
    expect(content.status).toBe('success');
    
    // Wait for deployment
    const stackDetails = await waitForStackReady(this.client, this.containerState.stackId, { timeout: 120000 });
    
    // Verify all services
    expect(stackDetails.services.length).toBe(3);
    const serviceNames = stackDetails.services.map((s: any) => s.name);
    expect(serviceNames).toContain('webapp');
    expect(serviceNames).toContain('redis');
    expect(serviceNames).toContain('postgres');
    
    logger.info('Deployed multi-container application with webapp, Redis, and PostgreSQL');
    
    // Update container configuration
    logger.info('Updating webapp container configuration...');
    const updateResponse = await this.client.callTool('mittwald_container_declare_stack', {
      stackId: this.containerState.stackId,
      desiredServices: {
        webapp: {
          imageUri: 'node:18-alpine',
          environment: {
            NODE_ENV: 'production',
            PORT: '3000',
            REDIS_HOST: 'redis',
            REDIS_PORT: '6379',
            DEBUG: 'app:*', // New environment variable
            LOG_LEVEL: 'info' // New environment variable
          },
          ports: [
            {
              containerPort: 3000,
              protocol: 'tcp'
            }
          ],
          volumes: [
            {
              name: 'app-data',
              mountPath: '/app/data',
              readOnly: false
            }
          ]
        },
        redis: {
          imageUri: 'redis:7-alpine',
          environment: {
            REDIS_PASSWORD: 'testpass123'
          },
          ports: [
            {
              containerPort: 6379,
              protocol: 'tcp'
            }
          ],
          volumes: [
            {
              name: 'redis-data',
              mountPath: '/data',
              readOnly: false
            }
          ]
        },
        postgres: {
          imageUri: 'postgres:15-alpine',
          environment: {
            POSTGRES_USER: 'appuser',
            POSTGRES_PASSWORD: 'apppass123',
            POSTGRES_DB: 'appdb'
          },
          ports: [
            {
              containerPort: 5432,
              protocol: 'tcp'
            }
          ],
          volumes: [
            {
              name: 'postgres-data',
              mountPath: '/var/lib/postgresql/data',
              readOnly: false
            }
          ]
        }
      },
      desiredVolumes: {
        'app-data': {
          size: '5Gi'
        },
        'redis-data': {
          size: '1Gi'
        },
        'postgres-data': {
          size: '10Gi'
        }
      }
    });
    
    const updateContent = parseToolContent(updateResponse.result);
    expect(updateContent.status).toBe('success');
    
    // Wait for update
    const updatedStackDetails = await waitForStackReady(this.client, this.containerState.stackId, { timeout: 60000 });
    
    // Verify webapp is still running
    const webappService = updatedStackDetails.services.find((s: any) => s.name === 'webapp');
    expect(webappService).toBeDefined();
    expect(webappService.status).toBe('running');
    
    logger.info('Updated webapp container configuration');
  }

  /**
   * Test Container with Project Volume
   */
  private async testContainerWithProjectVolume(projectId: string): Promise<void> {
    logger.info('=== Testing Container with Project Volume ===');
    
    const response = await this.client.callTool('mittwald_container_declare_stack', {
      stackId: this.containerState.stackId,
      desiredServices: {
        fileserver: {
          imageUri: 'nginx:alpine',
          environment: {
            NGINX_HOST: 'files.example.com'
          },
          ports: [
            {
              containerPort: 80,
              protocol: 'tcp'
            }
          ],
          volumes: [
            {
              name: `/home/p-${projectId.substring(0, 8)}/html`,
              mountPath: '/usr/share/nginx/html',
              readOnly: true
            }
          ]
        }
      }
    });
    
    const content = parseToolContent(response.result);
    expect(content.status).toBe('success');
    
    // Wait for deployment
    const stackDetails = await waitForStackReady(this.client, this.containerState.stackId, { timeout: 60000 });
    
    // Verify fileserver is running
    const fileserverService = stackDetails.services.find((s: any) => s.name === 'fileserver');
    expect(fileserverService).toBeDefined();
    expect(fileserverService.status).toBe('running');
    
    logger.info('Deployed container with project volume mount');
  }
}

// Traditional test structure for backward compatibility
describe('Container Operations (Phase-Aware)', () => {
  const test = new ContainerOperationsTest();
  
  beforeAll(async () => {
    const dockerRunning = await isDockerRunning();
    if (!dockerRunning) {
      throw new Error('Docker container is not running. Run: docker compose up -d');
    }
  }, TEST_CONFIG.setupTimeout);
  
  it('should run the configured test phase', async () => {
    await test.run();
  }, TEST_CONFIG.testTimeout);
});