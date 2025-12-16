#!/usr/bin/env npx tsx

/**
 * Eval Prompt Generator
 *
 * Generates Langfuse-format eval prompts from the tool inventory.
 * Produces JSON files organized by domain with embedded self-assessment instructions.
 *
 * Usage:
 *   npx tsx generate-eval-prompts.ts [inventory-path] [output-dir]
 *   npx tsx generate-eval-prompts.ts --validate <prompt-file>
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ============================================================================
// Type Definitions
// ============================================================================

interface ToolEntry {
  mcp_name: string;
  display_name: string;
  domain: string;
  tier: number;
  description: string;
  dependencies: string[];
  required_resources: string[];
  success_indicators: string[];
  is_destructive: boolean;
  is_interactive: boolean;
  parameters?: Record<string, string>;
}

interface ToolInventory {
  generated_at: string;
  tool_count: number;
  source: string;
  domains: Record<string, number>;
  tools: ToolEntry[];
}

interface EvalPromptInput {
  prompt: string;
  tool_name: string;
  display_name: string;
  context: {
    dependencies: string[];
    setup_instructions: string;
    required_resources: string[];
  };
}

interface EvalPromptMetadata {
  domain: string;
  tier: number;
  tool_description: string;
  success_indicators: string[];
  self_assessment_required: boolean;
  eval_version: string;
  created_at: string;
  tags: string[];
}

interface LangfuseDatasetItem {
  input: EvalPromptInput;
  expectedOutput: null;
  metadata: EvalPromptMetadata;
}

interface GenerationManifest {
  generated_at: string;
  total_prompts: number;
  by_domain: Record<string, string[]>;
  inventory_source: string;
}

// ============================================================================
// Self-Assessment Template
// ============================================================================

const SELF_ASSESSMENT_TEMPLATE = `
## Self-Assessment Instructions

After completing the task (whether successful or not), you MUST provide a structured self-assessment. Output your assessment in the following exact format, enclosed in the marker comments:

<!-- SELF_ASSESSMENT_START -->
\`\`\`json
{
  "success": true,
  "confidence": "high",
  "tool_executed": "{{tool_name}}",
  "timestamp": "{{timestamp}}",
  "problems_encountered": [],
  "resources_created": [],
  "resources_verified": [],
  "tool_response_summary": "Brief summary of what the tool returned",
  "execution_notes": "Any observations about the execution"
}
\`\`\`
<!-- SELF_ASSESSMENT_END -->

### Self-Assessment Field Guide:
- **success**: \`true\` if the tool achieved its goal, \`false\` otherwise
- **confidence**: \`high\` (clear outcome), \`medium\` (some uncertainty), \`low\` (unable to determine)
- **tool_executed**: The exact MCP tool name you invoked
- **timestamp**: Current ISO 8601 timestamp
- **problems_encountered**: Array of problem objects with \`type\` and \`description\` fields
  - Valid types: \`auth_error\`, \`resource_not_found\`, \`validation_error\`, \`timeout\`, \`api_error\`, \`permission_denied\`, \`quota_exceeded\`, \`dependency_missing\`, \`other\`
- **resources_created**: Array of created resources with \`type\` and \`id\` fields
- **resources_verified**: Array of verified resources with \`type\`, \`id\`, and \`status\` fields
- **tool_response_summary**: Key information from the tool's response
- **execution_notes**: Any observations or recommendations

**IMPORTANT**: The self-assessment MUST be valid JSON enclosed in the marker comments exactly as shown.
`;

// ============================================================================
// Prompt Generation Functions
// ============================================================================

/**
 * Generate setup instructions based on tool dependencies and tier
 */
