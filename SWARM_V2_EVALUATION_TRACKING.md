# Swarm V2 Evaluation Tracking System

## Overview
This document describes how we track and manage all required changes during the evaluation and merge process for 169 CLI tools.

## 1. Issue Tracking System

### 1.1 CSV-Based Issue Registry
```csv
agent_id,tool_name,issue_type,severity,description,status,resolution
```

Example entries:
```csv
3,mittwald_app_install_wordpress,missing_handler,critical,Handler function not implemented,open,
7,mittwald_cronjob_create,missing_schema,high,Zod schema not found in ToolSchemas,open,
14,mittwald_domain_virtualhost_list,type_mismatch,medium,Parameter name mismatch between schema and handler,fixed,Renamed no_header to noHeader
```

### 1.2 Issue Categories
- **missing_import**: Tool imported but file doesn't exist
- **missing_handler**: Handler function not implemented
- **missing_schema**: Zod schema missing in tool-handlers.ts
- **missing_switch**: Switch case missing in tool-handlers.ts
- **type_mismatch**: TypeScript type errors
- **parameter_mismatch**: CLI flag vs MCP parameter inconsistency
- **test_failure**: Tool fails during testing
- **documentation**: Missing or incorrect documentation

### 1.3 Severity Levels
- **critical**: Blocks compilation
- **high**: Tool won't work
- **medium**: Tool works but has issues
- **low**: Minor issues, cosmetic

## 2. Automated Tracking Scripts

### 2.1 Tool Validation Script
```typescript
// scripts/validate-tools.ts
import { TOOLS } from '../src/constants/tools';
import { ToolSchemas } from '../src/handlers/tool-handlers';
import * as fs from 'fs';
import * as path from 'path';

interface ValidationIssue {
  toolName: string;
  issues: string[];
}

async function validateTools(): Promise<void> {
  const issues: ValidationIssue[] = [];
  
  for (const tool of TOOLS) {
    const toolIssues: string[] = [];
    
    // Check 1: Tool definition file exists
    const definitionPath = `src/constants/tool/mittwald-cli/${getToolPath(tool.name)}.js`;
    if (!fs.existsSync(definitionPath)) {
      toolIssues.push(`Missing definition file: ${definitionPath}`);
    }
    
    // Check 2: Handler file exists
    const handlerPath = `src/handlers/tools/mittwald-cli/${getToolPath(tool.name)}.js`;
    if (!fs.existsSync(handlerPath)) {
      toolIssues.push(`Missing handler file: ${handlerPath}`);
    }
    
    // Check 3: Zod schema exists
    if (!ToolSchemas[tool.name]) {
      toolIssues.push(`Missing Zod schema in ToolSchemas`);
    }
    
    // Check 4: Switch case exists (requires parsing tool-handlers.ts)
    const switchCaseExists = await checkSwitchCase(tool.name);
    if (!switchCaseExists) {
      toolIssues.push(`Missing switch case in handleToolCall`);
    }
    
    if (toolIssues.length > 0) {
      issues.push({ toolName: tool.name, issues: toolIssues });
    }
  }
  
  // Write issues to CSV
  writeIssuesToCSV(issues);
}
```

### 2.2 Progress Dashboard Script
```bash
#!/bin/bash
# scripts/evaluation-dashboard.sh

echo "=== Swarm V2 Evaluation Dashboard ==="
echo ""

# Count tools by status
echo "Tool Implementation Status:"
echo "- Total tools: $(grep -c "mittwald_" src/constants/tools.ts)"
echo "- With handlers: $(find src/handlers/tools/mittwald-cli -name "*.js" | wc -l)"
echo "- With schemas: $(grep -c "mittwald_.*:" src/handlers/tool-handlers.ts | grep -v "//")"
echo ""

# Show issues by severity
echo "Issues by Severity:"
echo "- Critical: $(grep ",critical," evaluation-issues.csv | wc -l)"
echo "- High: $(grep ",high," evaluation-issues.csv | wc -l)"
echo "- Medium: $(grep ",medium," evaluation-issues.csv | wc -l)"
echo "- Low: $(grep ",low," evaluation-issues.csv | wc -l)"
echo ""

# Show issues by agent
echo "Issues by Agent:"
for i in {1..20}; do
  count=$(grep "^$i," evaluation-issues.csv | wc -l)
  if [ $count -gt 0 ]; then
    echo "- Agent $i: $count issues"
  fi
done
```

