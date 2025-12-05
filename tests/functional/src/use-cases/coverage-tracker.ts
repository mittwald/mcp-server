/**
 * Coverage Tracker - Tool coverage analysis and reporting
 *
 * Parses session logs to extract tool invocations, compares against
 * full tool inventory, and generates coverage reports with recommendations.
 *
 * WP10: Coverage Tracking and Reporting
 */

import { createReadStream } from 'node:fs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  UseCaseDomain,
  CoverageReport,
  CoverageRecommendation,
  ToolStat,
} from './types.js';
import { DOMAIN_PATTERNS, mapToolToDomain } from '../inventory/grouping.js';
import { parseToolName, discover, DEFAULT_MCP_SERVER_URL } from '../inventory/discovery.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT_ROOT = path.join(__dirname, '../../analysis-output');

/**
 * Scenario suggestion patterns for generating recommendations
 */
const SCENARIO_SUGGESTIONS: Record<string, string> = {
  // Apps
  'app/create': 'Deploy a new application',
  'app/delete': 'Clean up and delete an application',
  'app/upgrade': 'Upgrade an application to a newer version',
  'app/restart': 'Restart a running application',
  // Databases
  'database/mysql/create': 'Set up a MySQL database for an app',
  'database/mysql/delete': 'Clean up a MySQL database',
  'database/redis/create': 'Add Redis caching to a project',
  // Domains
  'domain/create': 'Configure a custom domain',
  'domain/delete': 'Remove a domain configuration',
  'dns/record/create': 'Set up DNS records',
  // Backups
  'backup/create': 'Create a manual backup',
  'backup/schedule/create': 'Set up automated backups',
  'backup/schedule/delete': 'Remove a backup schedule',
  // SSH/SFTP
  'ssh/key/create': 'Add SSH key for deployment',
  'sftp/user/create': 'Create SFTP user for file uploads',
  // Mail
  'mail/address/create': 'Set up email for a domain',
  'mailbox/create': 'Create a new mailbox',
  // Cronjobs
  'cronjob/create': 'Schedule automated tasks',
  'cronjob/delete': 'Remove a scheduled job',
  // Containers
  'container/create': 'Deploy a containerized application',
  'stack/create': 'Deploy a multi-container stack',
  // Projects
  'project/create': 'Initialize a new project',
  'project/delete': 'Clean up and delete a project',
};

/**
 * Priority mapping for domains (higher = more important for coverage)
 */
const DOMAIN_PRIORITY: Record<UseCaseDomain, 'high' | 'medium' | 'low'> = {
  'project-foundation': 'high',
  apps: 'high',
  databases: 'high',
  identity: 'medium',
  organization: 'medium',
  containers: 'medium',
  'domains-mail': 'medium',
  'access-users': 'low',
  automation: 'low',
  backups: 'medium',
};

/**
 * Coverage tracker options
 */
export interface CoverageTrackerOptions {
  /** Output root directory for reports */
  outputRoot?: string;
  /** MCP server URL for dynamic inventory */
  mcpServerUrl?: string;
}

/**
 * Coverage Tracker - tracks tool usage across executions
 */
export class CoverageTracker {
  /** Map of tool name → set of use case IDs that invoked it */
  private toolInvocations: Map<string, Set<string>> = new Map();

  /** Full tool inventory (loaded dynamically or from cache) */
  private inventory: Map<string, UseCaseDomain> = new Map();

  /** Execution IDs included in tracking */
  private executionIds: Set<string> = new Set();

  /** Options */
  private readonly options: Required<CoverageTrackerOptions>;

  constructor(options: CoverageTrackerOptions = {}) {
    this.options = {
      outputRoot: options.outputRoot ?? DEFAULT_OUTPUT_ROOT,
      mcpServerUrl: options.mcpServerUrl ?? DEFAULT_MCP_SERVER_URL,
    };
  }