function generateSetupInstructions(tool: ToolEntry): string {
  if (tool.tier === 0) {
    return 'No setup required - this is a Tier 0 tool with no prerequisites.';
  }

  const instructions: string[] = [];
  const requiredResources = tool.required_resources || inferRequiredResources(tool);

  if (requiredResources.includes('project')) {
    instructions.push(
      '1. Ensure you have an existing project (use `mcp__mittwald__mittwald_project_list` to find one, or `mcp__mittwald__mittwald_project_create` to create one)'
    );
  }

  if (requiredResources.includes('app')) {
    instructions.push(
      `${instructions.length + 1}. Ensure an app exists in the project (use \`mcp__mittwald__mittwald_app_list\` to find one)`
    );
  }

  if (requiredResources.includes('database-mysql')) {
    instructions.push(
      `${instructions.length + 1}. Ensure a MySQL database exists (use \`mcp__mittwald__mittwald_database_mysql_list\` to find one)`
    );
  }

  if (requiredResources.includes('database-redis')) {
    instructions.push(
      `${instructions.length + 1}. Ensure a Redis database exists (use \`mcp__mittwald__mittwald_database_redis_list\` to find one)`
    );
  }

  if (requiredResources.includes('backup')) {
    instructions.push(
      `${instructions.length + 1}. Ensure a backup exists (use \`mcp__mittwald__mittwald_backup_list\` to find one)`
    );
  }

  if (requiredResources.includes('cronjob')) {
    instructions.push(
      `${instructions.length + 1}. Ensure a cronjob exists (use \`mcp__mittwald__mittwald_cronjob_list\` to find one)`
    );
  }

  if (requiredResources.includes('container')) {
    instructions.push(
      `${instructions.length + 1}. Ensure a container exists (use \`mcp__mittwald__mittwald_container_list_services\` to find one)`
    );
  }

  if (requiredResources.includes('ssh-key')) {
    instructions.push(
      `${instructions.length + 1}. Ensure an SSH key exists (use \`mcp__mittwald__mittwald_user_ssh_key_list\` to find one)`
    );
  }

  if (requiredResources.includes('api-token')) {
    instructions.push(
      `${instructions.length + 1}. Ensure an API token exists (use \`mcp__mittwald__mittwald_user_api_token_list\` to find one)`
    );
  }

  if (instructions.length === 0 && tool.dependencies.length > 0) {
    instructions.push(
      `Follow the dependency chain to establish required resources: ${tool.dependencies.join(' → ')}`
    );
  }

  return instructions.length > 0
    ? instructions.join('\n')
    : 'Verify prerequisites are in place before executing.';
}

/**
 * Infer required resources from tool name and tier
 */
function inferRequiredResources(tool: ToolEntry): string[] {
  const resources: string[] = [];
  const name = tool.display_name;

  // Tier 4 tools generally need a project
  if (tool.tier >= 4) {
    resources.push('project');
  }

  // App-specific tools
  if (name.startsWith('app/') && !name.includes('create') && !name.includes('install') && !name.includes('list') && !name.includes('versions')) {
    resources.push('app');
  }

  // Database-specific tools
  if (name.startsWith('database/mysql/') && !name.includes('create') && !name.includes('list') && !name.includes('versions') && !name.includes('charsets')) {
    resources.push('database-mysql');
  }
  if (name.startsWith('database/redis/') && !name.includes('create') && !name.includes('list') && !name.includes('versions')) {
    resources.push('database-redis');
  }

  // Backup-specific tools
  if (name.startsWith('backup/') && name !== 'backup/list' && name !== 'backup/create' && !name.includes('schedule')) {
    resources.push('backup');
  }

  // Cronjob-specific tools
  if (name.startsWith('cronjob/execution') || (name.startsWith('cronjob/') && !name.includes('create') && !name.includes('list'))) {
    resources.push('cronjob');
  }

  // Container-specific tools
  if (name.startsWith('container/') && name !== 'container/run' && name !== 'container/list-services') {
    resources.push('container');
  }

  // User resource tools
  if (name.includes('ssh-key/get') || name.includes('ssh-key/delete')) {
    resources.push('ssh-key');
  }
  if (name.includes('api-token/get') || name.includes('api-token/revoke')) {
    resources.push('api-token');
  }

  return resources;
}

