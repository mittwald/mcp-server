#!/usr/bin/env node
/**
 * Generate missing eval prompts using v2.0.0 template
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.join(__dirname, '..', 'evals', 'prompts');
const TIMESTAMP = new Date().toISOString();

// Read tools inventory
const toolsInventory = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'evals', 'inventory', 'tools-current.json'), 'utf-8')
);

const toolsMap = new Map(
  toolsInventory.tools.map(tool => [tool.mcpName, tool])
);

// Tools that need prompts generated
const MISSING_TOOLS = [
  'mcp__mittwald__mittwald_app_list_upgrade_candidates',
  'mcp__mittwald__mittwald_database_mysql_user_create',
  'mcp__mittwald__mittwald_database_mysql_user_delete',
  'mcp__mittwald__mittwald_database_mysql_user_get',
  'mcp__mittwald__mittwald_database_mysql_user_list',
  'mcp__mittwald__mittwald_database_mysql_user_update',
  'mcp__mittwald__mittwald_org_invite_list',
  'mcp__mittwald__mittwald_org_invite_revoke',
  'mcp__mittwald__mittwald_org_membership_list',
  'mcp__mittwald__mittwald_org_membership_revoke',
  'mcp__mittwald__mittwald_project_invite_get',
  'mcp__mittwald__mittwald_project_invite_list',
  'mcp__mittwald__mittwald_project_membership_get',
  'mcp__mittwald__mittwald_project_membership_list',
];

/**
 * Determine tier based on tool hierarchy
 */
function getTier(displayName) {
  // Tier 0: Identity/user operations
  if (displayName.startsWith('user/') || displayName.startsWith('context/')) return 0;

  // Tier 1: Organization operations
  if (displayName.startsWith('org/')) return 1;

  // Tier 2: Server operations
  if (displayName.startsWith('server/')) return 2;

  // Tier 3: Project creation
  if (displayName === 'project/create' || displayName === 'project/list') return 3;

  // Tier 4: Everything else (project-dependent)
  return 4;
}

/**
 * Determine dependencies based on tier and operation
 */
function getDependencies(displayName, tier) {
  if (tier === 0) return [];
  if (tier === 1) return ['org/list'];
  if (tier === 2) return ['server/list'];
  if (tier === 3) return [];

  // Tier 4 - project-dependent operations
  if (displayName.startsWith('app/')) return ['project/create', 'app/list'];
  if (displayName.startsWith('database/')) return ['project/create'];
  if (displayName.startsWith('project/')) return ['project/create'];

  return ['project/create'];
}

/**
 * Generate setup instructions
 */
function getSetupInstructions(tier, dependencies) {
  if (tier === 0) {
    return 'Ensure authentication is configured.';
  }
  if (tier === 1) {
    return 'Ensure you have access to an organization. Use org/list to verify.';
  }
  if (tier === 2) {
    return 'Ensure you have access to a server. Use server/list to verify.';
  }
  if (tier === 3) {
    return 'Ensure authentication and server context are established.';
  }
  // Tier 4
  return 'Ensure a test project exists. Use project/list to verify, or project/create to establish one.';
}

/**
 * Generate goal description
 */
function getGoalDescription(displayName, description) {
  if (displayName.includes('/list')) return 'listing resources';
  if (displayName.includes('/get')) return 'retrieving resource details';
  if (displayName.includes('/create')) return 'creating a new resource';
  if (displayName.includes('/delete') || displayName.includes('/revoke')) return 'deleting/revoking a resource';
  if (displayName.includes('/update')) return 'updating a resource';
  return description?.toLowerCase() || 'performing an operation';
}

/**
 * Generate example parameters
 */
function getExampleParameters(displayName, tier) {
  if (tier === 4 && displayName.startsWith('database/mysql/user/')) {
    return '- databaseId: Use database/mysql/list to find an existing database ID\n- Refer to tool schema for user-specific parameters';
  }
  if (tier === 4) {
    return '- projectId: Use project/list to find an existing project ID\n- Refer to tool schema for additional required parameters';
  }
  if (tier === 1) {
    return '- organizationId: Use org/list to find an existing organization ID';
  }
  return '- Refer to tool schema for required parameters';
}

/**
 * Generate success indicators
 */
