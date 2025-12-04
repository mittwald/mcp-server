/**
 * Tool Manifest - ToolEntry Storage & Queries (T040, T041)
 *
 * In-memory storage for tool metadata with domain/tier queries.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { ToolEntry, ToolInventory, TestDomain, DiscoveredTool, IToolInventory, DiscoveryOptions } from '../types/index.js';
import { discover, parseToolName, DEFAULT_MCP_SERVER_URL } from './discovery.js';
import { mapToolToDomain, assignTier, requiresCleanRoom } from './grouping.js';

/**
 * Tool manifest implementation
 */
export class ToolManifest implements IToolInventory {
  private tools: Map<string, ToolEntry> = new Map();
  private discoveredTools: Map<string, DiscoveredTool> = new Map();
  private discoveredAt: Date | null = null;
  private serverUrl: string = '';

  /**
   * Discover tools from MCP server (T040)
   */
  async discover(options: DiscoveryOptions): Promise<DiscoveredTool[]> {
    const tools = await discover(options);

    this.serverUrl = options.serverUrl;
    this.discoveredAt = new Date();
    this.tools.clear();
    this.discoveredTools.clear();

    // Load discovered tools into manifest
    for (const tool of tools) {
      this.discoveredTools.set(tool.name, tool);

      const entry: ToolEntry = {
        name: tool.name,
        displayName: parseToolName(tool.name),
        domain: mapToolToDomain(tool.name),
        tier: assignTier(tool.name),
        cleanRoomRequired: requiresCleanRoom(tool.name),
        description: tool.description,
        inputSchema: tool.inputSchema,
        testStatus: 'untested',
      };

      this.tools.set(tool.name, entry);
    }

    return tools;
  }

  /**
   * Get tool by name (T041)
   */
  getTool(name: string): DiscoveredTool | undefined {
    return this.discoveredTools.get(name);
  }

  /**
   * Get tool entry with full metadata
   */
  getToolEntry(name: string): ToolEntry | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tools in a domain (T041)
   */
  getByDomain(domain: string): DiscoveredTool[] {
    const result: DiscoveredTool[] = [];
    for (const [name, entry] of this.tools) {
      if (entry.domain === domain) {
        const discovered = this.discoveredTools.get(name);
        if (discovered) {
          result.push(discovered);
        }
      }
    }
    return result;
  }

  /**
   * Get tool entries by domain
   */
  getEntriesByDomain(domain: TestDomain): ToolEntry[] {
    return Array.from(this.tools.values()).filter((t) => t.domain === domain);
  }

  /**
   * Get tools at a specific dependency tier (T041)
   */
  getByTier(tier: number): DiscoveredTool[] {
    const result: DiscoveredTool[] = [];
    for (const [name, entry] of this.tools) {
      if (entry.tier === tier) {
        const discovered = this.discoveredTools.get(name);
        if (discovered) {
          result.push(discovered);
        }
      }
    }
    return result;
  }

  /**
   * Get tool entries by tier
   */
  getEntriesByTier(tier: 0 | 1 | 2 | 3 | 4): ToolEntry[] {
    return Array.from(this.tools.values()).filter((t) => t.tier === tier);
  }

  /**
   * Get all tool entries
   */
  getAllEntries(): ToolEntry[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools requiring clean-room mode
   */
  getCleanRoomTools(): ToolEntry[] {
    return Array.from(this.tools.values()).filter((t) => t.cleanRoomRequired);
  }

  /**
   * Get inventory summary
   */
  getSummary(): {
    totalTools: number;
    byDomain: Record<string, number>;
    byTier: Record<number, number>;
    cleanRoomCount: number;
  } {
    const byDomain: Record<string, number> = {};
    const byTier: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    let cleanRoomCount = 0;

    for (const entry of this.tools.values()) {
      byDomain[entry.domain] = (byDomain[entry.domain] || 0) + 1;
      byTier[entry.tier] = (byTier[entry.tier] || 0) + 1;
      if (entry.cleanRoomRequired) {
        cleanRoomCount++;
      }
    }

    return {
      totalTools: this.tools.size,
      byDomain,
      byTier,
      cleanRoomCount,
    };
  }

  /**
   * Get full inventory state
   */
  getInventory(): ToolInventory {
    return {
      discoveredAt: this.discoveredAt || new Date(),
      serverUrl: this.serverUrl,
      totalTools: this.tools.size,
      tools: new Map(this.tools),
    };
  }

  /**
   * Update tool test status
   */
  updateTestStatus(name: string, status: 'untested' | 'passed' | 'failed'): void {
    const entry = this.tools.get(name);
    if (entry) {
      entry.testStatus = status;
    }
  }
}

/**
 * Generate test-domains.json configuration (T038)
 */
export async function generateTestDomainsConfig(
  serverUrl: string = DEFAULT_MCP_SERVER_URL,
  outputPath: string = 'config/test-domains.json'
): Promise<void> {
  const manifest = new ToolManifest();
  await manifest.discover({ serverUrl });

  const summary = manifest.getSummary();
  const domains: Record<string, string[]> = {};

  for (const entry of manifest.getAllEntries()) {
    if (!domains[entry.domain]) {
      domains[entry.domain] = [];
    }
    domains[entry.domain].push(entry.displayName);
  }

  // Sort tools within each domain
  for (const domain of Object.keys(domains)) {
    domains[domain].sort();
  }

  const config = {
    generated: new Date().toISOString(),
    serverUrl,
    totalTools: summary.totalTools,
    byTier: summary.byTier,
    cleanRoomTools: manifest.getCleanRoomTools().map((t) => t.displayName),
    domains,
  };

  // Ensure directory exists
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(outputPath, JSON.stringify(config, null, 2), 'utf-8');
  console.log(`[tool-manifest] Generated ${outputPath} with ${summary.totalTools} tools`);
}

/**
 * Load test-domains.json configuration
 */
export function loadTestDomainsConfig(configPath: string = 'config/test-domains.json'): {
  generated: string;
  serverUrl: string;
  totalTools: number;
  byTier: Record<number, number>;
  cleanRoomTools: string[];
  domains: Record<string, string[]>;
} | null {
  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    console.warn(`[tool-manifest] Failed to load ${configPath}`);
    return null;
  }
}

/**
 * Create a tool manifest instance
 */
export function createToolManifest(): ToolManifest {
  return new ToolManifest();
}