/**
 * Generate example parameters for a tool
 */
function generateExampleParams(tool: ToolEntry): string {
  // Use provided parameters if available
  if (tool.parameters && Object.keys(tool.parameters).length > 0) {
    return Object.entries(tool.parameters)
      .map(([key, desc]) => `- \`${key}\`: ${desc}`)
      .join('\n');
  }

  const name = tool.display_name;

  // Tool-specific examples
  const examples: Record<string, string> = {
    'user/get': '- No parameters required (defaults to current authenticated user)\n- Optional: `userId` to get a specific user\'s profile',
    'project/create': '- `serverId`: The server ID (e.g., "s-xxxxx") - use server/list to find available servers\n- `description`: A descriptive name for the project',
    'project/list': '- No required parameters\n- Results include project IDs for use with other tools',
    'app/create/node': '- `projectId`: The project ID (e.g., "p-xxxxx")\n- `siteTitle`: Optional descriptive name\n- `entrypoint`: Entry file (defaults to "index.js")',
    'app/create/php': '- `projectId`: The project ID\n- `siteTitle`: Optional descriptive name\n- `documentRoot`: Document root path (defaults to "/")',
    'database/mysql/create': '- `projectId`: The project ID\n- `description`: Database description\n- `version`: MySQL version (use `database/mysql/versions` to list available)',
    'database/redis/create': '- `projectId`: The project ID\n- `description`: Database description\n- `version`: Redis version (use `database/redis/versions` to list available)',
    'backup/create': '- `projectId`: The project ID\n- `description`: Optional backup description',
    'cronjob/create': '- `appInstallationId`: The app installation ID\n- `interval`: Cron expression (e.g., "0 * * * *")\n- `description`: Cronjob description\n- `destination.url`: Script path to execute',
    'container/run': '- `projectId`: The project ID\n- `image`: Container image to run (e.g., "nginx:latest")',
  };

  if (examples[name]) {
    return examples[name];
  }

  // Pattern-based examples
  if (name.includes('/list')) {
    return '- No required parameters for listing\n- Optional: Scope parameters like `projectId` to filter results';
  }
  if (name.includes('/get')) {
    return '- Resource ID required (check tool schema for exact parameter name)\n- Use the corresponding `/list` tool to find available IDs';
  }
  if (name.includes('/create')) {
    return '- Check tool schema for required creation parameters\n- `projectId` typically required for project-scoped resources';
  }
  if (name.includes('/delete') || name.includes('/uninstall') || name.includes('/revoke')) {
    return '- Resource ID required\n- Some tools require explicit confirmation parameter';
  }
  if (name.includes('/update')) {
    return '- Resource ID required\n- Include only the fields you want to update';
  }

  return '- Check the tool schema for required and optional parameters';
}

/**
 * Generate the full eval prompt text for a tool
 */