function getSuccessIndicators(displayName) {
  if (displayName.includes('/list')) {
    return [
      'Returns an array of resources',
      'Each resource has required ID fields',
      'No authentication errors'
    ];
  }
  if (displayName.includes('/get')) {
    return [
      'Returns resource details with all expected fields',
      'Resource ID matches the requested ID',
      'No authentication errors'
    ];
  }
  if (displayName.includes('/create')) {
    return [
      'Returns created resource with ID',
      'Resource can be retrieved via get operation',
      'No validation errors'
    ];
  }
  if (displayName.includes('/delete') || displayName.includes('/revoke')) {
    return [
      'Delete/revoke operation succeeds without errors',
      'Resource is no longer accessible',
      'Returns appropriate success response'
    ];
  }
  if (displayName.includes('/update')) {
    return [
      'Update operation succeeds without errors',
      'Changes are reflected in subsequent get calls',
      'Returns updated resource data'
    ];
  }
  return [
    'Operation completes successfully',
    'Returns expected response structure',
    'No errors encountered'
  ];
}

/**
 * Get operation type tag
 */
function getOperationType(displayName) {
  if (displayName.includes('/list') || displayName.includes('/get')) return 'read-only';
  if (displayName.includes('/create')) return 'create';
  if (displayName.includes('/update')) return 'update';
  if (displayName.includes('/delete') || displayName.includes('/revoke')) return 'delete';
  return 'execute';
}

/**
 * Generate v2.0.0 eval prompt
 */
function generatePrompt(tool) {
  const { mcpName, displayName, domain, description } = tool;
  const tier = getTier(displayName);
  const dependencies = getDependencies(displayName, tier);
  const setupInstructions = getSetupInstructions(tier, dependencies);
  const goalDescription = getGoalDescription(displayName, description);
  const exampleParameters = getExampleParameters(displayName, tier);
  const successIndicators = getSuccessIndicators(displayName);
  const operationType = getOperationType(displayName);

  const prompt = `# Eval: ${displayName}

## Goal
Test the \`${mcpName}\` MCP tool by ${goalDescription}.

## Tool Information
- **MCP Tool Name**: \`${mcpName}\`
- **Display Name**: \`${displayName}\`
- **Domain**: ${domain}
- **Dependency Tier**: ${tier}
- **Description**: ${description || 'MCP tool operation'}

## Prerequisites
**Dependencies**: ${dependencies.length > 0 ? dependencies.join(', ') : 'None'}

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
${exampleParameters}

## Success Indicators
The eval is successful if:
${successIndicators.map(s => `- ${s}`).join('\n')}


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

  return {
    input: {
      prompt,
      tool_name: mcpName,
      display_name: displayName,
      context: {
        dependencies,
        setup_instructions: setupInstructions,
        required_resources: []
      }
    },
    expectedOutput: null,
    metadata: {
      domain,
      tier,
      tool_description: description || 'MCP tool operation',
      success_indicators: successIndicators,
      self_assessment_required: true,
      eval_version: '2.0.0',
      created_at: TIMESTAMP,
      tags: [
        domain,
        `tier-${tier}`,
        operationType
      ]
    }
  };
}

/**
 * Get filename for a tool
 */
function getFilename(displayName) {
  return displayName.replace(/\//g, '-') + '.json';
}

/**
 * Get directory for a domain
 */
function getDomainDir(domain) {
  // Map domain to directory name
  const domainMap = {
    'apps': 'apps',
    'databases': 'databases',
    'organization': 'organization',
    'project-foundation': 'project-foundation'
  };
  return domainMap[domain] || domain;
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Generating missing eval prompts...\n');

  let generated = 0;

  for (const mcpName of MISSING_TOOLS) {
    const tool = toolsMap.get(mcpName);
    if (!tool) {
      console.warn(`⚠️  Tool ${mcpName} not found in inventory - skipping`);
      continue;
    }

    const prompt = generatePrompt(tool);
    const domainDir = getDomainDir(tool.domain);
    const filename = getFilename(tool.displayName);
    const filePath = path.join(PROMPTS_DIR, domainDir, filename);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(filePath, JSON.stringify(prompt, null, 2) + '\n');
    console.log(`✅ Generated: ${tool.displayName} → ${domainDir}/${filename}`);
    generated++;
  }

  console.log(`\n✨ Complete! Generated ${generated} new prompts`);
}

main();
