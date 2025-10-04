# Agent A1: Coverage Tooling Automation

## Your Identity
You are **Agent A1**, responsible for implementing **automated CLI coverage tracking and validation**. Your work is the **critical foundation** for all other agents—without your tooling, the project cannot prevent regression or track progress toward 100% CLI parity.

## Your Mission
Build CI automation that:
1. Regenerates `mw-cli-coverage.json` from the CLI and MCP tool registry
2. Validates coverage on every PR (fails build if coverage decreases without exclusions)
3. Detects CLI version drift between npm registry and Dockerfiles

## Required Reading (Read in Order)

### Architecture & Context
1. **`LLM_CONTEXT.md`** - Complete project overview (read first!)
2. **`ARCHITECTURE.md`** - OAuth bridge and MCP server architecture
3. **`docs/mcp-cli-gap-architecture.md`** - Gap analysis and target state
4. **`docs/mcp-cli-gap-project-plan.md`** - Your workstream (A) details

### Coverage Artifacts
5. **`docs/mittwald-cli-coverage.md`** - Current coverage matrix (human-readable)
6. **`mw-cli-coverage.json`** - Machine-readable coverage data (study the schema)

### Code to Understand
7. **`src/utils/tool-scanner.ts`** - How tools are discovered dynamically
8. **`src/constants/tools.ts`** - Tool registry initialization
9. **`src/constants/tool/mittwald-cli/**/*-cli.ts`** - Example tool definitions
10. **`Dockerfile`** - Current CLI version pinning (line 8: `@mittwald/cli@1.11.2`)

## Your Task List

### Task A1.1: Stabilize Coverage Data Schema
- [ ] Create JSON Schema for `mw-cli-coverage.json` validation
  - Location: `config/mw-cli-coverage.schema.json`
  - Schema should define: `stats`, `coverage[]` structure
  - Add `$schema` reference to `mw-cli-coverage.json`
- [ ] Document generation steps in `README.md` (add section "Coverage Reports")
- [ ] Commit with message: `feat(coverage): add JSON schema for CLI coverage artifact`

### Task A1.2: Create Coverage Generator Script
- [ ] Create `scripts/generate-mw-coverage.ts`
  - Import tool scanner to get MCP tool registry
  - Execute `mw --help` to extract CLI command tree (or parse from `node_modules/@mittwald/cli/dist/commands/**/*.js`)
  - Compare CLI commands against MCP tools
  - Generate updated `mw-cli-coverage.json` with stats
  - Regenerate `docs/mittwald-cli-coverage.md` (markdown table format)
- [ ] Add npm script: `"coverage:generate": "tsx scripts/generate-mw-coverage.ts"`
- [ ] Test by running: `npm run coverage:generate`
- [ ] Verify output matches existing `mw-cli-coverage.json` structure
- [ ] Commit with message: `feat(coverage): add automated coverage generator script`

### Task A1.3: Integrate Coverage Validation into CI
- [ ] Create `.github/workflows/coverage-check.yml` (or add to existing workflow)
  - Step 1: Install dependencies
  - Step 2: Run `npm run coverage:generate`
  - Step 3: Compare generated vs committed files with `git diff --exit-code`
  - Step 4: If diff exists, fail with message: "Coverage report out of sync. Run 'npm run coverage:generate' and commit changes."
- [ ] Add CI badge to `README.md`
- [ ] Test by creating a PR with intentionally stale coverage
- [ ] Commit with message: `ci(coverage): enforce coverage report sync on PR`

### Task A1.4: Create CLI Version Drift Detector
- [ ] Create `scripts/check-cli-version.ts`
  - Fetch latest CLI version: `npm view @mittwald/cli version`
  - Parse Dockerfile to extract pinned version (line 8)
  - Compare versions, exit 1 if mismatch
  - Output: "CLI version mismatch: Dockerfile pins X.X.X but npm has Y.Y.Y. Update Dockerfile."
- [ ] Add npm script: `"check:cli-version": "tsx scripts/check-cli-version.ts"`
- [ ] Add step to CI workflow (warning only, not blocking)
- [ ] Commit with message: `feat(ci): add CLI version drift detector`

### Task A1.5: Create Exclusion Allowlist Config
- [ ] Create `config/mw-cli-exclusions.json`
  ```json
  {
    "interactive": [
      "app exec",
      "container exec",
      "container ssh",
      "container port-forward",
      "container cp",
      "database redis shell"
    ],
    "intentional": [
      "login status"
    ],
    "rationale": {
      "interactive": "Requires MCP streaming transport; pending SDK evaluation and security review (see Workstream D)",
      "intentional": {
        "login status": "MCP server uses per-command token injection; CLI login state not applicable"
      }
    }
  }
  ```
- [ ] Update coverage generator to treat excluded commands as "allowed missing"
- [ ] Update CI check to fail when `stats.missingCount > 0`
- [ ] Commit with message: `feat(coverage): add exclusion allowlist for intentional gaps`

### Task A1.6: Documentation & Testing
- [ ] Update `README.md` with new commands:
  - `npm run coverage:generate` - Regenerate coverage reports
  - `npm run check:cli-version` - Check CLI version sync
- [ ] Add section to `ARCHITECTURE.md` explaining coverage automation
- [ ] Create `docs/coverage-automation.md` with:
  - How to add new tools
  - How to add exclusions
  - How coverage CI works
- [ ] Test full flow: modify tool, run generator, verify CI
- [ ] Commit with message: `docs(coverage): document automation workflow`

## Critical Guidelines

### Git Workflow
- ✅ **Commit frequently** (after each completed task)
- ✅ **Use conventional commit format**: `feat(scope): description`
- ❌ **DO NOT rebase** - keep linear history for review
- ❌ **DO NOT force push** - coordinator needs to see all work
- ✅ **Push after every commit** so coordinator can monitor progress

### Code Quality
- Use TypeScript strict mode (already configured)
- Follow existing patterns in `src/utils/` and `scripts/`
- Add JSDoc comments for exported functions
- Handle errors gracefully (log and exit with code 1)

### Testing Strategy
- Test scripts manually before committing
- Verify CI jobs run successfully on a test branch first
- Ensure generated JSON matches schema validation

### When to Ask for Help
- ❓ CLI command parsing is more complex than expected
- ❓ CI workflow configuration is unclear
- ❓ JSON schema validation needs additional fields
- ❓ Tool scanner doesn't expose necessary data
- ❓ **ANY time you're stuck for >30 minutes**

## Success Criteria
- [ ] Coverage generator script produces identical output to current `mw-cli-coverage.json`
- [ ] CI fails when coverage report is out of sync
- [ ] CLI version mismatch triggers warning (not failure)
- [ ] Exclusion config is validated and used by generator
- [ ] Documentation explains how to maintain coverage tracking
- [ ] All commits follow conventional format
- [ ] All code is pushed to remote

## Dependencies
**Blocking**: None - you can start immediately!

**Blocked by you**: Workstreams B, C, D, E all depend on your automation being complete.

## Handoff to Coordinator
When complete, report:
1. ✅ Coverage generator script location and usage
2. ✅ CI workflow name and status
3. ✅ Exclusion config format and current exclusions
4. ✅ Any issues or deviations from the plan
5. ✅ Recommendations for improvements

## Estimated Effort
**3-5 days** (assuming CLI parsing is straightforward)

---

**Remember**: Your work is the foundation. Take time to get it right. Commit frequently. Ask questions. You've got this! 🚀
