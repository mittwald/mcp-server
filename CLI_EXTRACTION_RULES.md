# CLI EXTRACTION RULES FOR PERFECT ACCURACY

## CRITICAL EXTRACTION PATTERNS

### 1. Command Class Structure
```typescript
// Look for these patterns in CLI files:
export class {CommandName} extends {BaseCommand} {
  static description = "..."; // → Use for MCP tool description
  static flags = {
    // These become MCP parameters
    'project-id': Flags.string({
      description: '...',
      required: true  // → Required in MCP
    }),
    'output': Flags.string({
      options: ['json', 'yaml'],  // → Enum in MCP
      default: 'json'  // → Default in MCP
    })
  };
  static args = {
    'app-id': Args.string({
      required: true,  // → Required parameter
      description: '...'
    })
  };
}
```

### 2. API Call Patterns

#### Pattern A: Direct API Calls
```typescript
// CLI Code:
const response = await context.api.app.listAppinstallations({
  projectId: flags['project-id'],
  queryParameters: {
    limit: flags.limit,
    skip: flags.skip
  }
});

// MCP Implementation:
const response = await mittwaldClient.api.app.listAppinstallations({
  projectId: args.projectId,  // Note: camelCase conversion
  queryParameters: {
    limit: args.limit,
    skip: args.skip
  }
});
```

#### Pattern B: Wrapped API Calls
```typescript
// CLI might use helpers:
const app = await getAppFromUuid(context, args['app-id']);

// You need to find getAppFromUuid implementation:
export async function getAppFromUuid(context, appId) {
  const response = await context.api.app.getApp({ appId });
  return response.data;
}

// MCP: Inline the helper logic
const response = await mittwaldClient.api.app.getApp({ appId: args.appId });
const app = response.data;
```

### 3. Business Logic Patterns

#### Pattern A: Validation
```typescript
// CLI:
if (!flags['project-id'] && !context.currentProject) {
  throw new Error('No project selected');
}
const projectId = flags['project-id'] || context.currentProject;

// MCP: Simplify (no context.currentProject in MCP):
if (!args.projectId) {
  throw new Error('Project ID is required');
}
```

#### Pattern B: Data Processing
```typescript
// CLI: Often formats for display
const rows = installations.map(inst => ({
  ID: inst.id,
  Name: inst.description,
  Status: inst.status
}));
printTable(rows);

// MCP: Return raw data + formatted view
return {
  installations: installations,  // Raw data
  tableView: installations.map(inst => ({  // Formatted view
    id: inst.id,
    name: inst.description,
    status: inst.status
  }))
};
```

### 4. Error Handling Patterns

#### Pattern A: Specific Errors
```typescript
// CLI:
if (response.status === 404) {
  throw new Error(`App ${appId} not found`);
}

// MCP: Preserve exact error messages
if (response.status === 404) {
  throw new Error(`App ${args.appId} not found`);
}
```

#### Pattern B: Generic Errors
```typescript
// CLI:
} catch (err) {
  this.error(err.message);
}

// MCP:
} catch (error) {
  return formatToolResponse({
    status: "error",
    message: error.message,  // Preserve CLI message
    error: {
      type: "CLI_ERROR",
      details: error
    }
  });
}
```

### 5. Special CLI Features to MCP Mappings

#### Progress Indicators
```typescript
// CLI:
const progress = new Progress(items.length);
for (const item of items) {
  await processItem(item);
  progress.increment();
}

// MCP: Return progress in result
const results = [];
for (let i = 0; i < items.length; i++) {
  results.push(await processItem(items[i]));
  // Could emit progress via streaming if needed
}
return {
  results,
  totalProcessed: items.length
};
```

#### Interactive Prompts
```typescript
// CLI:
const confirmed = await confirm('Delete app?');
if (!confirmed) return;

// MCP: Add confirmation parameter
interface Args {
  appId: string;
  skipConfirmation?: boolean;  // Add this
}
// Or return confirmation request for client to handle
```

#### File Operations
```typescript
// CLI:
const content = await fs.readFile(flags.file);

// MCP: Accept content directly
interface Args {
  fileContent: string;  // Instead of file path
}
```

### 6. Complex Command Patterns

#### Subcommand Routing
```typescript
// CLI: mw database mysql user list
// Look for command structure:
export class Database extends BaseCommand {
  static subcommands = {
    mysql: MySQL,
    redis: Redis
  };
}

export class MySQL extends BaseCommand {
  static subcommands = {
    user: MySQLUser,
    database: MySQLDatabase
  };
}

export class MySQLUser extends BaseCommand {
  static subcommands = {
    list: MySQLUserList,
    create: MySQLUserCreate
  };
}

// MCP: Flatten to single tool
mittwald_database_mysql_user_list
```

### 7. Authentication Patterns

#### CLI Context
```typescript
// CLI has implicit auth:
const context = await this.getContext();
const api = context.api;

// MCP: Use mittwaldClient from context
const { mittwaldClient } = context;
```

### 8. Output Format Patterns

#### JSON Output
```typescript
// CLI:
if (flags.output === 'json') {
  console.log(JSON.stringify(data));
}

// MCP: Always return structured data
return formatToolResponse({
  result: data
});
```

#### Table Output
```typescript
// CLI:
printTable(columns, rows);

// MCP:
return {
  columns: ['ID', 'Name', 'Status'],
  rows: data.map(formatRow),
  rawData: data
};
```

## EXTRACTION CHECKLIST

For EVERY command, extract:

1. **Command Metadata**
   - [ ] Full command path (mw app list)
   - [ ] Description from static property
   - [ ] Help text if available

2. **Parameters**
   - [ ] All flags with types
   - [ ] All args with types
   - [ ] Required vs optional
   - [ ] Default values
   - [ ] Validation rules
   - [ ] Enum options

3. **API Calls**
   - [ ] Service name (app, database, etc.)
   - [ ] Method name
   - [ ] Parameter structure
   - [ ] Response handling

4. **Business Logic**
   - [ ] Pre-processing steps
   - [ ] Validation logic
   - [ ] Data transformation
   - [ ] Post-processing

5. **Error Cases**
   - [ ] Validation errors
   - [ ] API errors
   - [ ] Business logic errors
   - [ ] Error messages (exact text)

6. **Output Structure**
   - [ ] Success response format
   - [ ] Data included in response
   - [ ] Display formatting hints

## COMMON PITFALLS TO AVOID

1. **Don't assume parameter names** - Check exact flag/arg names
2. **Don't skip helper functions** - Trace all function calls
3. **Don't simplify error messages** - Keep exact wording
4. **Don't omit edge cases** - Include all conditional logic
5. **Don't reorganize logic** - Keep same execution order

## VALIDATION QUESTIONS

Before implementing each tool, answer:

1. What is the EXACT command syntax?
2. What are ALL the parameters and their types?
3. What API endpoints does it call?
4. What validation does it perform?
5. What errors can it throw?
6. What data does it return?
7. Are there any side effects?
8. Are there any special features (progress, prompts, etc.)?

Document answers in your analysis file before coding!