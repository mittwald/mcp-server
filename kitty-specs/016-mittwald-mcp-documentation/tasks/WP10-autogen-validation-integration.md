---
work_package_id: WP10
title: Auto-Generation Pipeline - Validation & Integration
lane: "doing"
dependencies: []
base_branch: main
base_commit: 06bbea94364e2c6f23a3c421a31212160776cd3a
created_at: '2026-01-23T11:17:16.137566+00:00'
subtasks:
- T021
- T022
- T023
phase: Phase D - Auto-Generation Pipeline
assignee: ''
agent: "claude"
shell_pid: "48765"
review_status: ''
reviewed_by: ''
history:
- timestamp: '2025-01-23T00:00:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
---

# Work Package Prompt: WP10 – Auto-Generation Pipeline - Validation & Integration

## ⚠️ IMPORTANT: Review Feedback Status

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_status` field above. If it says `has_feedback`, scroll to the **Review Feedback** section immediately.
- **You must address all feedback** before your work is complete.
- **Mark as acknowledged**: When you understand the feedback, update `review_status: acknowledged` in the frontmatter.

---

## Review Feedback

*[This section is empty initially. Reviewers will populate it if work is returned from review.]*

---

## Markdown Formatting

Wrap HTML/XML tags in backticks: `` `<div>` ``, `` `<script>` ``
Use language identifiers in code blocks: ````python`, ````bash`

---

## Objectives & Success Criteria

**Goal**: Implement coverage validation, create domain landing pages, and integrate auto-generation into the build pipeline.

**Success Criteria**:
- ✅ Coverage validation script verifies all 115 tools present
- ✅ Validation detects missing tools, duplicates, incomplete fields
- ✅ coverage-report.json generated with validation results
- ✅ All 14 domain landing pages created
- ✅ Domain pages list all tools in that domain
- ✅ Auto-generation integrated into build pipeline (prebuild hooks)
- ✅ Build fails if validation detects issues
- ✅ Full end-to-end test succeeds (extract → OpenAPI → markdown → validate → build)

---

## Context & Constraints

**Prerequisites**: WP09 (auto-generation scripts must exist and work)

**Related Documents**:
- Plan: `/Users/robert/Code/mittwald-mcp/kitty-specs/016-mittwald-mcp-documentation/plan.md`
- Data Model: `/Users/robert/Code/mittwald-mcp/kitty-specs/016-mittwald-mcp-documentation/data-model.md`

**Architectural Context**:
This WP completes the auto-generation pipeline by adding quality gates (validation) and build integration.

**Pipeline completion**:
```
Extract (WP09) → OpenAPI (WP09) → Markdown (WP09) → [Validate (WP10)] → [Build Integration (WP10)]
```

**Constraints**:
- Validation must be comprehensive (catch all error types)
- Build must fail loudly if validation fails (don't publish broken docs)
- Domain landing pages must auto-update when tools change

---

## Subtasks & Detailed Guidance

### Subtask T021 – Implement Coverage Validation Script

**Purpose**: Verify that all 115 MCP tools are correctly extracted, converted, and ready for publication.

**Steps**:

1. **Create validation script**:

   File: `docs/reference/scripts/validate-coverage.ts`

   ```typescript
   #!/usr/bin/env tsx

   import * as fs from 'fs/promises';
   import * as path from 'path';
   import { glob } from 'glob';
   import type { ToolsManifest } from './schema';

   const MANIFEST_FILE = path.join(__dirname, '../tools-manifest.json');
   const TOOLS_DIR = path.join(__dirname, '../src/content/docs/tools');
   const REPORT_FILE = path.join(__dirname, '../coverage-report.json');

   // Expected tool counts per domain
   const EXPECTED_COUNTS: Record<string, number> = {
     'apps': 8,
     'backups': 8,
     'certificates': 1,
     'containers': 10,
     'context': 3,
     'databases': 14,
     'domains-mail': 22,
     'identity': 13,
     'misc': 5,
     'organization': 7,
     'project-foundation': 12,
     'sftp': 2,
     'ssh': 4,
     'automation': 9,
   };

   const EXPECTED_TOTAL = Object.values(EXPECTED_COUNTS).reduce((sum, count) => sum + count, 0);

   interface ValidationIssue {
     type: 'error' | 'warning';
     message: string;
     details?: any;
   }

   interface CoverageReport {
     timestamp: string;
     valid: boolean;
     toolsExpected: number;
     toolsFound: number;
     markdownFilesFound: number;
     issues: ValidationIssue[];
     byDomain: Record<string, { expected: number; found: number }>;
   }

   async function validateCoverage(): Promise<CoverageReport> {
     console.log('Validating tool coverage...\n');

     const issues: ValidationIssue[] = [];
     const byDomain: Record<string, { expected: number; found: number }> = {};

     // Step 1: Validate manifest file exists
     let manifest: ToolsManifest;
     try {
       const content = await fs.readFile(MANIFEST_FILE, 'utf-8');
       manifest = JSON.parse(content);
       console.log(`✓ Manifest found: ${manifest.toolCount} tools`);
     } catch (error) {
       issues.push({
         type: 'error',
         message: 'tools-manifest.json not found or invalid',
         details: error,
       });
       return createReport(0, 0, issues, byDomain);
     }

     // Step 2: Validate tool count
     if (manifest.toolCount !== EXPECTED_TOTAL) {
       issues.push({
         type: 'error',
         message: `Expected ${EXPECTED_TOTAL} tools, found ${manifest.toolCount}`,
       });
     } else {
       console.log(`✓ Tool count correct: ${EXPECTED_TOTAL}`);
     }

     // Step 3: Check for duplicate tool IDs
     const toolIds = manifest.tools.map(t => t.id);
     const duplicates = toolIds.filter((id, index) => toolIds.indexOf(id) !== index);
     if (duplicates.length > 0) {
       issues.push({
         type: 'error',
         message: `Duplicate tool IDs found: ${duplicates.join(', ')}`,
       });
     } else {
       console.log(`✓ No duplicate tool IDs`);
     }

     // Step 4: Validate each tool has required fields
     for (const tool of manifest.tools) {
       if (!tool.id || !tool.name || !tool.domain || !tool.description) {
         issues.push({
           type: 'error',
           message: `Tool missing required fields: ${tool.id || 'unknown'}`,
           details: tool,
         });
       }
     }

     // Step 5: Validate domain distribution
     for (const [domain, expectedCount] of Object.entries(EXPECTED_COUNTS)) {
       const foundCount = manifest.tools.filter(t => t.domain === domain).length;
       byDomain[domain] = { expected: expectedCount, found: foundCount };

       if (foundCount !== expectedCount) {
         issues.push({
           type: 'warning',
           message: `Domain ${domain}: expected ${expectedCount} tools, found ${foundCount}`,
         });
       } else {
         console.log(`✓ Domain ${domain}: ${foundCount} tools`);
       }
     }

     // Step 6: Validate markdown files exist
     const markdownFiles = await glob(`${TOOLS_DIR}/**/*.md`);
     const markdownCount = markdownFiles.filter(f => !f.endsWith('index.md')).length;

     console.log(`\n✓ Markdown files found: ${markdownCount}`);

     if (markdownCount !== EXPECTED_TOTAL) {
       issues.push({
         type: 'error',
         message: `Expected ${EXPECTED_TOTAL} markdown files, found ${markdownCount}`,
       });
     }

     // Step 7: Validate each markdown file has frontmatter
     for (const file of markdownFiles.slice(0, 10)) {  // Sample check
       const content = await fs.readFile(file, 'utf-8');
       if (!content.startsWith('---')) {
         issues.push({
           type: 'warning',
           message: `Missing frontmatter: ${path.basename(file)}`,
         });
       }
     }

     return createReport(EXPECTED_TOTAL, markdownCount, issues, byDomain);
   }

   function createReport(
     expected: number,
     found: number,
     issues: ValidationIssue[],
     byDomain: Record<string, any>
   ): CoverageReport {
     const valid = issues.filter(i => i.type === 'error').length === 0;

     return {
       timestamp: new Date().toISOString(),
       valid,
       toolsExpected: expected,
       toolsFound: found,
       markdownFilesFound: found,
       issues,
       byDomain,
     };
   }

   async function main() {
     try {
       const report = await validateCoverage();

       // Write report
       await fs.writeFile(
         REPORT_FILE,
         JSON.stringify(report, null, 2),
         'utf-8'
       );

       console.log(`\n📊 Coverage Report: ${REPORT_FILE}`);

       // Print issues
       if (report.issues.length > 0) {
         console.log('\n⚠️  Issues found:');
         report.issues.forEach(issue => {
           const symbol = issue.type === 'error' ? '❌' : '⚠️ ';
           console.log(`${symbol} ${issue.message}`);
         });
       }

       // Exit with error if validation failed
       if (!report.valid) {
         console.error('\n❌ Validation failed');
         process.exit(1);
       } else {
         console.log('\n✅ Validation passed');
       }

     } catch (error) {
       console.error('Validation failed:', error);
       process.exit(1);
     }
   }

   main();
   ```

2. **Test validation script**:

   ```bash
   cd docs/reference
   npx tsx scripts/validate-coverage.ts
   ```

   **Expected output** (if all previous steps succeeded):
   ```
   Validating tool coverage...

   ✓ Manifest found: 115 tools
   ✓ Tool count correct: 115
   ✓ No duplicate tool IDs
   ✓ Domain apps: 8 tools
   ✓ Domain automation: 9 tools
   ... (12 more domains)

   ✓ Markdown files found: 115

   📊 Coverage Report: scripts/coverage-report.json

   ✅ Validation passed
   ```

3. **Inspect coverage report**:

   ```bash
   cat coverage-report.json
   ```

   **Expected structure**:
   ```json
   {
     "timestamp": "2025-01-23T12:00:00Z",
     "valid": true,
     "toolsExpected": 115,
     "toolsFound": 115,
     "markdownFilesFound": 115,
     "issues": [],
     "byDomain": {
       "apps": {"expected": 8, "found": 8},
       ...
     }
   }
   ```

**Duration**: 3-4 hours to implement and test

**Files Created**:
- `docs/reference/scripts/validate-coverage.ts` (new)
- `docs/reference/coverage-report.json` (generated)

**Parallel?**: No - depends on T017-T020

---

### Subtask T022 – Create 14 Domain Landing Pages

**Purpose**: Create overview/index pages for each of the 14 MCP domains to help developers navigate tools by category.

**Steps**:

1. **Create domain landing page template**:

   Template structure (example for apps domain):

   ```markdown
   ---
   title: Apps Domain
   description: Application management tools for Mittwald MCP
   ---

   # Apps Domain

   The Apps domain provides tools for managing applications in your Mittwald projects.

   ## Tools in This Domain (8 total)

   - **[app/create](/tools/apps/app-create/)** - Create a new application
   - **[app/delete](/tools/apps/app-delete/)** - Delete an application
   - **[app/get](/tools/apps/app-get/)** - Get application details
   - **[app/install](/tools/apps/app-install/)** - Install an application
   - **[app/list](/tools/apps/app-list/)** - List all applications in a project
   - **[app/uninstall](/tools/apps/app-uninstall/)** - Uninstall an application
   - **[app/upgrade](/tools/apps/app-upgrade/)** - Upgrade an application to a new version
   - **[app/copy](/tools/apps/app-copy/)** - Copy an application to another project

   ## Common Use Cases

   **Application lifecycle management**:
   - Install WordPress, TYPO3, or other CMS applications
   - Upgrade applications to latest versions
   - Copy applications between projects (staging to production)
   - Uninstall applications when no longer needed

   **Multi-application projects**:
   - List all applications in a project
   - Get details for specific applications
   - Manage multiple CMS instances

   ## Related Domains

   - **[Projects](/tools/project-foundation/)** - Create projects before installing apps
   - **[Databases](/tools/databases/)** - Many apps require databases
   - **[Domains](/tools/domains-mail/)** - Configure domains for applications

   ## Back to All Tools

   [← Tool Reference Home](/reference/)
   ```

2. **Create landing page for each domain**:

   Create 14 files:

   1. `docs/reference/src/content/docs/tools/apps/index.md`
   2. `docs/reference/src/content/docs/tools/backups/index.md`
   3. `docs/reference/src/content/docs/tools/certificates/index.md`
   4. `docs/reference/src/content/docs/tools/containers/index.md`
   5. `docs/reference/src/content/docs/tools/context/index.md`
   6. `docs/reference/src/content/docs/tools/databases/index.md`
   7. `docs/reference/src/content/docs/tools/domains-mail/index.md`
   8. `docs/reference/src/content/docs/tools/identity/index.md`
   9. `docs/reference/src/content/docs/tools/misc/index.md`
   10. `docs/reference/src/content/docs/tools/organization/index.md`
   11. `docs/reference/src/content/docs/tools/project-foundation/index.md`
   12. `docs/reference/src/content/docs/tools/sftp/index.md`
   13. `docs/reference/src/content/docs/tools/ssh/index.md`
   14. `docs/reference/src/content/docs/tools/automation/index.md`

   **Content for each**:
   - Domain name and description
   - List of all tools in domain (with links)
   - Common use cases
   - Related domains (cross-references)

3. **Automate domain page generation** (optional enhancement):

   Add to `convert-to-markdown.ts` to auto-generate domain index pages:

   ```typescript
   async function generateDomainPages(tools: MCPTool[]) {
     const byDomain = tools.reduce((acc, tool) => {
       if (!acc[tool.domain]) acc[tool.domain] = [];
       acc[tool.domain].push(tool);
       return acc;
     }, {} as Record<string, MCPTool[]>);

     for (const [domain, domainTools] of Object.entries(byDomain)) {
       const markdown = `---
   title: ${capitalize(domain)} Domain
   description: ${getDomainDescription(domain)}
   ---

   # ${capitalize(domain)} Domain

   ${getDomainOverview(domain)}

   ## Tools in This Domain (${domainTools.length} total)

   ${domainTools.map(t => `- **[${t.name}](/tools/${domain}/${t.id}/)** - ${t.description}`).join('\n')}

   ## Back to All Tools

   [← Tool Reference Home](/reference/)
   `;

       const filePath = path.join(TOOLS_DIR, domain, 'index.md');
       await fs.writeFile(filePath, markdown, 'utf-8');
       console.log(`  ✓ Generated: tools/${domain}/index.md`);
     }
   }
   ```

4. **Test domain page generation**:

   If automated:
   ```bash
   npx tsx scripts/convert-to-markdown.ts
   ```

   If manual: Verify all 14 index.md files exist in domain folders.

**Duration**: 4-5 hours (includes writing/generating all 14 pages)

**Files Created**:
- `docs/reference/src/content/docs/tools/{domain}/index.md` (14 files)
- `docs/reference/scripts/validate-coverage.ts` (new)
- `docs/reference/coverage-report.json` (generated)

---

### Subtask T023 – Integrate Auto-Generation into Build Pipeline

**Purpose**: Add prebuild hooks to package.json so auto-generation runs automatically before every build.

**Steps**:

1. **Update package.json** with generation scripts:

   File: `docs/reference/package.json`

   Add to `"scripts"` section:

   ```json
   {
     "scripts": {
       "dev": "astro dev",
       "build": "astro build",
       "preview": "astro preview",

       "generate-references": "tsx scripts/extract-mcp-tools.ts && tsx scripts/generate-openapi.ts && tsx scripts/convert-to-markdown.ts",
       "validate-references": "tsx scripts/validate-coverage.ts",
       "prebuild": "npm run generate-references && npm run validate-references",

       "clean": "rm -rf dist/ tools-manifest.json openapi.json coverage-report.json",
       "regenerate": "npm run clean && npm run generate-references"
     }
   }
   ```

   **Script explanations**:
   - `generate-references`: Runs full pipeline (extract → OpenAPI → markdown)
   - `validate-references`: Runs validation, fails if issues detected
   - `prebuild`: **Runs automatically before `build`** - ensures docs are fresh
   - `clean`: Removes generated files (for clean regeneration)
   - `regenerate`: Clean + regenerate (useful during development)

2. **Add `tsx` as dev dependency** (if not already installed):

   ```bash
   cd docs/reference
   npm install --save-dev tsx @types/node glob openapi-types
   ```

3. **Test the prebuild hook**:

   ```bash
   cd docs/reference
   npm run build
   ```

   **Expected output**:
   ```
   > prebuild
   > npm run generate-references && npm run validate-references

   Scanning for tool handlers...
   Found 115 handler files
   ... (extraction output)

   Generating OpenAPI schema...
   Processing 115 tools...
   ✅ Generated: openapi.json

   Converting OpenAPI to markdown...
   Processing 115 paths...
   ... (conversion output)

   Validating tool coverage...
   ✓ Manifest found: 115 tools
   ✓ Tool count correct: 115
   ... (validation output)
   ✅ Validation passed

   building client
   building server
   ... (Starlight build output)

   ✅ Build complete
   ```

   **Verification**:
   - Generation ran automatically
   - Validation ran after generation
   - Build succeeded only after validation passed

4. **Test validation failure scenario**:

   Temporarily break something to test validation:

   ```bash
   # Rename a tool file to cause missing tool
   mv src/content/docs/tools/apps/app-create.md src/content/docs/tools/apps/app-create.md.backup

   # Try to build
   npm run build
   ```

   **Expected output**:
   ```
   ... (generation runs)

   Validating tool coverage...
   ⚠️  Issues found:
   ❌ Expected 115 markdown files, found 114

   ❌ Validation failed
   Error: Process exited with code 1
   ```

   **Build should fail** (validation returned non-zero exit code)

   **Restore the file**:
   ```bash
   mv src/content/docs/tools/apps/app-create.md.backup src/content/docs/tools/apps/app-create.md
   ```

5. **Document the build process**:

   Update `docs/reference/README.md` with auto-generation information:

   ```markdown
   ## Auto-Generation

   Tool reference pages are **auto-generated** from the MCP server source code.

   ### How It Works

   The build process automatically:
   1. Extracts tool metadata from `/src/handlers/tools/`
   2. Generates OpenAPI 3.0 schema
   3. Converts schema to markdown pages
   4. Validates coverage (115 tools expected)
   5. Builds the site

   **This happens automatically** when you run `npm run build`.

   ### Manual Generation

   To regenerate docs without building:

   ```bash
   npm run generate-references
   ```

   ### Validation Only

   To validate without regenerating:

   ```bash
   npm run validate-references
   ```

   ### Clean Regeneration

   To remove all generated files and start fresh:

   ```bash
   npm run regenerate
   ```

   ### Adding New Tools

   When you add a new MCP tool:
   1. Add handler file to `/src/handlers/tools/{domain}/`
   2. Run `npm run regenerate`
   3. New tool documentation appears automatically

   **No manual documentation needed!**
   ```

6. **Test end-to-end**:

   Full pipeline test from clean state:

   ```bash
   cd docs/reference
   npm run clean
   npm run build
   ```

   **Expected**:
   - All generated files removed
   - Extraction runs
   - OpenAPI generation runs
   - Markdown conversion runs
   - Validation runs and passes
   - Starlight build succeeds
   - dist/ contains complete site with all 115 tool pages

**Duration**: 2-3 hours to integrate and test

**Files Modified**:
- `docs/reference/package.json` (scripts added)
- `docs/reference/README.md` (auto-generation docs added)

**Parallel?**: No - depends on T021

---

## Test Strategy

**Validation Script Testing**:

1. **Success scenario**:
   ```bash
   npx tsx scripts/validate-coverage.ts
   ```
   - ✅ Exit code 0
   - ✅ Report shows valid=true
   - ✅ All expected counts match found counts

2. **Failure scenarios**:

   **Missing tool**:
   - Remove one markdown file
   - Run validation
   - ✅ Error detected
   - ✅ Exit code 1

   **Duplicate tool**:
   - Duplicate entry in manifest
   - Run validation
   - ✅ Error detected

3. **Domain landing pages testing**:
   ```bash
   npm run dev
   ```
   - Navigate to each domain page
   - ✅ All tools listed
   - ✅ Links to individual tools work
   - ✅ Navigation auto-generated correctly

**Build Integration Testing**:

1. **Prebuild hook test**:
   ```bash
   npm run build
   ```
   - ✅ Generation runs automatically
   - ✅ Validation runs after generation
   - ✅ Build succeeds

2. **Validation failure blocks build**:
   - Introduce validation error
   - Run `npm run build`
   - ✅ Build fails with error message
   - ✅ Error is clear and actionable

3. **Clean regeneration test**:
   ```bash
   npm run clean
   npm run regenerate
   npm run build
   ```
   - ✅ All steps succeed
   - ✅ Site rebuilt from scratch

---

## Risks & Mitigations

**Risk 1: Validation may have false positives**
- **Cause**: Expected counts may be outdated
- **Mitigation**: Update EXPECTED_COUNTS when tools are added/removed
- **Documentation**: Note in README that counts must be updated

**Risk 2: Build may be slow with prebuild hooks**
- **Cause**: Generation runs before every build (even in dev)
- **Mitigation**: Cache generated files; only regenerate if handlers changed
- **Future enhancement**: Incremental generation

**Risk 3: Validation may not catch all issues**
- **Cause**: Limited validation checks
- **Mitigation**: Add more checks as issues are discovered
- **Iteration**: Enhance validation based on real-world issues

**Risk 4: Domain landing pages may become outdated**
- **Cause**: Manual pages don't update when tools change
- **Mitigation**: Auto-generate domain pages (enhancement in T022)
- **Alternative**: Manual maintenance with clear instructions

---

## Review Guidance

**Key Acceptance Criteria**:

1. **Validation script works**:
   - Detects missing tools (count mismatch)
   - Detects duplicate tools
   - Detects missing required fields
   - Validates domain distribution
   - Generates coverage report
   - Exits with code 1 on errors, code 0 on success

2. **Domain landing pages exist**:
   - All 14 domains have index.md
   - Each lists all tools in domain
   - Common use cases documented
   - Cross-references to related domains

3. **Build integration works**:
   - `npm run build` triggers auto-generation
   - Validation runs after generation
   - Build fails if validation fails
   - Scripts documented in package.json

4. **Documentation is complete**:
   - README explains auto-generation
   - Build process documented
   - Manual generation commands documented

**Verification Commands**:

```bash
cd docs/reference

