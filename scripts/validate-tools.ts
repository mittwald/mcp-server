#!/usr/bin/env npx tsx
/**
 * Tool validation script for Swarm V2 evaluation
 * Checks completeness of tool implementations
 */

import * as fs from 'fs';
import * as path from 'path';
import { TOOLS } from '../src/constants/tools.js';

interface ValidationIssue {
  toolName: string;
  agent: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  status: 'open' | 'fixed';
}

class ToolValidator {
  private issues: ValidationIssue[] = [];

  private getAgentFromToolName(toolName: string): string {
    // Extract agent number from tool patterns
    if (toolName.includes('_app_dependency_')) return 'agent-2';
    if (toolName.includes('_app_install_') || toolName.includes('_app_list') || toolName.includes('_app_')) return 'agent-3';
    if (toolName.includes('_cronjob_execution_')) return 'agent-7';
    if (toolName.includes('_cronjob_')) return 'agent-8';
    if (toolName.includes('_database_')) return 'agent-9';
    if (toolName.includes('_ddev_') || toolName.includes('_domain_')) return 'agent-11';
    if (toolName.includes('_extension_') || toolName.includes('_login_') || toolName.includes('_domain_virtualhost_')) return 'agent-14';
    if (toolName.includes('_mail_')) return 'agent-15';
    if (toolName.includes('_org_')) return 'agent-16';
    if (toolName.includes('_project_')) return 'agent-18';
    return 'unknown';
  }

  private getToolPath(toolName: string): string {
    // Convert tool name to file path
    return toolName.replace(/^mittwald_/, '').replace(/_/g, '/');
  }

  private addIssue(toolName: string, type: string, severity: ValidationIssue['severity'], description: string) {
    this.issues.push({
      toolName,
      agent: this.getAgentFromToolName(toolName),
      severity,
      type,
      description,
      status: 'open'
    });
  }

  async validateToolDefinitions(): Promise<void> {
    console.log('🔍 Validating tool definitions...');
    
    for (const tool of TOOLS) {
      if (!tool.name.startsWith('mittwald_')) continue;

      const toolPath = this.getToolPath(tool.name);
      const definitionPath = path.join('src/constants/tool/mittwald-cli', `${toolPath}.js`);
      
      if (!fs.existsSync(definitionPath)) {
        this.addIssue(tool.name, 'missing_definition', 'critical', `Missing definition file: ${definitionPath}`);
      }
    }
  }

  async validateHandlers(): Promise<void> {
    console.log('🔍 Validating handlers...');
    
    for (const tool of TOOLS) {
      if (!tool.name.startsWith('mittwald_')) continue;

      const toolPath = this.getToolPath(tool.name);
      const handlerPath = path.join('src/handlers/tools/mittwald-cli', `${toolPath}.js`);
      
      if (!fs.existsSync(handlerPath)) {
        this.addIssue(tool.name, 'missing_handler', 'critical', `Missing handler file: ${handlerPath}`);
      }
    }
  }

  async validateSchemas(): Promise<void> {
    console.log('🔍 Validating Zod schemas...');
    
    const toolHandlersPath = 'src/handlers/tool-handlers.ts';
    const content = fs.readFileSync(toolHandlersPath, 'utf-8');
    
    for (const tool of TOOLS) {
      if (!tool.name.startsWith('mittwald_')) continue;
      
      // Check if schema exists in ToolSchemas
      const schemaPattern = new RegExp(`\\b${tool.name}\\s*:`);
      if (!schemaPattern.test(content)) {
        this.addIssue(tool.name, 'missing_schema', 'high', `Missing Zod schema in ToolSchemas`);
      }
    }
  }

  async validateSwitchCases(): Promise<void> {
    console.log('🔍 Validating switch cases...');
    
    const toolHandlersPath = 'src/handlers/tool-handlers.ts';
    const content = fs.readFileSync(toolHandlersPath, 'utf-8');
    
    for (const tool of TOOLS) {
      if (!tool.name.startsWith('mittwald_')) continue;
      
      // Check if switch case exists
      const switchPattern = new RegExp(`case\\s+["']${tool.name}["']:`);
      if (!switchPattern.test(content)) {
        this.addIssue(tool.name, 'missing_switch', 'high', `Missing switch case in handleToolCall`);
      }
    }
  }

