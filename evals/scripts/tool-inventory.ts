import fs from 'fs';
import path from 'path';

/**
 * Tool inventory loader.
 * Reads canonical list of MCP tools from Feature 014 inventory.
 */

export interface ToolInfo {
  tool_name: string; // e.g., "mittwald_app_list"
  tool_domain: string; // e.g., "app"
  display_name: string; // e.g., "app/list"
  tier?: number; // 0-4 (from Feature 014)
}

/**
 * Load all tools from Feature 014 inventory.
 * @returns Array of ToolInfo objects (115 tools)
 */
export function loadToolInventory(): ToolInfo[] {
  const inventoryPath = path.join(
    process.cwd(),
    'evals',
    'inventory',
    'tools-current.json'
  );

  if (!fs.existsSync(inventoryPath)) {
    throw new Error(
      `Tool inventory not found: ${inventoryPath}. Run Feature 014 setup first.`
    );
  }

  const json = JSON.parse(fs.readFileSync(inventoryPath, 'utf-8'));

  // Feature 014 inventory structure: { tools: [...] }
  if (!json.tools || !Array.isArray(json.tools)) {
    throw new Error('Invalid inventory format: expected { tools: [...] }');
  }

  return json.tools.map((tool: any) => ({
    tool_name: normalizeToolName(tool.mcpName || tool.name || tool.tool_name),
    tool_domain: tool.domain || extractDomain(tool.mcpName || tool.name || tool.tool_name),
    display_name: tool.displayName || tool.display_name || tool.name,
    tier: tool.tier,
  }));
}

/**
 * Extract domain from tool name.
 * e.g., "mittwald_app_list" → "app"
 */
function extractDomain(toolName: string): string {
  // Remove "mcp__mittwald__" prefix if present
  const normalized = toolName.replace(/^mcp__mittwald__/, '');

  // Extract middle part: mittwald_{domain}_{action}
  const parts = normalized.split('_');
  if (parts.length >= 2 && parts[0] === 'mittwald') {
    return parts[1];
  }

  // Fallback: return first part
  return parts[0];
}

/**
 * Get tool info by name.
 * @param toolName - Tool name (with or without mcp__mittwald__ prefix)
 * @returns ToolInfo or undefined if not found
 */
export function getToolInfo(toolName: string): ToolInfo | undefined {
  const tools = loadToolInventory();
  const normalized = normalizeToolName(toolName);

  return tools.find((t) => normalizeToolName(t.tool_name) === normalized);
}

/**
 * Normalize tool name (remove mcp__mittwald__ prefix).
 */
export function normalizeToolName(toolName: string): string {
  return toolName.replace(/^mcp__mittwald__/, '');
}

/**
 * Get all tools by domain.
 * @param domain - Domain name (e.g., "app", "project")
 * @returns Array of ToolInfo for that domain
 */
export function getToolsByDomain(domain: string): ToolInfo[] {
  const tools = loadToolInventory();
  return tools.filter((t) => t.tool_domain === domain);
}

/**
 * Get list of all domains.
 * @returns Unique domain names
 */
export function getAllDomains(): string[] {
  const tools = loadToolInventory();
  const domains = new Set(tools.map((t) => t.tool_domain));
  return Array.from(domains).sort();
}

/**
 * CLI tool to list inventory.
 * Usage: tsx evals/scripts/tool-inventory.ts [--domain <domain>]
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const domainArg = process.argv.indexOf('--domain');
  const domain = domainArg !== -1 ? process.argv[domainArg + 1] : null;

  if (domain) {
    const tools = getToolsByDomain(domain);
    console.log(`Tools in domain '${domain}': ${tools.length}`);
    tools.forEach((t) => console.log(`  - ${t.tool_name} (tier ${t.tier})`));
  } else {
    const tools = loadToolInventory();
    const domains = getAllDomains();

    console.log(`Total tools: ${tools.length}`);
    console.log(`Domains: ${domains.join(', ')}`);
    console.log('\nTools by domain:');

    domains.forEach((d) => {
      const domainTools = getToolsByDomain(d);
      console.log(`  ${d}: ${domainTools.length} tools`);
    });
  }
}
