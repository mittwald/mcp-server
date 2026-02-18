/**
 * @file Markdown generation templates for tool documentation
 * @module docs/reference/scripts/markdown-template
 *
 * @remarks
 * Provides utilities for generating Starlight-compatible markdown documentation
 * from MCP tool definitions.
 */

import type { MCPTool } from './schema.js';

/**
 * Generates Starlight-compatible frontmatter for a tool
 *
 * @param tool - MCPTool definition
 * @param domain - Tool domain
 * @returns YAML frontmatter string
 */
export function generateFrontmatter(tool: MCPTool, domain: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `---
title: ${tool.title}
description: ${tool.description.replace(/"/g, '\\"')}
sidebar:
  label: ${tool.title}
  order: ${tool.name.charCodeAt(0)}
head:
  - tag: meta
    attrs:
      name: og:title
      content: ${tool.title}
  - tag: meta
    attrs:
      name: og:description
      content: ${tool.description.replace(/"/g, '\\"')}
lastUpdated: ${date}
---
`;
}

/**
 * Generates the main content section for a tool
 *
 * @param tool - MCPTool definition
 * @returns Markdown content string
 */
export function generateContent(tool: MCPTool): string {
  let content = '';

  // Description section
  content += `## Overview\n\n${tool.description}\n\n`;

  // Required scopes section
  if (tool.requiredScopes && tool.requiredScopes.length > 0) {
    content += `## Required Scopes\n\n`;
    content += 'This tool requires the following OAuth scopes:\n\n';
    content += tool.requiredScopes.map((scope) => `- \`${scope}\``).join('\n');
    content += '\n\n';
  }

  // Parameters section
  if (tool.parameters && tool.parameters.length > 0) {
    content += `## Parameters\n\n`;
    content += '| Parameter | Type | Required | Description |\n';
    content += '|-----------|------|----------|-------------|\n';

    for (const param of tool.parameters) {
      const required = param.required ? 'Yes' : 'No';
      const type = param.enum ? `\`${param.enum.join(' \\| ')}\`` : `\`${param.type}\``;
      const description = param.description.replace(/\|/g, '\\|');
      content += `| \`${param.name}\` | ${type} | ${required} | ${description} |\n`;
    }

    content += '\n';
  }

  // Return type section
  content += `## Return Type\n\n`;
  content += `**Type**: \`${tool.returnType.type}\`\n\n`;
  content += `**Description**: ${tool.returnType.description}\n\n`;

  if (tool.returnType.example) {
    content += '**Example Response**:\n\n';
    content += '```json\n';
    content += JSON.stringify(tool.returnType.example, null, 2);
    content += '\n```\n\n';
  }

  // Examples section
  if (tool.examples && tool.examples.length > 0) {
    content += `## Examples\n\n`;

    for (let i = 0; i < tool.examples.length; i++) {
      const example = tool.examples[i];
      content += `### Example ${i + 1}: ${example.description}\n\n`;
      content += '**Parameters**:\n\n';
      content += '```json\n';
      content += JSON.stringify(example.parameters, null, 2);
      content += '\n```\n\n';

      if (example.result) {
        content += '**Response**:\n\n';
        content += '```json\n';
        content += JSON.stringify(example.result, null, 2);
        content += '\n```\n\n';
      }
    }
  }

  // Notes section
  if (tool.deprecated) {
    content += `## ⚠️ Deprecation Notice\n\n`;
    content += `${tool.deprecationMessage || 'This tool is deprecated and will be removed in a future version.'}\n\n`;
  }

  return content;
}

/**
 * Generates complete markdown documentation for a tool
 *
 * @param tool - MCPTool definition
 * @param domain - Tool domain
 * @returns Complete markdown file content
 */
export function generateMarkdown(tool: MCPTool, domain: string): string {
  const frontmatter = generateFrontmatter(tool, domain);
  const content = generateContent(tool);
  return frontmatter + content;
}

/**
 * Generates a domain index file listing all tools in the domain
 *
 * @param domain - Domain name
 * @param tools - Array of MCPTool objects in this domain
 * @returns Markdown content for index file
 */
export function generateDomainIndex(domain: string, tools: MCPTool[]): string {
  const title = domain.charAt(0).toUpperCase() + domain.slice(1);
  const date = new Date().toISOString().split('T')[0];

  let content = `---
title: ${title} Tools
description: Complete reference for ${domain} management tools
sidebar:
  label: ${title}
  order: 0
lastUpdated: ${date}
---

## ${title} Tools

Reference documentation for all ${domain} management tools.

### Available Tools

| Tool | Description |
|------|-------------|
`;

  for (const tool of tools) {
    const description = tool.description.replace(/\|/g, '\\|');
    content += `| [\`${tool.name}\`](./${tool.name.split('_').slice(2).join('-')}) | ${description} |\n`;
  }

  content += '\n';
  return content;
}

/**
 * Generates a README for the tools directory
 *
 * @param totalTools - Total number of tools documented
 * @param domains - Map of domain names to tool counts
 * @returns Markdown content for README
 */
export function generateToolsReadme(
  totalTools: number,
  domains: Record<string, number>
): string {
  const date = new Date().toISOString().split('T')[0];

  let content = `---
title: Mittwald MCP Tools Reference
description: Complete API reference for Mittwald MCP tools
sidebar:
  label: Tools
  order: 1
lastUpdated: ${date}
---

# Mittwald MCP Tools Reference

Complete reference documentation for all ${totalTools} Mittwald MCP tools, organized by domain.

## Quick Navigation

`;

  // Generate domain links
  const domainEntries = Object.entries(domains).sort();
  for (const [domain, count] of domainEntries) {
    const title = domain.charAt(0).toUpperCase() + domain.slice(1);
    content += `- [**${title}**](./${domain}/) - ${count} tools\n`;
  }

  content += `

## About This Reference

This reference documents all ${totalTools} MCP tools available in the Mittwald platform. Each tool includes:

- **Description**: What the tool does
- **Parameters**: Required and optional parameters
- **Return Type**: What the tool returns
- **Examples**: Usage examples
- **Required Scopes**: OAuth scopes needed for authentication

## Tool Domains

`;

  const domainDescriptions: Record<string, string> = {
    app: 'Manage applications and app lifecycle',
    backup: 'Create and manage project backups',
    certificate: 'Manage SSL/TLS certificates',
    container: 'Manage containerized applications',
    context: 'Configure CLI context and defaults',
    cronjob: 'Schedule and manage cron jobs',
    database: 'Manage databases and connections',
    domain: 'Configure domains and DNS records',
    extension: 'Manage app extensions and plugins',
    org: 'Manage organizations and access',
    project: 'Manage projects and resources',
    registry: 'Manage container registries',
    sftp: 'Manage SFTP users and access',
    ssh: 'Manage SSH keys and access',
    stack: 'Manage runtime stacks and versions',
    user: 'Manage user accounts',
    volume: 'Manage storage volumes',
  };

  for (const [domain, count] of domainEntries) {
    const title = domain.charAt(0).toUpperCase() + domain.slice(1);
    const description = domainDescriptions[domain] || '';
    content += `### ${title} (${count} tools)\n\n${description}\n\n`;
  }

  return content;
}