  async validateImports(): Promise<void> {
    console.log('🔍 Validating imports...');
    
    const toolsPath = 'src/constants/tools.ts';
    const handlersPath = 'src/handlers/tool-handlers.ts';
    
    const toolsContent = fs.readFileSync(toolsPath, 'utf-8');
    const handlersContent = fs.readFileSync(handlersPath, 'utf-8');
    
    for (const tool of TOOLS) {
      if (!tool.name.startsWith('mittwald_')) continue;
      
      // Check if tool is imported in tools.ts
      if (!toolsContent.includes(tool.name)) {
        this.addIssue(tool.name, 'missing_import_tools', 'high', `Tool not imported in constants/tools.ts`);
      }
      
      // Check if handler is imported in tool-handlers.ts
      const handlerName = `handle${tool.name.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')}`;
      if (!handlersContent.includes(handlerName) && !handlersContent.includes(`handle${tool.name.replace(/^mittwald_/, '').split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')}`)) {
        this.addIssue(tool.name, 'missing_import_handler', 'medium', `Handler not imported in tool-handlers.ts`);
      }
    }
  }

  async writeReport(): Promise<void> {
    // Write CSV report
    const csvPath = 'evaluation-issues.csv';
    const csvHeader = 'tool_name,agent,severity,type,description,status\n';
    const csvContent = this.issues.map(issue => 
      `${issue.toolName},${issue.agent},${issue.severity},${issue.type},"${issue.description}",${issue.status}`
    ).join('\n');
    
    fs.writeFileSync(csvPath, csvHeader + csvContent);
    
    // Write markdown report
    const mdPath = 'evaluation-report.md';
    const mdContent = this.generateMarkdownReport();
    fs.writeFileSync(mdPath, mdContent);
    
    console.log(`\n📊 Validation complete!`);
    console.log(`   Issues found: ${this.issues.length}`);
    console.log(`   CSV report: ${csvPath}`);
    console.log(`   Markdown report: ${mdPath}`);
  }

  private generateMarkdownReport(): string {
    const stats = {
      total: this.issues.length,
      critical: this.issues.filter(i => i.severity === 'critical').length,
      high: this.issues.filter(i => i.severity === 'high').length,
      medium: this.issues.filter(i => i.severity === 'medium').length,
      low: this.issues.filter(i => i.severity === 'low').length,
    };

    const agentStats = {};
    this.issues.forEach(issue => {
      agentStats[issue.agent] = (agentStats[issue.agent] || 0) + 1;
    });

    return `# Tool Validation Report

Generated: ${new Date().toISOString()}

## Summary
- **Total Issues**: ${stats.total}
- **Critical**: ${stats.critical} (blocks compilation)
- **High**: ${stats.high} (tool won't work)  
- **Medium**: ${stats.medium} (tool works but has issues)
- **Low**: ${stats.low} (minor issues)

## Issues by Agent
${Object.entries(agentStats).map(([agent, count]) => `- **${agent}**: ${count} issues`).join('\n')}

## All Issues
${this.issues.length === 0 ? 'No issues found! 🎉' : ''}
${this.issues.map(issue => `
### ${issue.toolName}
- **Agent**: ${issue.agent}
- **Severity**: ${issue.severity}
- **Type**: ${issue.type}
- **Description**: ${issue.description}
- **Status**: ${issue.status}
`).join('\n')}
`;
  }

  getIssueCount(): number {
    return this.issues.length;
  }
}

async function main() {
  console.log('🚀 Starting tool validation...\n');
  
  const validator = new ToolValidator();
  
  await validator.validateToolDefinitions();
  await validator.validateHandlers();
  await validator.validateSchemas();
  await validator.validateSwitchCases();
  await validator.validateImports();
  await validator.writeReport();
  
  // Exit with error code if critical issues found
  const criticalIssues = validator.getIssueCount();
  if (criticalIssues > 0) {
    console.log(`\n❌ Found ${criticalIssues} issues that need attention`);
    process.exit(1);
  } else {
    console.log(`\n✅ All tools validated successfully!`);
    process.exit(0);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}