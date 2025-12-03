---
work_package_id: "WP04"
subtasks:
  - "T022"
  - "T023"
  - "T024"
  - "T025"
  - "T026"
title: "CLI Shell Injection Prevention"
phase: "Phase 2 - Security Hardening (P1)"
lane: "doing"
assignee: "claude"
agent: "claude"
shell_pid: "82591"
history:
  - timestamp: "2025-12-03T14:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-03T15:42:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "82591"
    action: "Started implementation - CLI Shell Injection Prevention"
---

# Work Package Prompt: WP04 – CLI Shell Injection Prevention

## Objectives & Success Criteria

- **Primary Objective**: Eliminate shell injection attack surface by using execFile with argument arrays
- **Success Criteria**:
  - CLI wrapper uses execFile() instead of exec()
  - All arguments passed as array, no string concatenation
  - Shell metacharacters treated as literal strings
  - Existing MCP tool functionality preserved

## Context & Constraints

- **Spec Reference**: `kitty-specs/003-december-2025-security/spec.md` - User Story 4, FR-008
- **Research**: `kitty-specs/003-december-2025-security/research.md` - Section 3 (shell safety)

**Architectural Constraints**:
- Use `child_process.execFile()` which bypasses shell
- Arguments passed as array, not concatenated string
- No `shell: true` option in spawn/exec calls
- Maintain timeout and output capture functionality

## Subtasks & Detailed Guidance

### Subtask T022 – Audit cli-wrapper.ts

**Purpose**: Identify all shell invocation patterns that need refactoring.

**Steps**:
1. Open `src/utils/cli-wrapper.ts`
2. Search for uses of `exec()`, `execSync()`, `spawn()`, `spawnSync()`
3. Document each call site:
   - Is command string or array?
   - Is shell: true option used?
   - How are arguments constructed?
4. Note any helper functions that build command strings
5. Check for template literals with user input

**Files**:
- REVIEW: `src/utils/cli-wrapper.ts`
- REVIEW: `src/utils/session-aware-cli.ts` (if exists)
- REVIEW: Any other files importing child_process

**Deliverable**:
```markdown
## Audit Results
- [ ] exec() call at line X: string concat with ${userInput}
- [ ] spawn() call at line Y: uses shell: true
- [ ] etc.
```

### Subtask T023 – Refactor to execFile

**Purpose**: Replace vulnerable patterns with execFile and argument arrays.

**Steps**:
1. Replace `exec(command, options, callback)` with:
   ```typescript
   execFile(executable, args, options, callback)
   ```
2. Replace `execSync(command, options)` with:
   ```typescript
   execFileSync(executable, args, options)
   ```
3. Replace `spawn(command, { shell: true })` with:
   ```typescript
   spawn(executable, args)
   ```
4. For the `mw` CLI, pattern should be:
   ```typescript
   import { execFile } from 'child_process';

   function executeCliCommand(args: string[], options: ExecOptions): Promise<string> {
     return new Promise((resolve, reject) => {
       execFile('mw', args, options, (error, stdout, stderr) => {
         if (error) {
           reject(new CliError(error.message, stderr));
           return;
         }
         resolve(stdout);
       });
     });
   }
   ```

**Files**:
- MODIFY: `src/utils/cli-wrapper.ts`

**Notes**:
- execFile does NOT invoke shell - arguments passed directly to executable
- No need to escape or quote arguments

### Subtask T024 – Update all CLI invocation call sites

**Purpose**: Ensure all callers pass arguments as arrays.

**Steps**:
1. Search codebase for calls to cli-wrapper functions
2. For each call site, change from:
   ```typescript
   // BEFORE (vulnerable)
   await executeCli(`app list --project-id ${projectId}`);
   ```
   To:
   ```typescript
   // AFTER (safe)
   await executeCli(['app', 'list', '--project-id', projectId]);
   ```
3. Update function signatures if needed to accept string[]
4. Check handlers in `src/handlers/tools/mittwald-cli/`

**Files**:
- MODIFY: Multiple files in `src/handlers/tools/mittwald-cli/`
- MODIFY: `src/tools/cli-adapter.ts` (if exists)

**Parallel?**: Yes - different handler files can be updated in parallel

**Notes**:
- Each tool handler likely builds its own argument list
- Ensure no string concatenation in argument values

### Subtask T025 – Remove shell: true options

**Purpose**: Ensure no spawn/exec calls use shell option.

**Steps**:
1. Search for `shell: true` or `shell:true` in codebase
2. Remove or set to `shell: false` explicitly
3. If shell features were needed (pipes, redirects), refactor:
   - Pipes: Use Node streams instead
   - Redirects: Handle in Node, not shell
4. Document any cases that legitimately need shell

**Files**:
- MODIFY: Any files with `shell: true`

**Notes**:
- shell: true defeats the security of execFile
- Most use cases don't actually need shell features

### Subtask T026 – Create fuzzing tests

**Purpose**: Verify shell injection is not possible.

**Steps**:
1. Create `tests/security/shell-injection.test.ts`
2. Test with injection payloads:
   ```typescript
   const INJECTION_PAYLOADS = [
     '; rm -rf /',
     '| cat /etc/passwd',
     '$(whoami)',
     '`id`',
     '\n',
     '\r\n',
     '--help',  // Flag injection
     '-',       // Stdin redirect
     '--',      // End of options
     '${PATH}',
     '$HOME',
     '&&echo pwned',
     '||echo pwned',
   ];
   ```
3. For each payload, verify it's passed as literal string:
   ```typescript
   it('treats shell metacharacters as literal strings', async () => {
     for (const payload of INJECTION_PAYLOADS) {
       // Call CLI wrapper with payload as argument
       // Verify payload was passed literally (not interpreted)
       // Check that no unexpected command execution occurred
     }
   });
   ```
4. Verify error messages don't leak injection strings

**Files**:
- CREATE: `tests/security/shell-injection.test.ts`

**Notes**:
- Tests should run against actual execFile implementation
- May need mock CLI or special test mode
- Consider using safe test payloads that verify behavior without risk

## Test Strategy

**Required Tests**:
- Shell injection fuzzing tests (T026)
- Integration tests to verify MCP tools still work

**Test Commands**:
```bash
npm run test:security -- shell-injection
npm run test:integration  # Verify existing functionality
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing CLI functionality | Run full test suite after changes |
| Different behavior between platforms | Test on Linux (production platform) |
| Edge cases in argument parsing | Include diverse payloads in fuzzing |

## Definition of Done Checklist

- [ ] All exec/execSync replaced with execFile/execFileSync
- [ ] All spawn calls use array arguments without shell: true
- [ ] All CLI invocation call sites pass arguments as arrays
- [ ] No string concatenation for building commands
- [ ] Fuzzing tests pass
- [ ] Existing MCP tools still work

## Review Guidance

- Verify no `exec()` or `execSync()` calls remain
- Verify no `shell: true` options remain
- Check that argument arrays don't use string interpolation
- Run actual MCP tool invocations to verify functionality
- Review fuzzing test coverage

## Activity Log

- 2025-12-03T14:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