  /**
   * Parse a session log file and extract tool invocations (T064)
   */
  async parseSessionLog(logPath: string, useCaseId: string): Promise<string[]> {
    const tools: string[] = [];

    const rl = createInterface({
      input: createReadStream(logPath),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      try {
        const event = JSON.parse(line);

        // Handle tool_use events from stream
        if (event.type === 'tool_use' && event.name) {
          const toolName = this.normalizeToolName(event.name);
          tools.push(toolName);
          this.recordInvocation(toolName, useCaseId);
        }

        // Handle assistant messages with tool_use blocks
        if (event.type === 'assistant' && event.message?.content) {
          for (const block of event.message.content) {
            if (block.type === 'tool_use' && block.name) {
              const toolName = this.normalizeToolName(block.name);
              tools.push(toolName);
              this.recordInvocation(toolName, useCaseId);
            }
          }
        }
      } catch {
        // Skip malformed lines
      }
    }

    this.executionIds.add(useCaseId);
    return tools;
  }

  /**
   * Normalize tool name by removing MCP prefix (T065)
   */
  private normalizeToolName(name: string): string {
    // Remove mcp__mittwald__mittwald_ prefix
    let normalized = name.replace(/^mcp__mittwald__mittwald_/, '');
    // Also handle mcp__mittwald__ without second mittwald
    normalized = normalized.replace(/^mcp__mittwald__/, '');

    // Convert underscores to slashes for category/action format
    // database_mysql_create → database/mysql/create
    const parts = normalized.split('_');
    return parts.join('/');
  }

  /**
   * Record a tool invocation for a use case
   */
  private recordInvocation(toolName: string, useCaseId: string): void {
    if (!this.toolInvocations.has(toolName)) {
      this.toolInvocations.set(toolName, new Set());
    }
    this.toolInvocations.get(toolName)!.add(useCaseId);
  }

  /**
   * Load tool inventory from MCP server or local cache (T066)
   */
  async loadInventory(): Promise<void> {
    // Try to discover tools from MCP server
    try {
      const tools = await discover({
        serverUrl: this.options.mcpServerUrl,
        timeoutMs: 10000,
      });

      for (const tool of tools) {
        const displayName = parseToolName(tool.name);
        const domain = mapToolToDomain(tool.name);
        this.inventory.set(displayName, domain);
      }

      console.log(`[CoverageTracker] Loaded ${this.inventory.size} tools from MCP server`);
    } catch (error) {
      console.warn('[CoverageTracker] Failed to load from MCP server, using domain patterns');
      // Fall back to domain patterns for basic inventory structure
      this.loadFromDomainPatterns();
    }
  }

  /**
   * Load inventory from domain patterns (fallback)
   */
  private loadFromDomainPatterns(): void {
    // Use domain patterns to create a basic inventory structure
    // This won't have all tools but provides coverage tracking capability
    for (const [domain, patterns] of Object.entries(DOMAIN_PATTERNS)) {
      for (const pattern of patterns) {
        // Extract base tool category from pattern
        const baseTool = pattern.replace('/', '');
        this.inventory.set(`${baseTool}/list`, domain as UseCaseDomain);
        this.inventory.set(`${baseTool}/get`, domain as UseCaseDomain);
        this.inventory.set(`${baseTool}/create`, domain as UseCaseDomain);
        this.inventory.set(`${baseTool}/delete`, domain as UseCaseDomain);
      }
    }
    console.log(`[CoverageTracker] Created ${this.inventory.size} tools from domain patterns`);
  }

  /**
   * Set inventory directly (for testing or custom inventory)
   */
  setInventory(inventory: Map<string, UseCaseDomain>): void {
    this.inventory = new Map(inventory);
  }

  /**
   * Calculate coverage (T067)
   */
  calculateCoverage(): { covered: string[]; uncovered: string[] } {
    const invoked = new Set(this.toolInvocations.keys());

    const covered: string[] = [];
    const uncovered: string[] = [];

    for (const tool of this.inventory.keys()) {
      if (invoked.has(tool)) {
        covered.push(tool);
      } else {
        uncovered.push(tool);
      }
    }

    // Also track tools that were invoked but not in inventory
    for (const tool of invoked) {
      if (!this.inventory.has(tool) && !covered.includes(tool)) {
        covered.push(tool);
      }
    }

    return { covered, uncovered };
  }

  /**
   * Generate coverage report (T068)
   */
  generateReport(): CoverageReport {
    const { covered, uncovered } = this.calculateCoverage();

    const toolStats: ToolStat[] = [];
    for (const [tool, useCases] of this.toolInvocations) {
      toolStats.push({
        tool,
        domain: this.inventory.get(tool) || ('unknown' as UseCaseDomain),
        invocationCount: useCases.size,
        useCases: Array.from(useCases),
      });
    }

    // Sort by invocation count descending
    toolStats.sort((a, b) => b.invocationCount - a.invocationCount);

    const totalTools = this.inventory.size || covered.length + uncovered.length;
    const coveredCount = covered.length;
    const coveragePercent = totalTools > 0 ? Math.round((coveredCount / totalTools) * 1000) / 10 : 0;

    return {
      generatedAt: new Date(),
      executionIds: Array.from(this.executionIds),
      totalTools,
      coveredTools: coveredCount,
      coveragePercent,
      toolStats,
      uncoveredTools: uncovered,
      recommendations: this.generateRecommendations(uncovered),
    };
  }

  /**
   * Generate recommendations for uncovered tools (T069)
   */
  private generateRecommendations(uncovered: string[]): CoverageRecommendation[] {
    const recommendations: CoverageRecommendation[] = [];

    // Group by domain first
    const byDomain = new Map<UseCaseDomain, string[]>();
    for (const tool of uncovered) {
      const domain = this.inventory.get(tool) || ('unknown' as UseCaseDomain);
      if (!byDomain.has(domain)) {
        byDomain.set(domain, []);
      }
      byDomain.get(domain)!.push(tool);
    }

    // Generate recommendations for each tool
    for (const tool of uncovered) {
      const domain = this.inventory.get(tool) || ('unknown' as UseCaseDomain);
      const priority = DOMAIN_PRIORITY[domain] || 'low';

      // Look for a suggested scenario
      let suggestedScenario = SCENARIO_SUGGESTIONS[tool];
      if (!suggestedScenario) {
        // Generate a generic suggestion based on tool name
        const parts = tool.split('/');
        const action = parts[parts.length - 1];
        const resource = parts.slice(0, -1).join(' ');
        suggestedScenario = `${this.capitalizeFirst(action)} ${resource} resource`;
      }

      recommendations.push({
        tool,
        suggestedScenario,
        priority,
      });
    }

    // Sort by priority (high first), then by tool name
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => {
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return a.tool.localeCompare(b.tool);
    });

    return recommendations;
  }

