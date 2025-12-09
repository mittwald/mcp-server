#!/usr/bin/env node
/**
 * Simple script to list all Mittwald projects and their MySQL databases
 */

import Anthropic from '@anthropic-ai/sdk';

const MCP_SERVER_URL = 'https://mittwald-mcp-fly2.fly.dev/mcp';

interface Project {
  id: string;
  shortId: string;
  description: string;
  createdAt: string;
}

interface Database {
  id: string;
  name: string;
  version: string;
  status?: string;
}

async function main() {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  console.log('Fetching projects from Mittwald MCP...\n');

  try {
    // Step 1: List all projects
    const projectsResponse = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      tools: [
        {
          type: 'custom' as const,
          name: 'mittwald_project_list_projects',
          mcp_server_name: 'mittwald',
          mcp_server_url: MCP_SERVER_URL,
        },
      ],
      messages: [
        {
          role: 'user',
          content: 'List all Mittwald projects using the mittwald_project_list_projects tool',
        },
      ],
    });

    console.log('Projects Response:', JSON.stringify(projectsResponse, null, 2));

    // Extract projects from the response
    const projects: Project[] = [];
    for (const block of projectsResponse.content) {
      if (block.type === 'tool_use') {
        // Tool was called, now we need to get the result
        console.log('\nTool called:', block.name);
        console.log('Input:', JSON.stringify(block.input, null, 2));
      } else if (block.type === 'text') {
        console.log('\nText response:', block.text);
      }
    }

    // Note: For a complete implementation, we'd need to handle tool results
    // and make follow-up calls for each project's databases
    console.log('\nNote: This is a simplified script. For full results, the MCP protocol');
    console.log('requires handling tool_result messages in a conversation loop.');

  } catch (error) {
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
  }
}

main().catch(console.error);
