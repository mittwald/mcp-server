/**
 * Tool Chain Extractor & Recommendations (T049-T052, T054-T055)
 *
 * Extracts successful tool chains from sessions and generates recommendations.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import type {
  Session,
  CorpusIndex,
  ToolChain,
  Recommendation,
  TestDomain,
} from '../types.js';
import { mapToolToDomain } from '../../inventory/grouping.js';
import { parseToolName } from '../../inventory/discovery.js';

const MCP_TOOL_PREFIX = 'mcp__mittwald__';

// =============================================================================
// Tool Chain Extraction (T049)
// =============================================================================

/**
 * Extract tool chains from corpus.
 */
export function extractToolChains(corpus: CorpusIndex): ToolChain[] {
  const sessions = Object.values(corpus.sessions);
  const chains: ToolChain[] = [];
  let chainId = 0;

  for (const session of sessions) {
    // Find sessions with 2+ successful MCP tool calls
    const mcpCalls: string[] = [];

    for (const event of session.events) {
      if (event.toolCall && event.toolCall.name.startsWith(MCP_TOOL_PREFIX)) {
        mcpCalls.push(event.toolCall.name);
      }
    }

    if (mcpCalls.length >= 2) {
      // Deduplicate consecutive calls (retry loops)
      const dedupedCalls: string[] = [];
      for (const call of mcpCalls) {
        if (dedupedCalls.length === 0 || dedupedCalls[dedupedCalls.length - 1] !== call) {
          dedupedCalls.push(call);
        }
      }

      if (dedupedCalls.length >= 2) {
        chains.push({
          id: `chain-${String(++chainId).padStart(3, '0')}`,
          useCase: generateUseCase(dedupedCalls),
          description: generateDescription(dedupedCalls),
          tools: dedupedCalls,
          requiredParams: {},
          examplePrompt: generateExamplePrompt(dedupedCalls),
          avgTokens: session.totalTokens,
          avgDurationMs: session.durationMs,
          successRate: session.outcome === 'success' ? 1 : 0,
          derivedFromSessions: [session.id],
        });
      }
    }
  }

  return chains;
}

/**
 * Generate use case name from tool sequence.
 */
function generateUseCase(tools: string[]): string {
  const shortNames = tools.map(t => parseToolName(t).split('/')[0]);
  const uniqueNames = [...new Set(shortNames)];

  if (uniqueNames.length === 1) {
    return `${capitalize(uniqueNames[0])} Operations`;
  }

  return uniqueNames.map(capitalize).join(' → ');
}

/**
 * Generate description from tool sequence.
 */
function generateDescription(tools: string[]): string {
  const shortNames = tools.map(t => parseToolName(t));
  return `Workflow: ${shortNames.join(' → ')}`;
}

/**
 * Generate example prompt from tool sequence.
 */