  /**
   * Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Output report as JSON and markdown (T070)
   */
  async writeReports(report: CoverageReport, baseName?: string): Promise<{ jsonPath: string; mdPath: string }> {
    await mkdir(this.options.outputRoot, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const name = baseName || `coverage-${timestamp}`;

    const jsonPath = path.join(this.options.outputRoot, `${name}.json`);
    const mdPath = path.join(this.options.outputRoot, `${name}.md`);

    // Write JSON
    const jsonReport = {
      ...report,
      generatedAt: report.generatedAt.toISOString(),
    };
    await writeFile(jsonPath, JSON.stringify(jsonReport, null, 2));

    // Write Markdown
    const markdown = this.generateMarkdown(report);
    await writeFile(mdPath, markdown);

    console.log(`[CoverageTracker] Reports written to ${this.options.outputRoot}`);
    return { jsonPath, mdPath };
  }

  /**
   * Generate markdown report
   */
  private generateMarkdown(report: CoverageReport): string {
    const lines: string[] = [];

    lines.push('# Tool Coverage Report');
    lines.push('');
    lines.push(`**Generated**: ${report.generatedAt.toISOString()}`);
    lines.push(`**Executions**: ${report.executionIds.length}`);
    lines.push('');

    // Summary table
    lines.push('## Summary');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(`| Total Tools | ${report.totalTools} |`);
    lines.push(`| Covered | ${report.coveredTools} |`);
    lines.push(`| Coverage | ${report.coveragePercent}% |`);
    lines.push('');

    // Coverage bar (text-based)
    const barWidth = 50;
    const filledCount = Math.round((report.coveragePercent / 100) * barWidth);
    const emptyCount = barWidth - filledCount;
    const bar = '█'.repeat(filledCount) + '░'.repeat(emptyCount);
    lines.push('```');
    lines.push(`[${bar}] ${report.coveragePercent}%`);
    lines.push('```');
    lines.push('');

    // Top invoked tools
    if (report.toolStats.length > 0) {
      lines.push('## Most Invoked Tools');
      lines.push('');
      lines.push('| Tool | Domain | Invocations | Use Cases |');
      lines.push('|------|--------|-------------|-----------|');
      const topTools = report.toolStats.slice(0, 20);
      for (const stat of topTools) {
        lines.push(`| ${stat.tool} | ${stat.domain} | ${stat.invocationCount} | ${stat.useCases.join(', ')} |`);
      }
      lines.push('');
    }

    // Uncovered tools by domain
    if (report.uncoveredTools.length > 0) {
      lines.push('## Uncovered Tools by Domain');
      lines.push('');

      // Group by domain
      const byDomain = new Map<string, string[]>();
      for (const tool of report.uncoveredTools) {
        const domain = this.inventory.get(tool) || 'unknown';
        if (!byDomain.has(domain)) {
          byDomain.set(domain, []);
        }
        byDomain.get(domain)!.push(tool);
      }

      for (const [domain, tools] of byDomain) {
        lines.push(`### ${domain} (${tools.length} uncovered)`);
        lines.push('');
        for (const tool of tools.slice(0, 10)) {
          lines.push(`- ${tool}`);
        }
        if (tools.length > 10) {
          lines.push(`- ... and ${tools.length - 10} more`);
        }
        lines.push('');
      }
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');
      const topRecs = report.recommendations.slice(0, 15);
      for (let i = 0; i < topRecs.length; i++) {
        const rec = topRecs[i];
        lines.push(`${i + 1}. **${rec.tool}** (${rec.priority} priority)`);
        lines.push(`   Scenario: ${rec.suggestedScenario}`);
        lines.push('');
      }
      if (report.recommendations.length > 15) {
        lines.push(`... and ${report.recommendations.length - 15} more recommendations`);
        lines.push('');
      }
    }

    // Execution details
    if (report.executionIds.length > 0) {
      lines.push('## Included Executions');
      lines.push('');
      for (const id of report.executionIds) {
        lines.push(`- ${id}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Reset tracker state
   */
  reset(): void {
    this.toolInvocations.clear();
    this.executionIds.clear();
  }

  /**
   * Get current state (for debugging)
   */
  getState(): {
    toolCount: number;
    invocationCount: number;
    executionCount: number;
    inventorySize: number;
  } {
    return {
      toolCount: this.toolInvocations.size,
      invocationCount: Array.from(this.toolInvocations.values()).reduce((sum, set) => sum + set.size, 0),
      executionCount: this.executionIds.size,
      inventorySize: this.inventory.size,
    };
  }
}

/**
 * Create a coverage tracker instance
 */
export function createCoverageTracker(options?: CoverageTrackerOptions): CoverageTracker {
  return new CoverageTracker(options);
}

/**
 * Generate coverage report from multiple session logs
 */
export async function generateCoverageReport(
  sessionLogs: Array<{ path: string; useCaseId: string }>,
  options?: CoverageTrackerOptions
): Promise<CoverageReport> {
  const tracker = createCoverageTracker(options);

  // Load inventory first
  await tracker.loadInventory();

  // Parse all session logs
  for (const log of sessionLogs) {
    await tracker.parseSessionLog(log.path, log.useCaseId);
  }

  return tracker.generateReport();
}
