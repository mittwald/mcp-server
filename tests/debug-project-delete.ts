/**
 * Debug script to test project deletion
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import * as path from 'path';

// Simple logger
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args)
};

// Simple parseToolContent
function parseToolContent(result: any) {
  if (!result || !result.content || !Array.isArray(result.content)) {
    return { status: 'error', message: 'Invalid tool response' };
  }
  
  const textContent = result.content.find((c: any) => c.type === 'text');
  if (!textContent || !textContent.text) {
    return { status: 'error', message: 'No text content in response' };
  }
  
  try {
    return JSON.parse(textContent.text);
  } catch (e) {
    return { status: 'error', message: 'Failed to parse response', data: textContent.text };
  }
}

async function createClient() {
  const serverPath = path.join(process.cwd(), 'build', 'index.js');
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
    env: { ...process.env }
  });
  
  const client = new Client({
    name: 'debug-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });
  
  await client.connect(transport);
  return client;
}

async function testProjectDeletion() {
  const client = await createClient();
  
  try {
    // 1. List projects to find test projects
    logger.info('Listing projects...');
    const listResponse = await client.request({
      method: 'tools/call',
      params: {
        name: 'mittwald_project_list',
        arguments: {
          output: 'json'
        }
      }
    });
    
    const listContent = parseToolContent(listResponse);
    if (listContent.status !== 'success') {
      logger.error('Failed to list projects:', listContent.message);
      return;
    }
    
    // Find test projects (created by our tests)
    const testProjects = listContent.data.filter((p: any) => 
      p.description?.includes('Test') || 
      p.description?.includes('test') ||
      p.description?.includes('App Installations Test')
    );
    
    logger.info(`Found ${testProjects.length} test projects`);
    
    for (const project of testProjects) {
      logger.info(`\nProject: ${project.shortId || project.id} - ${project.description}`);
      logger.info(`  Created: ${project.createdAt}`);
      logger.info(`  Status: ${project.isReady ? 'Ready' : 'Not Ready'}`);
      
      // Try to delete if it's a test project
      if (project.description?.includes('Test')) {
        logger.info(`  Attempting to delete project ${project.id}...`);
        
        const deleteResponse = await client.request({
          method: 'tools/call',
          params: {
            name: 'mittwald_project_delete',
            arguments: {
              projectId: project.id,
              force: true
            }
          }
        });
        
        const deleteContent = parseToolContent(deleteResponse);
        logger.info(`  Delete result: ${deleteContent.status} - ${deleteContent.message}`);
        
        if (deleteContent.status === 'error') {
          logger.error(`  Delete error details:`, deleteContent.data);
        }
      }
    }
    
    // Check if projects still exist after deletion
    logger.info('\nChecking projects after deletion...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    const listResponse2 = await client.request({
      method: 'tools/call',
      params: {
        name: 'mittwald_project_list',
        arguments: {
          output: 'json'
        }
      }
    });
    
    const listContent2 = parseToolContent(listResponse2);
    if (listContent2.status === 'success') {
      const remainingTestProjects = listContent2.data.filter((p: any) => 
        p.description?.includes('Test') || 
        p.description?.includes('test')
      );
      
      logger.info(`Remaining test projects: ${remainingTestProjects.length}`);
      remainingTestProjects.forEach((p: any) => {
        logger.info(`  - ${p.shortId || p.id}: ${p.description}`);
      });
    }
    
  } catch (error) {
    logger.error('Test failed:', error);
  } finally {
    await client.close();
  }
}

// Run the test
testProjectDeletion().catch(console.error);