#!/usr/bin/env node
/**
 * Demo script for functional tests
 * Shows how the test infrastructure works without running full test suite
 */

import { MCPTestClient } from '../utils/mcp-test-client';
import { TestProjectManager } from '../utils/test-project-manager';
import { createProgressReporter } from '../utils/async-operations';

async function runDemo() {
  console.log('=== Mittwald MCP Functional Test Demo ===\n');
  
  const client = new MCPTestClient();
  
  try {
    // Initialize connection
    console.log('1. Connecting to MCP server...');
    await client.initialize();
    console.log('   ✅ Connected\n');
    
    // Create project manager
    const projectManager = new TestProjectManager(client);
    
    // Create a test project
    console.log('2. Creating test project...');
    const project = await projectManager.createTestProject('Demo Test Project');
    console.log(`   ✅ Created project: ${project.shortId}\n`);
    
    // Install WordPress as a demo
    console.log('3. Installing WordPress...');
    const installation = await projectManager.installApp(project.projectId, 'wordpress', {
      siteTitle: 'Demo WordPress Site',
      adminUser: 'demo_admin',
      adminEmail: 'demo@test.local'
    });
    console.log(`   ✅ Installation started: ${installation.installationId}\n`);
    
    console.log('4. Waiting for installation to complete...');
    console.log('   (This typically takes 2-5 minutes)\n');
    
    await projectManager.waitForAppInstallation(installation, 300000); // 5 min timeout
    console.log('   ✅ WordPress installed successfully!\n');
    
    // List apps in project
    console.log('5. Listing installed apps...');
    const listResponse = await client.callTool('mittwald_app_list', {
      project_id: project.projectId,
      output: 'json'
    });
    
    const content = JSON.parse(listResponse.result.content[0].text);
    if (content.status === 'success') {
      console.log(`   Found ${content.data.apps.length} app(s):`);
      content.data.apps.forEach((app: any) => {
        console.log(`   - ${app.description} (${app.appVersion?.current || 'unknown version'})`);
      });
    }
    console.log();
    
    // Cleanup
    console.log('6. Cleaning up resources...');
    await projectManager.cleanup();
    console.log('   ✅ Cleanup completed\n');
    
    console.log('=== Demo completed successfully! ===');
    
  } catch (error) {
    console.error('\n❌ Demo failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  runDemo().catch(console.error);
}