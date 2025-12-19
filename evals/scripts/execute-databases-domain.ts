#!/usr/bin/env npx tsx

/**
 * Execute all database domain evals
 *
 * Systematically calls all 14 database MCP tools and saves self-assessments
 */

import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ID = 'fd1ef726-14b8-4906-8a45-0756ba993246';
const RESULTS_DIR = '/Users/robert/Code/mittwald-mcp/evals/results/active/databases';
const PROMPTS_DIR = '/Users/robert/Code/mittwald-mcp/evals/prompts/databases';

interface SelfAssessment {
  success: boolean;
  confidence: 'high' | 'medium' | 'low';
  tool_executed: string;
  timestamp: string;
  problems_encountered: Array<{
    type: string;
    description: string;
  }>;
  resources_created: Array<{
    type: string;
    id: string;
    name?: string;
  }>;
  resources_verified: Array<{
    type: string;
    id: string;
    status: string;
  }>;
  tool_response_summary: string;
  execution_notes: string;
}

// Tool execution plan ordered by dependencies
const TOOLS = [
  // Tier 0: Version listing (no dependencies)
  { name: 'database-mysql-versions', tool: 'mcp__mittwald__mittwald_database_mysql_versions', params: {} },
  { name: 'database-redis-versions', tool: 'mcp__mittwald__mittwald_database_redis_versions', params: {} },

  // Tier 4: List operations (require project)
  { name: 'database-mysql-list', tool: 'mcp__mittwald__mittwald_database_mysql_list', params: { projectId: PROJECT_ID } },
  { name: 'database-redis-list', tool: 'mcp__mittwald__mittwald_database_redis_list', params: { projectId: PROJECT_ID } },

  // Tier 4: MySQL database operations
  { name: 'database-mysql-create', tool: 'mcp__mittwald__mittwald_database_mysql_create', params: { projectId: PROJECT_ID, version: '8.0', description: 'Eval test database' } },
  // Get and delete will use dynamically created database ID

  // Tier 4: MySQL user operations (require database)
  // Will be executed after database is created

  // Tier 4: Redis operations
  { name: 'database-redis-create', tool: 'mcp__mittwald__mittwald_database_redis_create', params: { projectId: PROJECT_ID, version: '7.0', description: 'Eval test Redis' } },
  // Get will use dynamically created redis ID
];

function saveAssessment(toolName: string, assessment: SelfAssessment) {
  const filepath = path.join(RESULTS_DIR, `${toolName}-result.json`);
  fs.writeFileSync(filepath, JSON.stringify(assessment, null, 2) + '\n');
  console.log(`✓ Saved: ${filepath}`);
}

async function main() {
  console.log('='.repeat(80));
  console.log('DATABASE DOMAIN EVAL EXECUTION');
  console.log('='.repeat(80));
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log(`Results: ${RESULTS_DIR}`);
  console.log(`Total tools: 14`);
  console.log('='.repeat(80));
  console.log();

  // Ensure results directory exists
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  console.log('NOTE: This script requires MCP tools to be accessible.');
  console.log('      Tools should be called directly via MCP interface.');
  console.log('      This script documents the execution plan.');
  console.log();

  // List all tools to execute
  console.log('EXECUTION PLAN:');
  console.log('1. database/mysql/versions (Tier 0)');
  console.log('2. database/redis/versions (Tier 0)');
  console.log('3. database/mysql/list (Tier 4)');
  console.log('4. database/redis/list (Tier 4)');
  console.log('5. database/mysql/create (Tier 4)');
  console.log('6. database/mysql/get (Tier 4)');
  console.log('7. database/mysql/delete (Tier 4)');
  console.log('8. database/mysql/user/create (Tier 4)');
  console.log('9. database/mysql/user/list (Tier 4)');
  console.log('10. database/mysql/user/get (Tier 4)');
  console.log('11. database/mysql/user/update (Tier 4)');
  console.log('12. database/mysql/user/delete (Tier 4)');
  console.log('13. database/redis/create (Tier 4)');
  console.log('14. database/redis/get (Tier 4)');
  console.log();
  console.log('Each tool must be called via MCP interface and self-assessment saved.');
  console.log();
  console.log('For manual execution:');
  console.log('  - Call each MCP tool listed above');
  console.log('  - Generate self-assessment with required fields');
  console.log('  - Save to evals/results/active/databases/{tool-name}-result.json');
}

main().catch(console.error);
