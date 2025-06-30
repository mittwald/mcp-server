/**
 * Comprehensive tests for Mittwald container operations
 * Tests stack management, service deployment, volume management, and registry operations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from '../utils/mcp-test-client';
import { parseToolContent } from '../utils/test-helpers';
import { logger } from '../../src/utils/logger';
import { TestProjectManager } from '../utils/test-project-manager';

// Test configuration
const TEST_CONFIG = {
  testTimeout: 600000, // 10 minutes for container operations
  setupTimeout: 300000, // 5 minutes for setup
  cleanupTimeout: 300000, // 5 minutes for cleanup
};

describe('Container Operations', () => {
  let client: MCPTestClient;
  let projectManager: TestProjectManager;
  let testProjectId: string;
  let testStackId: string;
  
  // Track created resources for cleanup
  const createdRegistries: string[] = [];
  const createdServices: Map<string, string> = new Map(); // service name -> service ID
  const createdVolumes: Map<string, string> = new Map(); // volume name -> volume ID

  beforeAll(async () => {
    logger.info('Setting up container tests...');
    
    // Create MCP client
    client = await MCPTestClient.create();
    projectManager = new TestProjectManager(client);
    
    // Create test project
    logger.info('Creating test project for container operations...');
    const project = await projectManager.createTestProject('Container Operations Test');
    testProjectId = project.projectId;
    logger.info(`Test project created: ${project.shortId} (${testProjectId})`);
    
    // Get the default stack for the project
    const stacksResponse = await client.callTool('mittwald_container_list_stacks', {
      projectId: testProjectId,
      output: 'json'
    });
    
    const stacksContent = parseToolContent(stacksResponse.result);
    expect(stacksContent.status).toBe('success');
    
    if (stacksContent.data && stacksContent.data.length > 0) {
      testStackId = stacksContent.data[0].id;
      logger.info(`Found default stack: ${testStackId}`);
    } else {
      // If no stack exists, we'll create one with our first declare operation
      testStackId = `stack-${testProjectId}`;
      logger.info(`Will use stack ID: ${testStackId}`);
    }
  }, TEST_CONFIG.setupTimeout);

  afterAll(async () => {
    if (!client) return;
    
    logger.info('Cleaning up container test resources...');
    
    try {
      // Clean up services and volumes by declaring empty stack
      if (testStackId) {
        logger.info('Removing all services and volumes from stack...');
        await client.callTool('mittwald_container_declare_stack', {
          stackId: testStackId,
          desiredServices: {},
          desiredVolumes: {}
        });
      }
      
      // Delete registries
      for (const registryId of createdRegistries) {
        try {
          logger.info(`Deleting registry ${registryId}...`);
          // Note: There's no delete registry tool yet, would need to implement
        } catch (error) {
          logger.warn(`Failed to delete registry ${registryId}:`, error);
        }
      }
      
      // Clean up project
      await projectManager.cleanup();
      
    } catch (error) {
      logger.error('Failed to clean up container resources:', error);
    }
    
    await client.close();
  }, TEST_CONFIG.cleanupTimeout);

  describe('Stack Operations', () => {
    it('should list stacks for project', async () => {
      const response = await client.callTool('mittwald_container_list_stacks', {
        projectId: testProjectId,
        output: 'json'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      expect(content.data).toBeInstanceOf(Array);
      
      logger.info(`Found ${content.data.length} stacks in project`);
    });
  });

  describe('Registry Operations', () => {
    it('should create a Docker Hub registry', async () => {
      const response = await client.callTool('mittwald_container_create_registry', {
        projectId: testProjectId,
        uri: 'docker.io',
        imageRegistryType: 'docker',
        username: 'testuser',
        password: 'testpass123'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      expect(content.data).toHaveProperty('id');
      
      createdRegistries.push(content.data.id);
      logger.info(`Created Docker Hub registry: ${content.data.id}`);
    });

    it('should create a GitHub Container Registry', async () => {
      const response = await client.callTool('mittwald_container_create_registry', {
        projectId: testProjectId,
        uri: 'ghcr.io',
        imageRegistryType: 'github',
        username: 'githubuser',
        password: 'ghp_testtoken123'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      expect(content.data).toHaveProperty('id');
      
      createdRegistries.push(content.data.id);
      logger.info(`Created GitHub Container Registry: ${content.data.id}`);
    });

    it('should list registries', async () => {
      const response = await client.callTool('mittwald_container_list_registries', {
        projectId: testProjectId,
        output: 'json'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      expect(content.data).toBeInstanceOf(Array);
      expect(content.data.length).toBeGreaterThanOrEqual(2);
      
      logger.info(`Found ${content.data.length} registries`);
    });
  });

  describe('Service Deployment', () => {
    it('should deploy nginx container', async () => {
      const response = await client.callTool('mittwald_container_declare_stack', {
        stackId: testStackId,
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
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      
      createdServices.set('nginx', 'nginx-service-id');
      logger.info('Deployed nginx container');
    });

    it('should deploy Redis container with volume', async () => {
      const response = await client.callTool('mittwald_container_declare_stack', {
        stackId: testStackId,
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
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      
      createdServices.set('redis', 'redis-service-id');
      createdVolumes.set('redis-data', 'redis-volume-id');
      logger.info('Deployed Redis with persistent volume');
    });

    it('should list services', async () => {
      const response = await client.callTool('mittwald_container_list_services', {
        projectId: testProjectId,
        output: 'json'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      expect(content.data).toBeInstanceOf(Array);
      
      logger.info(`Found ${content.data.length} services`);
      
      // Check that our services are listed
      const serviceIds = content.data.map((s: any) => s.id);
      expect(serviceIds.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Volume Management', () => {
    it('should list volumes', async () => {
      const response = await client.callTool('mittwald_container_list_volumes', {
        projectId: testProjectId,
        output: 'json'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      expect(content.data).toBeInstanceOf(Array);
      
      logger.info(`Found ${content.data.length} volumes`);
      
      // Should have at least the redis-data volume
      const volumeNames = content.data.map((v: any) => v.name);
      expect(volumeNames).toContain('redis-data');
    });

    it('should add another volume', async () => {
      const response = await client.callTool('mittwald_container_declare_stack', {
        stackId: testStackId,
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
      
      createdVolumes.set('shared-data', 'shared-volume-id');
      logger.info('Added shared data volume');
    });
  });

  describe('Service Logs', () => {
    it('should get service logs', async () => {
      // First get the actual service IDs
      const servicesResponse = await client.callTool('mittwald_container_list_services', {
        projectId: testProjectId,
        output: 'json'
      });
      
      const servicesContent = parseToolContent(servicesResponse.result);
      expect(servicesContent.status).toBe('success');
      
      if (servicesContent.data && servicesContent.data.length > 0) {
        const service = servicesContent.data[0];
        
        const logsResponse = await client.callTool('mittwald_container_get_service_logs', {
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
    });
  });

  describe('Complex Container Scenarios', () => {
    it('should deploy multi-container application with shared volume', async () => {
      const response = await client.callTool('mittwald_container_declare_stack', {
        stackId: testStackId,
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
      
      logger.info('Deployed multi-container application with webapp, Redis, and PostgreSQL');
    });

    it('should update container configuration', async () => {
      // Update the webapp container with new environment variables
      const response = await client.callTool('mittwald_container_declare_stack', {
        stackId: testStackId,
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
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      
      logger.info('Updated webapp container configuration');
    });
  });

  describe('Container with Project Volume', () => {
    it('should deploy container with project volume mount', async () => {
      const response = await client.callTool('mittwald_container_declare_stack', {
        stackId: testStackId,
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
                name: `/home/p-${testProjectId.substring(0, 8)}/html`,
                mountPath: '/usr/share/nginx/html',
                readOnly: true
              }
            ]
          }
        }
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      
      logger.info('Deployed container with project volume mount');
    });
  });
});