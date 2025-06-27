# CLI INTERACTION HANDLING GUIDE

## Interactive Command Patterns

### 1. Detection Phase
During command analysis, identify ALL interactive elements:

```markdown
# In your analysis file, add section:
## Interactive Elements
- [ ] Confirmation prompts (y/n)
- [ ] Selection menus (choose from list)
- [ ] Text input prompts
- [ ] Password prompts
- [ ] Multi-step wizards
- [ ] Progress bars with user interruption
- [ ] --wait flags (blocks until condition)
```

### 2. Common Interactive Patterns

#### Pattern A: Confirmation Prompts
```typescript
// CLI Pattern:
const confirm = await this.confirm('Really delete project?');
if (!confirm) return;

// MCP Approach 1: Skip confirmation parameter
interface Args {
  projectId: string;
  skipConfirmation?: boolean;  // Default false
}

if (!args.skipConfirmation) {
  // Return confirmation request
  return formatToolResponse({
    status: "confirmation_required",
    message: "Really delete project?",
    confirmationData: {
      action: "delete_project",
      projectId: args.projectId
    }
  });
}

// MCP Approach 2: Force parameter
interface Args {
  projectId: string;
  force?: boolean;  // Like --force flag
}
```

#### Pattern B: Selection Menus
```typescript
// CLI Pattern:
const apps = await getApps();
const selected = await this.select('Choose app:', apps);

// MCP Approach: Require explicit selection
interface Args {
  appId?: string;  // If not provided, return list
}

if (!args.appId) {
  const apps = await mittwaldClient.api.app.listApps();
  return formatToolResponse({
    status: "selection_required",
    message: "Choose app",
    choices: apps.map(app => ({
      value: app.id,
      label: app.name,
      description: app.description
    }))
  });
}
```

#### Pattern C: Multi-Step Wizards
```typescript
// CLI Pattern:
const projectName = await this.input('Project name:');
const serverId = await this.select('Server:', servers);
const description = await this.input('Description (optional):');

// MCP Approach: All parameters upfront
interface Args {
  projectName: string;     // Required
  serverId: string;        // Required
  description?: string;    // Optional
}

// If any required missing, return what's needed:
const missing = [];
if (!args.projectName) missing.push({ field: 'projectName', prompt: 'Project name' });
if (!args.serverId) missing.push({ field: 'serverId', prompt: 'Server ID' });

if (missing.length > 0) {
  return formatToolResponse({
    status: "input_required",
    message: "Missing required fields",
    requiredFields: missing
  });
}
```

### 3. The --wait Parameter Pattern

#### Understanding --wait
```typescript
// CLI Pattern:
if (flags.wait) {
  await waitForCondition(
    () => checkIfReady(resourceId),
    { timeout: flags.waitTimeout || 300000 }
  );
}

// MCP Approaches:

// Approach 1: Async with polling info
interface Args {
  wait?: boolean;
  waitTimeoutSeconds?: number;  // Default 300
}

if (args.wait) {
  // Start operation
  const operationId = await startOperation();
  
  return formatToolResponse({
    status: "operation_started",
    message: "Operation started, polling required",
    result: {
      operationId,
      pollEndpoint: "mittwald_operation_status",
      pollInterval: 5000,  // 5 seconds
      timeout: args.waitTimeoutSeconds * 1000
    }
  });
}

// Approach 2: Implement actual waiting (careful with timeouts!)
if (args.wait) {
  const startTime = Date.now();
  const timeout = (args.waitTimeoutSeconds || 300) * 1000;
  
  while (Date.now() - startTime < timeout) {
    const status = await checkStatus();
    if (status === 'ready') {
      return formatToolResponse({
        message: "Operation completed",
        result: { status: 'ready' }
      });
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  throw new Error('Operation timed out');
}
```

### 4. Special Interactive Cases

#### Password Input
```typescript
// CLI Pattern:
const password = await this.password('Enter password:');

// MCP Approach: Direct parameter (handle securely!)
interface Args {
  password: string;  // Client responsible for secure input
}
```

#### File Selection
```typescript
// CLI Pattern:
const file = await this.selectFile('Choose backup file:');

// MCP Approach: Accept file content
interface Args {
  backupFileContent: string;  // Base64 encoded
  backupFileName: string;
}
```

### 5. Non-Interactive Flags

Look for CLI flags that skip interaction:
- `--yes` / `-y` : Skip confirmations
- `--force` / `-f` : Force operation
- `--quiet` / `-q` : No prompts
- `--non-interactive` : Full automation mode

When these exist, use them as guidance for MCP design!

### 6. Documentation Template

For EACH interactive command, document:

```markdown
## Command: app create

### Interactive Elements
1. **Project Selection**: If no --project-id provided
   - CLI: Shows project picker
   - MCP: Require projectId parameter

2. **App Selection**: 
   - CLI: Shows app type menu
   - MCP: Require appId parameter

3. **Configuration Wizard**:
   - CLI: Prompts for each config value
   - MCP: Accept all config in userInputs array

### Non-Interactive Usage
`mw app create --project-id X --app-id Y --user-input key=value`

### MCP Parameter Mapping
- All interactive prompts → Required parameters
- Optional prompts → Optional parameters
- Confirmations → skipConfirmation: boolean
```

### 7. Complex Interaction Patterns

#### Dynamic Forms
```typescript
// CLI: Form fields depend on previous answers
// MCP: May need multiple tools

// Tool 1: Get form schema
mittwald_app_get_install_options({ appId }) → returns required fields

// Tool 2: Actual install with fields
mittwald_app_install({ appId, projectId, userInputs: [...] })
```

#### Retry Loops
```typescript
// CLI: Retry on failure with user prompt
// MCP: Return error with retry info
return formatToolResponse({
  status: "error",
  message: "Operation failed",
  error: {
    type: "RETRYABLE_ERROR",
    retryable: true,
    suggestedDelay: 5000
  }
});
```

### 8. Decision Matrix

When encountering interaction, decide:

1. **Can it be parameterized?** → Add parameter
2. **Is it a selection?** → Return choices or require ID
3. **Is it confirmation?** → Add skip/force parameter
4. **Is it multi-step?** → Require all inputs upfront
5. **Is it truly interactive?** → Document limitation

### 9. Registry Tracking

Add interaction info to registry:
```csv
command_path,mcp_tool_name,cli_implementation_path,status,implementation_file,test_file,errors,completion_time,interaction_notes
app/create,mittwald_app_create,/cli/src/commands/app/create.tsx,completed,src/handlers/tools/mittwald-cli/app/create.ts,tests/app/create.test.ts,"","2024-01-10T14:00:00Z","Has wizard - converted to required params"
```

### 10. Testing Interactive Conversions

For each interactive → non-interactive conversion:

1. Test with all parameters provided
2. Test with missing required parameters
3. Verify error messages guide user
4. Compare output with CLI non-interactive mode

Remember: MCP tools are inherently non-interactive, so every interaction must be converted to parameters or multi-step flows!