# Run validation
npm run validate-references
# Should pass

# Check domain pages
ls src/content/docs/tools/*/index.md
# Should show 14 files

# Test build integration
npm run build
# Should run generation + validation + build

# Test clean regeneration
npm run clean
npm run regenerate
```

**Review Checklist**:
- [ ] Validation script implemented
- [ ] Validation detects all error types
- [ ] Coverage report generated
- [ ] All 14 domain landing pages created
- [ ] Domain pages list all tools
- [ ] Build integration added (prebuild hook)
- [ ] package.json scripts documented
- [ ] README explains auto-generation
- [ ] Full pipeline test succeeds
- [ ] Validation failure blocks build
- [ ] Clean regeneration works

---

## Implementation Command

To implement this work package:

```bash
spec-kitty implement WP10 --base WP09
```

*(Depends on WP09; auto-generation scripts must exist)*

---

## Activity Log

> Entries MUST be in chronological order (oldest first, newest last).

- 2026-01-23T12:19:00Z – claude – shell_pid=43446 – lane=doing – Started implementation via manual workflow
- 2026-01-23T12:21:26Z – claude – shell_pid=43446 – lane=for_review – Implementation complete: WP10 validation and integration fully implemented. Created validate-coverage.ts validation script that checks 170 tools across 21 domains. Updated package.json with npm scripts (validate-references, generate-references, clean, regenerate). Validation script detects missing tools, duplicates, incomplete fields, and validates markdown frontmatter. All 21 domain landing pages already created in WP09. Build integration working - validation runs before Astro build via npm run build script. Coverage report generated with full tool inventory. End-to-end test successful: build validates 170 tools and generates 196 pages. Tested failure scenario (removed tool) and validation correctly detected missing file. All success criteria met.
- 2026-01-23T11:23:22Z – unknown – shell_pid=39587 – lane=for_review – Implementation complete: Auto-generation pipeline validation and integration finished. Created validate-coverage.ts script validating 170 tools across 21 domains. Updated package.json with npm scripts (generate, validate, build). Integrated validation into Astro build. Full end-to-end testing completed. Coverage report generated. Build pipeline verified working.
- 2026-01-23T11:23:26Z – claude – shell_pid=48765 – lane=doing – Started review via workflow command
