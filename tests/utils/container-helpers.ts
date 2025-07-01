/**
 * Helper functions for container deployment tests
 */

import { MCPTestClient } from './mcp-test-client';
import { parseToolContent } from './test-helpers';
import { logger } from '../../src/utils/logger';

interface WaitForServicesOptions {
  timeout?: number;
  pollInterval?: number;
}

/**
 * Wait for services to be deployed after declaring a stack
 * Polls the service list until expected services appear
 */
export async function waitForServices(
  client: MCPTestClient,
  projectId: string,
  expectedServiceCount: number,
  options: WaitForServicesOptions = {}
): Promise<any[]> {
  const { timeout = 60000, pollInterval = 2000 } = options;
  const startTime = Date.now();
  
  logger.info(`Waiting for ${expectedServiceCount} services to be deployed...`);
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await client.callTool('mittwald_container_list_services', {
        projectId,
        output: 'json'
      });
      
      const content = parseToolContent(response.result);
      if (content.status === 'success' && content.data && content.data.length >= expectedServiceCount) {
        logger.info(`Found ${content.data.length} services after ${Date.now() - startTime}ms`);
        return content.data;
      }
      
      logger.debug(`Found ${content.data?.length || 0} services, waiting for ${expectedServiceCount}...`);
    } catch (error) {
      logger.debug(`Error listing services: ${error}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error(`Timeout waiting for ${expectedServiceCount} services to be deployed after ${timeout}ms`);
}

/**
 * Wait for volumes to be created after declaring a stack
 * Polls the volume list until expected volumes appear
 */
export async function waitForVolumes(
  client: MCPTestClient,
  projectId: string,
  expectedVolumeNames: string[],
  options: WaitForServicesOptions = {}
): Promise<any[]> {
  const { timeout = 60000, pollInterval = 2000 } = options;
  const startTime = Date.now();
  
  logger.info(`Waiting for volumes: ${expectedVolumeNames.join(', ')}`);
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await client.callTool('mittwald_container_list_volumes', {
        projectId,
        output: 'json'
      });
      
      const content = parseToolContent(response.result);
      if (content.status === 'success' && content.data) {
        const volumeNames = content.data.map((v: any) => v.name);
        const allVolumesFound = expectedVolumeNames.every(name => volumeNames.includes(name));
        
        if (allVolumesFound) {
          logger.info(`All expected volumes found after ${Date.now() - startTime}ms`);
          return content.data;
        }
        
        logger.debug(`Found volumes: ${volumeNames.join(', ')}, waiting for: ${expectedVolumeNames.join(', ')}`);
      }
    } catch (error) {
      logger.debug(`Error listing volumes: ${error}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error(`Timeout waiting for volumes ${expectedVolumeNames.join(', ')} after ${timeout}ms`);
}

/**
 * Wait for a specific service to reach a certain status
 * Uses the container_get_service tool to poll service status
 */
export async function waitForServiceStatus(
  client: MCPTestClient,
  stackId: string,
  serviceId: string,
  expectedStatus: string = 'running',
  options: WaitForServicesOptions = {}
): Promise<void> {
  const { timeout = 120000, pollInterval = 2000 } = options;
  const startTime = Date.now();
  
  logger.info(`Waiting for service ${serviceId} to reach status: ${expectedStatus}`);
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await client.callTool('mittwald_container_get_service', {
        stackId,
        serviceId
      });
      
      const content = parseToolContent(response.result);
      if (content.status === 'success' && content.data) {
        const currentStatus = content.data.status;
        logger.debug(`Service ${serviceId} status: ${currentStatus}`);
        
        if (currentStatus === expectedStatus) {
          logger.info(`Service ${serviceId} reached ${expectedStatus} status after ${Date.now() - startTime}ms`);
          return;
        }
        
        // Check for error states
        if (currentStatus === 'error') {
          throw new Error(`Service ${serviceId} is in error state: ${content.data.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      logger.debug(`Error checking service status: ${error}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error(`Timeout waiting for service ${serviceId} to reach ${expectedStatus} status after ${timeout}ms`);
}

/**
 * Wait for all services in a stack to be running
 * Uses the container_get_stack tool to check all services at once
 */
export async function waitForStackReady(
  client: MCPTestClient,
  stackId: string,
  options: WaitForServicesOptions = {}
): Promise<any> {
  const { timeout = 120000, pollInterval = 3000 } = options;
  const startTime = Date.now();
  
  logger.info(`Waiting for all services in stack ${stackId} to be ready...`);
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await client.callTool('mittwald_container_get_stack', {
        stackId
      });
      
      const content = parseToolContent(response.result);
      if (content.status === 'success' && content.data) {
        const services = content.data.services || [];
        const runningCount = services.filter((s: any) => s.status === 'running').length;
        const totalCount = services.length;
        
        logger.debug(`Stack ${stackId}: ${runningCount}/${totalCount} services running`);
        
        // Check if all services are running
        if (totalCount > 0 && runningCount === totalCount) {
          logger.info(`All ${totalCount} services in stack are running after ${Date.now() - startTime}ms`);
          return content.data;
        }
        
        // Check for any services in error state
        const errorServices = services.filter((s: any) => s.status === 'error');
        if (errorServices.length > 0) {
          const errorMessages = errorServices.map((s: any) => `${s.name}: ${s.message || 'Unknown error'}`).join(', ');
          throw new Error(`Services in error state: ${errorMessages}`);
        }
        
        // Log status of non-running services
        const nonRunning = services.filter((s: any) => s.status !== 'running');
        if (nonRunning.length > 0) {
          logger.debug(`Non-running services: ${nonRunning.map((s: any) => `${s.name}:${s.status}`).join(', ')}`);
        }
      }
    } catch (error) {
      logger.debug(`Error checking stack status: ${error}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error(`Timeout waiting for stack ${stackId} to be ready after ${timeout}ms`);
}

/**
 * Helper to wait after declaring a stack to give the system time to process
 * This is a simple delay that can be used when more sophisticated polling isn't available
 */
export async function waitForStackProcessing(delayMs: number = 5000): Promise<void> {
  logger.info(`Waiting ${delayMs}ms for stack processing...`);
  await new Promise(resolve => setTimeout(resolve, delayMs));
}