function generatePromptText(tool: ToolEntry): string {
  const prereqSection = tool.tier === 0
    ? 'This is a Tier 0 tool with no prerequisites. You can execute it immediately.'
    : `**Dependencies**: ${tool.dependencies.length > 0 ? tool.dependencies.join(', ') : 'Implicit project context'}

**Setup Instructions**:
${generateSetupInstructions(tool)}

Ensure all prerequisites are met before executing the target tool.`;

  const successList = tool.success_indicators.length > 0
    ? tool.success_indicators.map((s) => `- ${s}`).join('\n')
    : '- Tool executes without errors\n- Response contains expected data';

  const destructiveWarning = tool.is_destructive
    ? `\n\n**⚠️ WARNING**: This is a destructive operation. Ensure you have the correct resource ID and any required confirmations before executing.`
    : '';

  const interactiveNote = tool.is_interactive
    ? `\n\n**Note**: This tool may require interactive input or produce interactive output (e.g., SSH sessions, port forwarding).`
    : '';

  return `# Eval: ${tool.display_name}

## Goal
Test the \`${tool.mcp_name}\` MCP tool by ${tool.description.toLowerCase().replace(/\.$/, '')}.

## Tool Information
- **MCP Tool Name**: \`${tool.mcp_name}\`
- **Display Name**: \`${tool.display_name}\`
- **Domain**: ${tool.domain}
- **Dependency Tier**: ${tool.tier}
- **Description**: ${tool.description}${destructiveWarning}${interactiveNote}

## Prerequisites
${prereqSection}

## Task
Execute the \`${tool.mcp_name}\` tool and verify the result.

### Steps:
1. ${tool.tier > 0 ? 'Verify prerequisites are in place (or establish them if needed)\n2. ' : ''}Execute \`${tool.mcp_name}\` with appropriate parameters
${tool.tier > 0 ? '3' : '2'}. Verify the operation succeeded by checking the response
${tool.tier > 0 ? '4' : '3'}. Record the outcome in your self-assessment

### Example Parameters:
${generateExampleParams(tool)}

## Success Indicators
The eval is successful if:
${successList}

${SELF_ASSESSMENT_TEMPLATE.replace(/\{\{tool_name\}\}/g, tool.mcp_name).replace(/\{\{timestamp\}\}/g, new Date().toISOString())}
`;
}

/**
 * Generate a Langfuse dataset item for a tool
 */
function generateDatasetItem(tool: ToolEntry): LangfuseDatasetItem {
  const prompt = generatePromptText(tool);
  const tags = [tool.domain, `tier-${tool.tier}`];

  if (tool.is_destructive) {
    tags.push('destructive');
  }
  if (tool.is_interactive) {
    tags.push('interactive');
  }

  // Add operation type tag
  const name = tool.display_name;
  if (name.includes('/list')) tags.push('read-only');
  else if (name.includes('/get')) tags.push('read-only');
  else if (name.includes('/create')) tags.push('write');
  else if (name.includes('/delete')) tags.push('write');
  else if (name.includes('/update')) tags.push('write');

  return {
    input: {
      prompt,
      tool_name: tool.mcp_name,
      display_name: tool.display_name,
      context: {
        dependencies: tool.dependencies,
        setup_instructions: generateSetupInstructions(tool),
        required_resources: tool.required_resources || inferRequiredResources(tool),
      },
    },
    expectedOutput: null,
    metadata: {
      domain: tool.domain,
      tier: tool.tier,
      tool_description: tool.description,
      success_indicators: tool.success_indicators,
      self_assessment_required: true,
      eval_version: '1.0.0',
      created_at: new Date().toISOString(),
      tags,
    },
  };
}

// ============================================================================
// Main Generation Functions
// ============================================================================

/**
 * Generate eval prompts for all tools in the inventory
 */