## 3. Manual Tracking Procedures

### 3.1 Agent Merge Checklist
For each agent merge:
```markdown
## Agent [NUMBER] Merge Checklist

### Pre-Merge
- [ ] Run TypeScript compilation
- [ ] Run linting
- [ ] Check all tool files exist
- [ ] Validate Zod schemas
- [ ] Check switch cases

### Issues Found
| Tool | Issue | Resolution |
|------|-------|------------|
| | | |

### Post-Merge
- [ ] All tests pass
- [ ] No new TypeScript errors
- [ ] Update master tracking sheet
```

### 3.2 Category Testing Log
```markdown
## Category: [CATEGORY_NAME]
Date: [DATE]
Tester: [NAME]

### Tools Tested
- [ ] tool_name_1 - Status: ✅/❌
- [ ] tool_name_2 - Status: ✅/❌

### Issues Found
1. Issue description
   - Tool: 
   - Severity:
   - Resolution:

### Performance Metrics
- Average response time:
- Memory usage:
```

## 4. Real-Time Tracking Tools

### 4.1 Git Hooks for Validation
```bash
# .git/hooks/pre-commit
#!/bin/bash
# Run validation before each commit

npm run validate-tools
if [ $? -ne 0 ]; then
  echo "Tool validation failed. Please fix issues before committing."
  exit 1
fi
```

### 4.2 VS Code Tasks
```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Validate Current Agent Tools",
      "type": "shell",
      "command": "npm run validate-agent ${input:agentNumber}",
      "problemMatcher": []
    },
    {
      "label": "Show Evaluation Dashboard",
      "type": "shell",
      "command": "./scripts/evaluation-dashboard.sh",
      "problemMatcher": []
    }
  ]
}
```

## 5. Issue Resolution Workflow

### 5.1 Automated Fixes
Some issues can be fixed automatically:
```typescript
// scripts/auto-fix-issues.ts
async function autoFixIssues(): Promise<void> {
  const issues = readIssuesFromCSV();
  
  for (const issue of issues) {
    switch (issue.type) {
      case 'missing_switch':
        await addSwitchCase(issue.toolName);
        break;
      case 'parameter_name_mismatch':
        await fixParameterNames(issue.toolName);
        break;
      // ... other auto-fixable issues
    }
  }
}
```

### 5.2 Manual Fix Tracking
For issues requiring manual intervention:
1. Create GitHub issue with label `swarm-v2-fix`
2. Assign to appropriate developer
3. Link to evaluation tracking sheet
4. Update CSV when resolved

## 6. Reporting and Metrics

### 6.1 Daily Progress Report
```bash
# Generate daily report
./scripts/generate-daily-report.sh > reports/$(date +%Y-%m-%d)-progress.md
```

### 6.2 Merge Readiness Score
Calculate readiness for each agent:
```
Readiness Score = (Tools with no issues / Total tools) * 100
```

### 6.3 Final Validation Report
Before final merge:
```markdown
## Final Validation Report

### Summary
- Total tools: 169
- Tools validated: 169
- Tools with issues: 0
- Test coverage: 85%

### Sign-offs
- [ ] TypeScript compilation: ✅
- [ ] Linting: ✅
- [ ] All tests pass: ✅
- [ ] Performance benchmarks: ✅
- [ ] Documentation complete: ✅

### Approval
Approved for merge by: [NAME]
Date: [DATE]
```

## Usage

1. **Before starting evaluation**: 
   ```bash
   npm run init-evaluation-tracking
   ```

2. **During evaluation**:
   ```bash
   npm run validate-tools
   npm run show-dashboard
   ```

3. **When fixing issues**:
   ```bash
   npm run auto-fix-issues
   npm run validate-tools
   ```

4. **Before merging**:
   ```bash
   npm run final-validation
   ```

This tracking system ensures no issues are missed during the evaluation and merge process.