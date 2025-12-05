---
work_package_id: "WP06"
subtasks:
  - "T036"
  - "T037"
  - "T038"
  - "T039"
  - "T040"
  - "T041"
title: "Use Case Loader and Validator"
phase: "Phase 2 - Core Infrastructure"
lane: "for_review"
assignee: ""
agent: "claude"
shell_pid: "6568"
history:
  - timestamp: "2025-12-05T10:15:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-05T10:48:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "6568"
    action: "Started implementation"
  - timestamp: "2025-12-05T10:52:00Z"
    lane: "for_review"
    agent: "claude"
    shell_pid: "6568"
    action: "Completed implementation - ready for review"
---

# Work Package Prompt: WP06 – Use Case Loader and Validator

## Objectives & Success Criteria

- Load use case definitions from JSON files in use-case-library/
- Validate each file against Zod schema from WP04
- Support filtering by domain, priority, and tags
- Report validation errors with file paths

**Success Metric**: Can load all use cases from library and report validation status

## Context & Constraints

### Prerequisites
- WP04: Use Case Type Definitions (Zod schemas)
- WP05: Use Case Library (JSON files to load)

### Key References
- `tests/functional/src/use-cases/types.ts` - Zod schemas
- `tests/functional/use-case-library/` - JSON files

### Constraints
- Continue on validation errors (don't fail on first)
- Return both valid use cases and error report
- Support incremental loading

## Subtasks & Detailed Guidance

### Subtask T036 – Create loader.ts with loadUseCases() function

- **Purpose**: Main entry point for loading use cases.

- **Steps**:
  1. Create `tests/functional/src/use-cases/loader.ts`
  2. Implement `loadUseCases(options?: LoaderOptions): Promise<LoadResult>`
  3. Return array of valid use cases and any errors
  4. Export types and function

- **Files**:
  - Create: `tests/functional/src/use-cases/loader.ts`

- **Parallel?**: No (foundational)

- **Example**:
```typescript
import { UseCase, UseCaseDomain } from './types';

export interface LoaderOptions {
  domain?: UseCaseDomain;
  priority?: 'P1' | 'P2' | 'P3';
  tags?: string[];
}

export interface LoadResult {
  useCases: UseCase[];
  errors: LoadError[];
}

export interface LoadError {
  filePath: string;
  message: string;
  details?: unknown;
}

export async function loadUseCases(options?: LoaderOptions): Promise<LoadResult> {
  // Implementation
}
```

### Subtask T037 – Implement directory scanning for use-case-library/

- **Purpose**: Discover all JSON files in the library structure.

- **Steps**:
  1. Use fs/promises for async file operations
  2. Scan `tests/functional/use-case-library/` recursively
  3. Find all `.json` files (excluding README.md)
  4. Return array of file paths

- **Files**:
  - Modify: `tests/functional/src/use-cases/loader.ts`

- **Parallel?**: No (part of load flow)

- **Example**:
```typescript
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

async function scanLibrary(basePath: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(basePath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(basePath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await scanLibrary(fullPath));
    } else if (entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }

  return files;
}
```

### Subtask T038 – Validate each JSON against Zod schema

- **Purpose**: Ensure all loaded use cases match expected structure.

- **Steps**:
  1. Read JSON file content
  2. Parse with JSON.parse (catch parse errors)
  3. Validate with UseCaseSchema.safeParse()
  4. Collect errors with file path context

- **Files**:
  - Modify: `tests/functional/src/use-cases/loader.ts`

- **Parallel?**: No

- **Example**:
```typescript
import { UseCaseSchema } from './types';

async function loadAndValidate(filePath: string): Promise<UseCase | LoadError> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const json = JSON.parse(content);
    const result = UseCaseSchema.safeParse(json);

    if (result.success) {
      return result.data;
    } else {
      return {
        filePath,
        message: 'Schema validation failed',
        details: result.error.issues
      };
    }
  } catch (error) {
    return {
      filePath,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

### Subtask T039 – Implement filtering by domain, priority, tags

- **Purpose**: Allow selective loading for targeted execution.

- **Steps**:
  1. After loading, filter by domain if specified
  2. Filter by priority if specified
  3. Filter by tags (any match)
  4. Return filtered array

- **Files**:
  - Modify: `tests/functional/src/use-cases/loader.ts`

- **Parallel?**: Yes (separate concern)

- **Example**:
```typescript
function filterUseCases(useCases: UseCase[], options: LoaderOptions): UseCase[] {
  let filtered = useCases;

  if (options.domain) {
    filtered = filtered.filter(uc => uc.domain === options.domain);
  }

  if (options.priority) {
    filtered = filtered.filter(uc => uc.priority === options.priority);
  }

  if (options.tags?.length) {
    filtered = filtered.filter(uc =>
      options.tags!.some(tag => uc.tags.includes(tag))
    );
  }

  return filtered;
}
```

### Subtask T040 – Add validation error reporting with file paths

- **Purpose**: Help users fix broken use case files.

- **Steps**:
  1. Collect all errors during loading
  2. Format errors with clear file paths
  3. Include Zod error details for schema issues
  4. Provide summary count

- **Files**:
  - Modify: `tests/functional/src/use-cases/loader.ts`

- **Parallel?**: Yes

- **Example Output**:
```
Loading use cases from tests/functional/use-case-library/

Validation Errors:
  ✗ apps/apps-001-deploy-php-app.json
    - prompt: Required field missing
  ✗ databases/databases-002-create-backup.json
    - timeout: Expected number, received string

Summary: 8 valid, 2 errors
```

### Subtask T041 – Create loadSingleUseCase() for targeted execution

- **Purpose**: Load one specific use case by ID or path.

- **Steps**:
  1. Implement `loadSingleUseCase(idOrPath: string): Promise<UseCase>`
  2. If path, load directly
  3. If ID, scan and find matching use case
  4. Throw if not found

- **Files**:
  - Modify: `tests/functional/src/use-cases/loader.ts`

- **Parallel?**: No

- **Example**:
```typescript
export async function loadSingleUseCase(idOrPath: string): Promise<UseCase> {
  if (idOrPath.endsWith('.json')) {
    // Direct file path
    const result = await loadAndValidate(idOrPath);
    if ('id' in result) return result;
    throw new Error(`Failed to load: ${result.message}`);
  }

  // Search by ID
  const { useCases, errors } = await loadUseCases();
  const match = useCases.find(uc => uc.id === idOrPath);
  if (match) return match;
  throw new Error(`Use case not found: ${idOrPath}`);
}
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Large number of files slows loading | Load in parallel with Promise.all |
| JSON parse errors unclear | Include file path and line number if possible |
| Schema changes break existing files | Version schema, provide migration path |

## Definition of Done Checklist

- [ ] T036: loadUseCases() function created
- [ ] T037: Directory scanning works recursively
- [ ] T038: Zod validation catches schema errors
- [ ] T039: Filtering by domain/priority/tags works
- [ ] T040: Error reporting includes file paths
- [ ] T041: loadSingleUseCase() works by ID and path
- [ ] All 10 use cases from WP05 load successfully
- [ ] TypeScript compiles without errors

## Review Guidance

- **Key Checkpoint**: Load all use cases and verify count/filtering
- **Verify**: Errors include actionable file paths
- **Verify**: Filtering produces correct subsets
- **Look For**: Edge cases with missing/malformed files

## Activity Log

- 2025-12-05T10:15:00Z – system – lane=planned – Prompt created.
- 2025-12-05T10:48:00Z – claude – shell_pid=6568 – lane=doing – Started implementation
- 2025-12-05T10:52:00Z – claude – shell_pid=6568 – lane=for_review – Completed: loader.ts with loadUseCases(), loadSingleUseCase(), filtering, error reporting; 17 unit tests passing
