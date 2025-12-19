# Eval Fixture Pattern: Cross-Tier Resource Sharing

## Problem

Tier 4 tools (app/get, cronjob/delete, etc.) need resource IDs from tier 0-3 creates, but agents are using test IDs like `"test-domain-id"` instead of real IDs.

## Solution: Shared Fixtures Context

### Pattern for Agents Executing Evals:

#### 1. **Read Existing Fixtures** (Start of WP)
```typescript
// Load fixtures from shared context
const fixtures = JSON.parse(
  fs.readFileSync('evals/fixtures/runtime-fixtures.json', 'utf-8')
);
```

#### 2. **Create Resources (Tier 0-3)**
```typescript
// Example: Creating a cronjob (tier 3)
const cronjob = await mcp__mittwald__mittwald_cronjob_create({
  description: "Eval test cronjob",
  interval: "0 0 * * *",
  installationId: fixtures.appInstallationId,
  url: "https://httpbin.org/status/200"
});

// SAVE the ID to fixtures
fixtures.cronjobs = fixtures.cronjobs || [];
fixtures.cronjobs.push({
  id: cronjob.data.id,
  description: "Eval test cronjob",
  createdDuringEval: true
});

// Write back to fixtures file
fs.writeFileSync('evals/fixtures/runtime-fixtures.json', JSON.stringify(fixtures, null, 2));
```

#### 3. **Use Real IDs (Tier 4)**
```typescript
// Example: Getting cronjob details
const cronjobId = fixtures.cronjobs[0].id; // Use real ID from fixtures
const details = await mcp__mittwald__mittwald_cronjob_get({
  cronjobId: cronjobId // NOT "test-cronjob-id"
});
```

#### 4. **Cleanup (End of WP)**
```typescript
// Delete resources created during eval
for (const cronjob of fixtures.cronjobs.filter(c => c.createdDuringEval)) {
  await mcp__mittwald__mittwald_cronjob_delete({
    cronjobId: cronjob.id,
    confirm: true
  });
}
```

## Fixtures File Structure

**Location**: `evals/fixtures/runtime-fixtures.json`

```json
{
  "projectId": "fd1ef726-14b8-4906-8a45-0756ba993246",
  "orgId": "0080fa08-4f75-4825-9210-2a4eb9a09bea",

  "cronjobs": [
    {
      "id": "460224d7-c47c-4883-9961-e1a92ce7bb43",
      "description": "Test cronjob",
      "createdDuringEval": true
    }
  ],

  "backupSchedules": [
    {
      "id": "453f3880-3772-4d76-8fcb-14e6db346160",
      "description": "Eval test schedule",
      "createdDuringEval": true
    }
  ],

  "registries": [
    {
      "id": "77fbfc30-0e48-405a-8d70-80b34995dda5",
      "description": "GitHub Container Registry",
      "createdDuringEval": false
    }
  ]
}
```

## Updated Eval Prompt Template

### For CREATE operations (Tier 0-3):
```markdown
## Task
Execute the tool and CAPTURE the created resource ID:

1. Call the MCP tool
2. Extract the resource ID from the response
3. Save to evals/fixtures/runtime-fixtures.json for use by dependent evals
4. Mark as createdDuringEval: true for cleanup

Example:
```
const result = await mcp__mittwald__mittwald_cronjob_create({...});
const fixtures = JSON.parse(fs.readFileSync('evals/fixtures/runtime-fixtures.json'));
fixtures.cronjobs.push({ id: result.data.id, createdDuringEval: true });
fs.writeFileSync('evals/fixtures/runtime-fixtures.json', JSON.stringify(fixtures));
```
```

### For GET/UPDATE/DELETE operations (Tier 4):
```markdown
## Task
Execute the tool using a REAL resource ID:

1. Read evals/fixtures/runtime-fixtures.json
2. Use an existing resource ID (NOT "test-*-id")
3. Call the MCP tool with the real ID

Example:
```
const fixtures = JSON.parse(fs.readFileSync('evals/fixtures/runtime-fixtures.json'));
const cronjobId = fixtures.cronjobs[0].id;
const result = await mcp__mittwald__mittwald_cronjob_get({ cronjobId });
```
```

### For DELETE operations:
```markdown
**IMPORTANT**: Use confirm: true for destructive operations.

Example:
```
await mcp__mittwald__mittwald_cronjob_delete({
  cronjobId: realId,
  confirm: true  // Required for deletion
});
```
```

## Benefits

1. **No test IDs**: Uses real resources from the project
2. **Proper dependencies**: Lower tiers create resources for higher tiers
3. **Cleanup**: Resources marked createdDuringEval get deleted
4. **Reusable**: Same fixtures across multiple eval runs
5. **Discoverable**: List operations populate initial fixtures

## Implementation Checklist

- [ ] Copy test-fixtures.json to runtime-fixtures.json
- [ ] Update tier 0-3 eval prompts to SAVE created resource IDs
- [ ] Update tier 4 eval prompts to READ and USE real IDs
- [ ] Add cleanup step at end of each WP execution
- [ ] Test with single domain WP first
- [ ] Roll out to all 12 domains
