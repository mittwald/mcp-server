#!/usr/bin/env node
/**
 * Test script to get full tool list from MCP server
 */

import pkg from '@robertdouglass/mcp-tester';
const { MCPHTTPClient } = pkg;

const client = new MCPHTTPClient({
  baseURL: 'http://localhost:3000/mcp',
  timeout: 30000,
});

async function testFullToolList() {
  console.log('🔌 Getting full tool list from MCP server...\n');

  try {
    // Initialize connection
    console.log('1️⃣ Initializing connection...');
    await client.initialize();
    console.log(`✅ Initialized successfully`);
    console.log(`   Session ID: ${client.sessionId}`);

    // Send initialized notification  
    console.log('\n2️⃣ Sending initialized notification...');
    await client.sendNotification('notifications/initialized');
    console.log('✅ Notification sent');

    // List all tools
    console.log('\n3️⃣ Listing ALL tools...');
    const tools = await client.listTools();
    console.log(`✅ Found ${tools.tools.length} tools\n`);

    // Group tools by category
    const categories = {};
    tools.tools.forEach(tool => {
      const name = tool.name;
      let category = 'Other';
      
      if (name.includes('_app_')) category = 'App';
      else if (name.includes('_backup_')) category = 'Backup';
      else if (name.includes('_conversation_')) category = 'Conversation';
      else if (name.includes('_cronjob_')) category = 'Cronjob';
      else if (name.includes('_database_')) category = 'Database';
      else if (name.includes('_domain_')) category = 'Domain';
      else if (name.includes('_extension_')) category = 'Extension';
      else if (name.includes('_mail_')) category = 'Mail';
      else if (name.includes('_org_')) category = 'Organization';
      else if (name.includes('_project_')) category = 'Project';
      else if (name.includes('_server_')) category = 'Server';
      else if (name.includes('_sftp_')) category = 'SFTP';
      else if (name.includes('_ssh_')) category = 'SSH';
      else if (name.includes('_user_')) category = 'User';
      else if (name.includes('_context_')) category = 'Context';
      else if (name.includes('_ddev_')) category = 'DDEV';
      
      if (!categories[category]) categories[category] = [];
      categories[category].push(tool.name);
    });

    // Display by category
    Object.keys(categories).sort().forEach(category => {
      console.log(`📁 ${category} (${categories[category].length} tools):`);
      categories[category].sort().forEach(toolName => {
        console.log(`   • ${toolName}`);
      });
      console.log('');
    });

    console.log(`\n✅ Total tools: ${tools.tools.length}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testFullToolList().catch(console.error);