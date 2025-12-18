#!/usr/bin/env node
/**
 * Update eval prompts from v1.0.0 to v2.0.0
 * - Adds "CALL tool directly" emphasis
 * - Updates eval_version to 2.0.0
 * - Refreshes timestamps
 * - Improves success indicators
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.join(__dirname, '..', 'evals', 'prompts');
const TIMESTAMP = new Date().toISOString();

// Read tools inventory to get current tool metadata
const toolsInventory = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'evals', 'inventory', 'tools-current.json'), 'utf-8')
);

const toolsMap = new Map(
  toolsInventory.tools.map(tool => [tool.mcpName, tool])
);

/**
 * Generate v2.0.0 prompt markdown
 */
function generateV2Prompt(tool, originalPrompt) {
  const { mcpName, displayName, domain, description } = tool;

  // Extract tier from original prompt or default to 4 for project-dependent tools
  const tierMatch = originalPrompt.match(/\*\*Dependency Tier\*\*: (\d)/);
  const tier = tierMatch ? parseInt(tierMatch[1]) : 4;

  // Extract dependencies from original prompt
  const depsMatch = originalPrompt.match(/\*\*Dependencies\*\*: (.*)/);
  const dependencies = depsMatch ? depsMatch[1].trim() : 'project/create';

  // Generate setup instructions
  const setupInstructions = tier === 4
    ? 'Ensure a test project exists. Use project/list to verify, or project/create to establish one.'
    : 'Verify authentication and context are established.';

  // Generate example parameters section
  const exampleParams = tier === 4
    ? '- projectId: Use project/list to find an existing project ID'
    : '- Refer to tool schema for required parameters';

  // Generate success indicators based on operation type
  const successIndicators = generateSuccessIndicators(displayName, description);

  return `# Eval: ${displayName}

## Goal
Test the \`${mcpName}\` MCP tool by ${generateGoalDescription(displayName, description)}.

## Tool Information
- **MCP Tool Name**: \`${mcpName}\`
- **Display Name**: \`${displayName}\`
- **Domain**: ${domain}
- **Dependency Tier**: ${tier}
- **Description**: ${description || 'MCP tool operation'}

## Prerequisites
**Dependencies**: ${dependencies}

**Setup Instructions**:
${setupInstructions}

Ensure all prerequisites are met before executing the target tool.

## Task
Execute the \`${mcpName}\` tool and verify the result.

**IMPORTANT**: You must CALL the MCP tool directly. Do NOT write a script or automation to simulate the tool call.

### Steps:
1. Verify prerequisites are in place (or establish them if needed)
2. **CALL** \`${mcpName}\` using the MCP tool interface
3. Verify the operation succeeded by checking the response
4. Record the outcome in your self-assessment

### How to Execute:
Use the MCP tool directly:
- Claude Code: Tool will be available in your tool list
- Provide parameters as specified in the tool schema
- Observe the actual response from the production server

**DO NOT**:
- Write a TypeScript/JavaScript/Python script to call the tool
- Create automation that simulates the tool execution
- Use fetch/axios/HTTP clients to bypass the MCP interface

**DO**:
- Call the tool using your MCP tool interface
- Use actual parameters from the tool schema
- Observe real responses from the Mittwald API

### Example Parameters:
${exampleParams}

## Success Indicators
The eval is successful if:
${successIndicators}


## Self-Assessment Instructions

After completing the task (whether successful or not), you MUST provide a structured self-assessment. Output your assessment in the following exact format, enclosed in the marker comments:

<!-- SELF_ASSESSMENT_START -->
\`\`\`json
{
  "success": true,
  "confidence": "high",
  "tool_executed": "${mcpName}",
  "timestamp": "${TIMESTAMP}",
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
}

function generateGoalDescription(displayName, description) {
  if (displayName.includes('/list')) return 'listing resources';
  if (displayName.includes('/get')) return 'retrieving resource details';
  if (displayName.includes('/create')) return 'creating a new resource';
  if (displayName.includes('/delete')) return 'deleting a resource';
  if (displayName.includes('/update')) return 'updating a resource';
  return description?.toLowerCase() || 'performing an operation';
}

function generateSuccessIndicators(displayName, description) {
  if (displayName.includes('/list')) {
    return '- Returns an array of resources\n- Each resource has required ID fields\n- No authentication errors';
  }
  if (displayName.includes('/get')) {
    return '- Returns resource details with all expected fields\n- Resource ID matches the requested ID\n- No authentication errors';
  }
  if (displayName.includes('/create')) {
    return '- Returns created resource with ID\n- Resource can be retrieved via get operation\n- No validation errors';
  }
  if (displayName.includes('/delete')) {
    return '- Delete operation succeeds without errors\n- Resource is no longer accessible via get\n- Returns appropriate success response';
  }
  if (displayName.includes('/update')) {
    return '- Update operation succeeds without errors\n- Changes are reflected in subsequent get calls\n- Returns updated resource data';
  }
  return '- Operation completes successfully\n- Returns expected response structure\n- No errors encountered';
}

/**
 * Update a prompt file to v2.0.0
 */
function updatePromptFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const prompt = JSON.parse(content);

  // Skip if already v2.0.0
  if (prompt.metadata?.eval_version === '2.0.0') {
    console.log(`⏭️  Skipping ${path.basename(filePath)} - already v2.0.0`);
    return false;
  }

  const mcpName = prompt.input.tool_name;
  const tool = toolsMap.get(mcpName);

  if (!tool) {
    console.warn(`⚠️  Tool ${mcpName} not found in inventory - skipping ${filePath}`);
    return false;
  }

  // Generate new prompt
  const newPrompt = generateV2Prompt(tool, prompt.input.prompt);

  // Update prompt content
  prompt.input.prompt = newPrompt;
  prompt.input.display_name = tool.displayName;

  // Update context
  const tierMatch = newPrompt.match(/\*\*Dependency Tier\*\*: (\d)/);
  const tier = tierMatch ? parseInt(tierMatch[1]) : 4;
  const depsMatch = newPrompt.match(/\*\*Dependencies\*\*: (.*)/);
  const dependencies = depsMatch ? depsMatch[1].trim().split(', ') : ['project/create'];

  prompt.input.context = {
    dependencies,
    setup_instructions: tier === 4
      ? 'Ensure a test project exists. Use project/list to verify, or project/create to establish one.'
      : 'Verify authentication and context are established.',
    required_resources: prompt.input.context?.required_resources || []
  };

  // Update metadata
  prompt.metadata.eval_version = '2.0.0';
  prompt.metadata.updated_at = TIMESTAMP;
  if (!prompt.metadata.created_at) {
    prompt.metadata.created_at = TIMESTAMP;
  }

  // Update success indicators
  const successIndicatorsMatch = newPrompt.match(/## Success Indicators\nThe eval is successful if:\n([\s\S]*?)\n\n/);
  if (successIndicatorsMatch) {
    const indicators = successIndicatorsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(2));
    prompt.metadata.success_indicators = indicators;
  }

  // Write updated file
  fs.writeFileSync(filePath, JSON.stringify(prompt, null, 2) + '\n');
  console.log(`✅ Updated ${path.basename(filePath)} to v2.0.0`);
  return true;
}

/**
 * Update all prompts in a directory
 */
function updatePromptsInDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return { updated: 0, skipped: 0 };
  }

  const files = fs.readdirSync(dirPath);
  let updated = 0;
  let skipped = 0;

  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    const filePath = path.join(dirPath, file);
    const result = updatePromptFile(filePath);
    if (result) {
      updated++;
    } else {
      skipped++;
    }
  }

  return { updated, skipped };
}

/**
 * Main execution
 */
function main() {
  const domains = ['apps', 'databases', 'project-foundation', 'organization'];

  console.log('🚀 Starting prompt updates to v2.0.0...\n');

  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const domain of domains) {
    console.log(`\n📁 Processing domain: ${domain}`);
    const domainPath = path.join(PROMPTS_DIR, domain);
    const { updated, skipped } = updatePromptsInDirectory(domainPath);
    totalUpdated += updated;
    totalSkipped += skipped;
    console.log(`   Updated: ${updated}, Skipped: ${skipped}`);
  }

  console.log(`\n✨ Complete! Updated ${totalUpdated} prompts, skipped ${totalSkipped}`);
}

main();