function generateExamplePrompt(tools: string[]): string {
  const actions = tools.map(t => {
    const name = parseToolName(t);
    const [resource, action] = name.split('/');
    if (action === 'list') return `list ${resource}s`;
    if (action === 'get') return `get ${resource} details`;
    if (action === 'create') return `create a new ${resource}`;
    if (action === 'delete') return `delete the ${resource}`;
    if (action === 'update') return `update the ${resource}`;
    return `perform ${action || 'action'} on ${resource}`;
  });

  return actions.join(', then ');
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// =============================================================================
// Pattern Finding (T050)
// =============================================================================

/**
 * Find repeating patterns in tool chains.
 */
export function findPatterns(chains: ToolChain[]): ToolChain[] {
  // Group chains by tool sequence (order matters)
  const sequenceMap = new Map<string, ToolChain[]>();

  for (const chain of chains) {
    const key = chain.tools.join('|');
    if (!sequenceMap.has(key)) {
      sequenceMap.set(key, []);
    }
    sequenceMap.get(key)!.push(chain);
  }

  // Filter to sequences appearing 2+ times (lowered threshold for sparse data)
  const patterns: ToolChain[] = [];
  let patternId = 0;

  for (const [, chainGroup] of sequenceMap) {
    if (chainGroup.length >= 2) {
      const first = chainGroup[0];

      // Aggregate stats
      const totalTokens = chainGroup.reduce((sum, c) => sum + c.avgTokens, 0);
      const totalDuration = chainGroup.reduce((sum, c) => sum + c.avgDurationMs, 0);
      const successCount = chainGroup.filter(c => c.successRate === 1).length;

      patterns.push({
        id: `pattern-${String(++patternId).padStart(3, '0')}`,
        useCase: first.useCase,
        description: first.description,
        tools: first.tools,
        requiredParams: first.requiredParams,
        examplePrompt: first.examplePrompt,
        avgTokens: Math.round(totalTokens / chainGroup.length),
        avgDurationMs: Math.round(totalDuration / chainGroup.length),
        successRate: successCount / chainGroup.length,
        derivedFromSessions: chainGroup.flatMap(c => c.derivedFromSessions),
      });
    }
  }

  return patterns;
}

// =============================================================================
// Efficiency Ranking (T051)
// =============================================================================

/**
 * Rank chains by token efficiency.
 */
export function rankByEfficiency(chains: ToolChain[]): ToolChain[] {
  // Efficiency score: avgTokens / toolCount (lower is better)
  const scored = chains.map(c => ({
    chain: c,
    score: c.avgTokens / c.tools.length,
  }));

  // Sort ascending by efficiency score
  scored.sort((a, b) => a.score - b.score);

  return scored.map(s => s.chain);
}

// =============================================================================
// Recommendation Generation (T052)
// =============================================================================

/**
 * Generate recommendations from tool chains.
 */
export function generateRecommendations(
  chains: ToolChain[],
  corpus: CorpusIndex
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  let recId = 0;

  for (const chain of chains) {
    // Determine domain based on first tool
    const firstTool = chain.tools[0];
    const domain = mapToolToDomain(firstTool);

    const rec: Recommendation = {
      id: `rec-${String(++recId).padStart(3, '0')}`,
      title: chain.useCase,
      tools: chain.tools.map(t => parseToolName(t)),
      examplePrompt: chain.examplePrompt,
      prerequisites: chain.tools.length > 1 ? [parseToolName(chain.tools[0])] : [],
      avgTokens: chain.avgTokens,
      frequency: chain.derivedFromSessions.length,
    };

    recommendations.push(rec);
  }

  return recommendations;
}

// =============================================================================
// Full Pipeline
// =============================================================================

/**
 * Extract chains, find patterns, rank by efficiency, generate recommendations.
 */
export function extractAndGenerateRecommendations(
  corpus: CorpusIndex
): { chains: ToolChain[]; recommendations: Recommendation[] } {
  // Extract all chains
  const allChains = extractToolChains(corpus);

  // Find repeating patterns
  const patterns = findPatterns(allChains);

  // Rank by efficiency
  const ranked = rankByEfficiency(patterns);

  // Generate recommendations (top 20)
  const recommendations = generateRecommendations(ranked.slice(0, 20), corpus);

  return { chains: ranked, recommendations };
}

// =============================================================================
// Export Functions (T054, T055)
// =============================================================================

/**
 * Export recommendations to JSON.
 */
export function exportRecommendationsJson(
  recommendations: Recommendation[],
  chains: ToolChain[],
  outputPath: string
): void {
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const avgEfficiency = chains.length > 0
    ? Math.round(chains.reduce((sum, c) => sum + c.avgTokens / c.tools.length, 0) / chains.length)
    : 0;

  const json = {
    recommendations,
    generatedAt: new Date().toISOString(),
    totalChains: chains.length,
    avgEfficiency,
  };

  writeFileSync(outputPath, JSON.stringify(json, null, 2), 'utf-8');
}

/**
 * Export recommendations to Markdown.
 */
export function exportRecommendationsMarkdown(
  recommendations: Recommendation[],
  outputPath: string
): void {
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const lines: string[] = [];

  lines.push('# Tool Chain Recommendations');
  lines.push('');
  lines.push('Recommended tool sequences based on successful session analysis.');
  lines.push('');

  for (const rec of recommendations) {
    lines.push(`## ${rec.title}`);
    lines.push('');
    lines.push(`**ID**: ${rec.id}`);
    lines.push(`**Frequency**: ${rec.frequency} sessions`);
    lines.push(`**Average Tokens**: ${rec.avgTokens.toLocaleString()}`);
    lines.push('');

    lines.push('### Tools');
    lines.push('');
    for (let i = 0; i < rec.tools.length; i++) {
      lines.push(`${i + 1}. \`${rec.tools[i]}\``);
    }
    lines.push('');

    lines.push('### Example Prompt');
    lines.push('');
    lines.push(`> ${rec.examplePrompt}`);
    lines.push('');

    if (rec.prerequisites.length > 0) {
      lines.push('### Prerequisites');
      lines.push('');
      for (const prereq of rec.prerequisites) {
        lines.push(`- \`${prereq}\``);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  lines.push(`*Generated on ${new Date().toISOString().split('T')[0]}*`);

  writeFileSync(outputPath, lines.join('\n'), 'utf-8');
}
