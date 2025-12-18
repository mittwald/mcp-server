---
work_package_id: WP01
title: Library Package Extraction
lane: done
history:
- timestamp: '2025-12-18T06:00:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
agent: codex
assignee: Claude Sonnet 4.5
phase: Foundational
review_status: ''
reviewed_by: ''
shell_pid: '84179'
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
- T008
---

# Work Package Prompt: WP01 – Library Package Extraction

## ⚠️ IMPORTANT: Review Feedback Status

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_status` field above. If it says `has_feedback`, scroll to the **Review Feedback** section immediately (right below this notice).
- **You must address all feedback** before your work is complete. Feedback items are your implementation TODO list.
- **Mark as acknowledged**: When you understand the feedback and begin addressing it, update `review_status: acknowledged` in the frontmatter.
- **Report progress**: As you address each feedback item, update the Activity Log explaining what you changed.

---

## Review Feedback

> **Populated by `/spec-kitty.review`** – Reviewers add detailed feedback here when work needs changes. Implementation must address every item listed below before returning for re-review.

*[This section is empty initially. Reviewers will populate it if the work is returned from review. If you see feedback here, treat each item as a must-do before completion.]*

---

## Markdown Formatting
Wrap HTML/XML tags in backticks: `` `<div>` ``, `` `<script>` ``
Use language identifiers in code blocks: ````python`, ````bash`

---

## Objectives & Success Criteria

Extract business logic from `@mittwald/cli` into monorepo package `packages/mittwald-cli-core/`, ready for library function development.

**Success Criteria (Gate 1):**
- [ ] `packages/mittwald-cli-core/` created with `src/lib/` copied
- [ ] Installer instances relocated to `src/installers/`
- [ ] Circular imports resolved (lib no longer imports from commands/)
- [ ] package.json configured with correct dependencies
- [ ] TypeScript builds without errors
- [ ] All lib exports accessible via `import { ... } from '@mittwald-mcp/cli-core'`

## Context & Constraints

**Problem:** MCP server spawns `mw` CLI processes, causing concurrent user failures. CLI contains ~101 files of business logic in `src/lib/` that must be preserved.

**Solution:** Extract `src/lib/` only (skip 94 CLI command wrappers). Minor refactor to relocate installer instances from command files.

**Key Architectural Decision:**
- CLI already cloned at `~/Code/mittwald-cli`
- Extract lib only, not full CLI clone
- Installer instances currently in `commands/*/create|install/*.tsx` must move to library package

**References:**
- Plan: `kitty-specs/012-convert-mittwald-cli/plan.md` (Phase 0: Research, CLI Internal Structure Analysis)
- Spec: `kitty-specs/012-convert-mittwald-cli/spec.md` (FR-001 to FR-003)

**Constraints:**
- Must preserve all business logic (no refactoring of lib internals)
- Must resolve circular imports (lib files currently import from commands/)
- TypeScript must compile cleanly (target ES2022, strict mode)

---

## Subtasks & Detailed Guidance

### Subtask T001 – Create package directory structure
**Purpose:** Set up directory hierarchy for library package

**Steps:**
1. Navigate to repo root: `cd /Users/robert/Code/mittwald-mcp`
2. Create directory structure:
   ```bash
   mkdir -p packages/mittwald-cli-core/src/lib
   mkdir -p packages/mittwald-cli-core/src/installers
   mkdir -p packages/mittwald-cli-core/dist
   ```
3. Verify structure exists:
   ```bash
   ls -la packages/mittwald-cli-core/
   ```

**Files:**
- Create: `packages/mittwald-cli-core/src/lib/` (directory)
- Create: `packages/mittwald-cli-core/src/installers/` (directory)

**Parallel?** Can run in parallel with T003

**Notes:** None

---

### Subtask T002 – Copy lib directory from CLI source
**Purpose:** Extract business logic from cloned CLI repository

**Steps:**
1. Verify CLI clone exists:
   ```bash
   ls ~/Code/mittwald-cli/src/lib
   ```
2. Copy entire lib directory:
   ```bash
   cp -r ~/Code/mittwald-cli/src/lib/* packages/mittwald-cli-core/src/lib/
   ```
3. Verify copy successful:
   ```bash
   find packages/mittwald-cli-core/src/lib -name "*.ts" | wc -l
   # Should show ~101 files
   ```

**Files:**
- Copy: `~/Code/mittwald-cli/src/lib/*` → `packages/mittwald-cli-core/src/lib/`

**Parallel?** Sequential after T001

**Notes:** This copies ~101 TypeScript files containing all business logic

---

### Subtask T003 – Identify installer instances in CLI command files
**Purpose:** Locate installer instances that need relocation

**Steps:**
1. Search for installer exports in CLI commands:
   ```bash
   cd ~/Code/mittwald-cli
   grep -r "new AppInstaller" src/commands/ | grep export
   grep -r "Installer(" src/commands/ | grep export
   ```
2. Document findings (expected locations):
   - `src/commands/app/create/php.tsx` → `phpInstaller`
   - `src/commands/app/create/node.tsx` → `nodeInstaller`
   - `src/commands/app/create/python.tsx` → `pythonInstaller`
   - `src/commands/app/create/static.tsx` → `staticInstaller`
   - `src/commands/app/install/*.tsx` → various app installers (wordpress, shopware, etc.)
3. Create list of installer instances to extract

**Files:**
- Read: `~/Code/mittwald-cli/src/commands/app/create/*.tsx`
- Read: `~/Code/mittwald-cli/src/commands/app/install/*.tsx`

**Parallel?** Can run in parallel with T001-T002

**Notes:** Installers are configuration objects, not command classes. Pattern: `export const phpInstaller = new AppInstaller(...)`

---

### Subtask T004 – Extract installer instances to library
**Purpose:** Move installer instances from command files to library package

**Steps:**
1. For each installer found in T003:
   - Copy installer export code from command file
   - Create corresponding file in `packages/mittwald-cli-core/src/installers/`
   - Example: `php.ts`, `node.ts`, `python.ts`, `wordpress.ts`, etc.
2. Example extraction (`php.tsx` → `php.ts`):
   ```typescript
   // packages/mittwald-cli-core/src/installers/php.ts
   import { AppInstaller } from '../lib/resources/app/Installer.js';

   export const phpInstaller = new AppInstaller(
     "34220303-cb87-4592-8a95-2eb20a97b2ac",
     "custom PHP",
     ["document-root", "site-title"] as const,
   );
   ```
3. Verify all installers extracted (count should match T003 findings)

**Files:**
- Create: `packages/mittwald-cli-core/src/installers/php.ts`
- Create: `packages/mittwald-cli-core/src/installers/node.ts`
- Create: `packages/mittwald-cli-core/src/installers/python.ts`
- Create: `packages/mittwald-cli-core/src/installers/wordpress.ts`
- (... and others found in T003)

**Parallel?** Sequential after T003

**Notes:** Only extract the installer instance, not the command class. Remove React/oclif imports if present.

---

### Subtask T005 – Update import paths in lib files
**Purpose:** Resolve circular imports (lib files importing from commands/)

**Steps:**
1. Find lib files importing from commands:
   ```bash
   cd packages/mittwald-cli-core/src/lib
   grep -r "from.*commands/" .
   ```
2. Expected findings:
   - `resources/app/custom_installation.ts` imports installers
   - Possibly `ddev/init_projecttype.tsx` imports installers
3. Update imports to point to installers directory:
   ```typescript
   // Before:
   import { phpInstaller } from "../../../commands/app/create/php.js";

   // After:
   import { phpInstaller } from "../../installers/php.js";
   ```
4. Verify no remaining commands/ imports:
   ```bash
   grep -r "from.*commands/" packages/mittwald-cli-core/src/lib
   # Should return no results
   ```

**Files:**
- Edit: `packages/mittwald-cli-core/src/lib/resources/app/custom_installation.ts`
- Edit: `packages/mittwald-cli-core/src/lib/ddev/init_projecttype.tsx` (if exists)

**Parallel?** Sequential after T004

**Notes:** This resolves circular dependencies. Lib now only imports from lib/ and installers/, never from commands/.

---

### Subtask T006 – Create package.json
**Purpose:** Configure package metadata and dependencies

**Steps:**
1. Create `packages/mittwald-cli-core/package.json`:
   ```json
   {
     "name": "@mittwald-mcp/cli-core",
     "version": "1.0.0",
     "description": "Extracted business logic from @mittwald/cli for MCP server library usage",
     "type": "module",
     "main": "./dist/index.js",
     "types": "./dist/index.d.ts",
     "exports": {
       ".": {
         "types": "./dist/index.d.ts",
         "import": "./dist/index.js"
       },
       "./lib/*": {
         "types": "./dist/lib/*.d.ts",
         "import": "./dist/lib/*.js"
       },
       "./installers/*": {
         "types": "./dist/installers/*.d.ts",
         "import": "./dist/installers/*.js"
       }
     },
     "scripts": {
       "build": "tsc && tsc-alias",
       "clean": "rm -rf dist"
     },
     "dependencies": {
       "@mittwald/api-client": "^4.169.0",
       "@mittwald/api-client-commons": "^4.0.0",
       "date-fns": "^3.0.0",
       "semver": "^7.6.0",
       "chalk": "^5.3.0",
       "axios": "^1.12.0",
       "axios-retry": "^4.0.0"
     },
     "devDependencies": {
       "@types/node": "^22.0.0",
       "@types/semver": "^7.5.0",
       "typescript": "^5.8.0",
       "tsc-alias": "^1.8.0"
     }
   }
   ```
2. Install dependencies:
   ```bash
   cd packages/mittwald-cli-core
   npm install
   ```

**Files:**
- Create: `packages/mittwald-cli-core/package.json`

**Parallel?** Sequential after T002 (needs lib/ to exist)

**Notes:** Dependencies copied from `@mittwald/cli` package.json, filtered to lib-only requirements

---

### Subtask T007 – Create tsconfig.json
**Purpose:** Configure TypeScript compilation

**Steps:**
1. Create `packages/mittwald-cli-core/tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "ES2022",
       "moduleResolution": "node16",
       "lib": ["ES2022"],
       "outDir": "./dist",
       "rootDir": "./src",
       "declaration": true,
       "declarationMap": true,
       "sourceMap": true,
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "resolveJsonModule": true,
       "allowSyntheticDefaultImports": true,
       "types": ["node"]
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist"]
   }
   ```

**Files:**
- Create: `packages/mittwald-cli-core/tsconfig.json`

**Parallel?** Can run in parallel with T006

**Notes:** Configuration matches lib requirements (strict mode, ES2022 target)

---

### Subtask T008 – Build package and verify no errors
**Purpose:** Validate extraction successful and TypeScript compiles

**Steps:**
1. Build package:
   ```bash
   cd packages/mittwald-cli-core
   npm run build
   ```
2. Check for compilation errors:
   - Review terminal output for TypeScript errors
   - Common issues: missing dependencies, import path errors
3. Verify output:
   ```bash
   ls -la dist/
   ls -la dist/lib/
   ls -la dist/installers/
   # Should see .js, .d.ts, .js.map files
   ```
4. If errors occur:
   - Missing dependencies → update package.json, run `npm install`
   - Import path errors → verify T005 completed correctly
   - Type errors → may need to add type dependencies
5. Re-run build until clean (zero errors)

**Files:**
- Generated: `packages/mittwald-cli-core/dist/**/*` (build output)

**Parallel?** Sequential after T006-T007

**Notes:** Build must complete with zero errors to pass Gate 1. Do NOT proceed if compilation fails.

---

## Test Strategy

**No automated tests for this work package.** Validation via:
- Manual verification: Directory structure created correctly
- Build validation: TypeScript compiles without errors
- Import validation: No circular dependencies remain

---

## Risks & Mitigations

**Risk:** Circular import errors persist after T005
- **Symptom:** TypeScript build fails with import cycle errors
- **Mitigation:** Grep entire codebase for `commands/` imports, update all to use installers/

**Risk:** Missing dependencies cause build failures
- **Symptom:** `Cannot find module` errors during build
- **Mitigation:** Cross-reference `~/Code/mittwald-cli/package.json` dependencies, add missing ones

**Risk:** Installer extraction incomplete
- **Symptom:** Lib files still import from commands/, build fails
- **Mitigation:** Thorough search in T003, verify all installers relocated

---

## Definition of Done Checklist

- [ ] All subtasks T001-T008 completed
- [ ] `packages/mittwald-cli-core/` directory structure exists
- [ ] `src/lib/` copied from CLI (101 files)
- [ ] Installer instances extracted to `src/installers/`
- [ ] Import paths updated (no commands/ references)
- [ ] package.json created with dependencies
- [ ] tsconfig.json created
- [ ] `npm run build` completes with zero errors
- [ ] `dist/` output contains .js and .d.ts files
- [ ] Gate 1 criteria met (see Objectives)

---

## Review Guidance

**Key Acceptance Checkpoints:**
1. Build succeeds without errors (`npm run build` exit code 0)
2. No circular import warnings in TypeScript output
3. Installer instances successfully relocated (count matches T003 findings)
4. All lib files present in dist/ output

**Verification Commands:**
```bash
cd packages/mittwald-cli-core
npm run build 2>&1 | tee build.log
grep -i error build.log  # Should be empty
grep -r "from.*commands/" src/lib  # Should be empty
ls dist/installers/*.js | wc -l  # Should match installer count
```

---

## Activity Log

- 2025-12-18T06:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
- 2025-12-18T07:45:00Z – claude – shell_pid=84179 – lane=doing – Started implementation of WP01
- 2025-12-18T08:15:00Z – claude – shell_pid=84179 – lane=for_review – Completed all T001-T008. Package built successfully (242 JS files, 8 installers). Zero TypeScript errors.
- 2025-12-18T14:12:24Z – codex – shell_pid=84179 – lane=done – Smoke-check only; no blocking issues found. User requested closure.