export async function generateEvalPrompts(
  inventoryPath: string,
  outputDir: string
): Promise<GenerationManifest> {
  // Load inventory
  if (!fs.existsSync(inventoryPath)) {
    throw new Error(`Inventory file not found: ${inventoryPath}`);
  }

  const inventory: ToolInventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf-8'));

  console.log(`Generating prompts for ${inventory.tool_count} tools...`);

  const manifest: GenerationManifest = {
    generated_at: new Date().toISOString(),
    total_prompts: 0,
    by_domain: {},
    inventory_source: inventoryPath,
  };

  for (const tool of inventory.tools) {
    // Create domain directory
    const domainDir = path.join(outputDir, tool.domain);
    fs.mkdirSync(domainDir, { recursive: true });

    // Generate dataset item
    const evalItem = generateDatasetItem(tool);

    // Sanitize filename (replace / with -)
    const filename = tool.display_name.replace(/\//g, '-') + '.json';
    const filePath = path.join(domainDir, filename);

    // Write file
    fs.writeFileSync(filePath, JSON.stringify(evalItem, null, 2));

    // Update manifest
    if (!manifest.by_domain[tool.domain]) {
      manifest.by_domain[tool.domain] = [];
    }
    manifest.by_domain[tool.domain].push(filename);
    manifest.total_prompts++;

    console.log(`  ✓ ${tool.display_name}`);
  }

  // Write manifest
  const manifestPath = path.join(outputDir, 'generation-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written to: ${manifestPath}`);

  return manifest;
}

/**
 * Validate a generated prompt file against schemas
 */
export function validatePromptFile(filePath: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!fs.existsSync(filePath)) {
    return { valid: false, errors: [`File not found: ${filePath}`] };
  }

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Check required top-level fields
    if (!content.input) errors.push('Missing required field: input');
    if (content.expectedOutput !== null) errors.push('expectedOutput must be null');
    if (!content.metadata) errors.push('Missing required field: metadata');

    // Check input fields
    if (content.input) {
      if (!content.input.prompt) errors.push('Missing input.prompt');
      if (!content.input.tool_name) errors.push('Missing input.tool_name');
      if (!content.input.display_name) errors.push('Missing input.display_name');
      if (!content.input.context) errors.push('Missing input.context');
    }

    // Check metadata fields
    if (content.metadata) {
      if (!content.metadata.domain) errors.push('Missing metadata.domain');
      if (typeof content.metadata.tier !== 'number') errors.push('Missing or invalid metadata.tier');
      if (!content.metadata.tool_description) errors.push('Missing metadata.tool_description');
      if (!Array.isArray(content.metadata.success_indicators)) errors.push('Missing or invalid metadata.success_indicators');
      if (content.metadata.self_assessment_required !== true) errors.push('metadata.self_assessment_required must be true');
    }

    // Check for self-assessment markers in prompt
    if (content.input?.prompt) {
      if (!content.input.prompt.includes('<!-- SELF_ASSESSMENT_START -->')) {
        errors.push('Prompt missing SELF_ASSESSMENT_START marker');
      }
      if (!content.input.prompt.includes('<!-- SELF_ASSESSMENT_END -->')) {
        errors.push('Prompt missing SELF_ASSESSMENT_END marker');
      }
    }

    return { valid: errors.length === 0, errors };
  } catch (e) {
    return { valid: false, errors: [`JSON parse error: ${e instanceof Error ? e.message : String(e)}`] };
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage:');
    console.error('  npx ts-node generate-eval-prompts.ts <inventory-path> [output-dir]');
    console.error('  npx ts-node generate-eval-prompts.ts --validate <prompt-file>');
    console.error('');
    console.error('Examples:');
    console.error('  npx ts-node generate-eval-prompts.ts evals/inventory/tools.json evals/prompts');
    console.error('  npx ts-node generate-eval-prompts.ts --validate evals/prompts/identity/user-get.json');
    process.exit(1);
  }

  if (args[0] === '--validate') {
    const filePath = args[1];
    if (!filePath) {
      console.error('Error: --validate requires a file path');
      process.exit(1);
    }

    const result = validatePromptFile(filePath);
    if (result.valid) {
      console.log(`✓ ${filePath} is valid`);
      process.exit(0);
    } else {
      console.error(`✗ ${filePath} has ${result.errors.length} error(s):`);
      for (const error of result.errors) {
        console.error(`  - ${error}`);
      }
      process.exit(1);
    }
  }

  const inventoryPath = args[0];
  const outputDir = args[1] || 'evals/prompts';

  try {
    const manifest = await generateEvalPrompts(inventoryPath, outputDir);

    console.log('\n--- Generation Summary ---');
    console.log(`Total prompts: ${manifest.total_prompts}`);
    console.log('By domain:');
    for (const [domain, files] of Object.entries(manifest.by_domain)) {
      console.log(`  ${domain}: ${files.length}`);
    }
  } catch (e) {
    console.error('Error:', e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

// Export for testing
export {
  generatePromptText,
  generateSetupInstructions,
  inferRequiredResources,
  generateExampleParams,
  generateDatasetItem,
};

// Run if executed directly
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename || process.argv[1]?.endsWith('generate-eval-prompts.ts')) {
  main().catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
}
