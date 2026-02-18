# mittwald-mcp Development Guidelines

## Fly.io Infrastructure

There are 2 Fly.io apps for the Mittwald ecosystem:
- `mittwald-oauth-server` - OAuth bridge deployed from this repo (`packages/oauth-bridge`) at https://mittwald-oauth-server.fly.dev
- `mittwald-mcp-fly2` - MCP server deployed from this repo root at https://mittwald-mcp-fly2.fly.dev

Deployment source note (verified 2026-02-17):
- The separate repository at `../mittwald-oauth/mittwald-oauth` is not the source of the currently running Fly.io OAuth service and is treated as inactive/deprecated for production.

### Add MCP Server to Claude Code
```bash
claude mcp add --transport http mittwald https://mittwald-mcp-fly2.fly.dev/mcp
```

### Single Instance Only - CRITICAL

**NEVER scale to multiple instances!** Both `mittwald-oauth-server` and `mittwald-mcp-fly2` must run as **single instances only**.

Why: In-memory storage (sessions, state) is NOT synchronized horizontally. Running multiple instances causes:
- Session loss when requests hit different instances
- OAuth state mismatches
- Authentication failures

**To verify single instance:**
```bash
flyctl status -a mittwald-oauth-server  # Should show 1 instance
flyctl status -a mittwald-mcp-fly2      # Should show 1 instance
```

**If you accidentally scaled up:**
```bash
flyctl scale count 1 -a mittwald-oauth-server
flyctl scale count 1 -a mittwald-mcp-fly2
```

### Deployment - CRITICAL

**NEVER run `fly deploy` or `flyctl deploy` directly!**

Deployment is automated via GitHub Actions. To deploy:
1. Commit and push changes to the `main` branch
2. GitHub Actions workflow (`.github/workflows/deploy-fly.yml`) triggers automatically
3. Monitor deployment status with: `gh run list --limit 5`

**The workflow triggers on changes to:**
- `packages/**`
- `src/**`
- `Dockerfile`
- `fly.toml`
- `.github/workflows/deploy-fly.yml`

**To check deployment status:**
```bash
# View recent workflow runs
gh run list --limit 5

# Watch a specific run
gh run watch

# View logs for a failed run
gh run view --log-failed
```

**Why not direct deploy?**
- Bypasses CI/CD checks
- No audit trail in GitHub
- Can deploy untested/unbuilt code
- Inconsistent with team workflow

## Project Structure
```
src/
tests/
```

## Commands
```bash
npm run build    # Build the project
npm run test     # Run tests
```

## Code Style
Follow standard TypeScript conventions.

## Mittwald OAuth Scopes - CRITICAL

**Mittwald accepts scopes in `resource:action` format ONLY:**
- `app:read`, `app:write`, `app:delete`
- `user:read`, `user:write`
- `project:read`, `project:write`, `project:delete`
- etc. (see https://api.mittwald.de/v2/scopes for full list)

**What Mittwald does NOT accept:**
- `mittwald:api` - There is NO passthrough scope!
- `openid`, `profile`, `email` - OIDC scopes are NOT supported
- Any scope not in the /v2/scopes list

**The oauth-bridge flow:**
1. Clients request scopes (e.g., `user:read customer:read app:read`)
2. Bridge validates these against `config/mittwald-scopes.json`
3. When redirecting to Mittwald: Send actual scopes from the `upstreamScopes` list
4. Default scopes: `user:read customer:read project:read app:read`

**Location:** `packages/oauth-bridge/src/config/mittwald-scopes.ts` - `MITTWALD_SCOPE_STRING`

## OAuth Bridge DCR Architecture - CRITICAL

**Mittwald's OAuth redirect list is STRICTLY IMMUTABLE.** This drives the entire OAuth bridge design.

### Why DCR (Dynamic Client Registration) is Required
- Mittwald pre-registers allowed redirect URIs - we CANNOT add arbitrary ones
- The bridge has ONE fixed redirect_uri with Mittwald: `{BRIDGE_BASE_URL}/mittwald/callback`
- Clients (Claude.ai, ChatGPT, etc.) register their redirect_uri via DCR with our bridge
- The bridge proxies the OAuth flow, using its own redirect_uri with Mittwald

### Flow
1. Client calls `POST /register` with their `redirect_uri` (DCR)
2. Client calls `/authorize` - bridge validates against DCR-registered URIs
3. Bridge redirects to Mittwald using the bridge's fixed redirect_uri
4. Mittwald authenticates and redirects back to bridge
5. Bridge redirects to the client's DCR-registered redirect_uri

### Error: "redirect_uri is not registered"
This means the client did NOT use DCR first. They must call `POST /register` before `/authorize`.

**DO NOT:**
- Try to add client redirect URIs to a static config list
- Bypass DCR validation in the authorize route
- Assume redirect_uri validation happens elsewhere

**Location:** `packages/oauth-bridge/src/routes/authorize.ts` - DCR lookup via `stateStore.getClientRegistration()`

## Operations Checklist

### JWT Secret Synchronization - CRITICAL
The OAuth bridge and MCP server must share the same JWT signing secret:
- **OAuth Server**: `BRIDGE_JWT_SECRET`
- **MCP Server**: `OAUTH_BRIDGE_JWT_SECRET`

These MUST be identical! If they differ, JWT signature verification fails and the MCP server falls back to Mittwald CLI validation, which causes OOM errors.

**To verify:**
```bash
flyctl ssh console -a mittwald-oauth-server -C "printenv BRIDGE_JWT_SECRET"
flyctl ssh console -a mittwald-mcp-fly2 -C "printenv OAUTH_BRIDGE_JWT_SECRET"
```

**To sync (if different):**
```bash
# Get the OAuth server's secret
SECRET=$(flyctl ssh console -a mittwald-oauth-server -C "printenv BRIDGE_JWT_SECRET" 2>/dev/null | tail -1)
# Set it on the MCP server
flyctl secrets set OAUTH_BRIDGE_JWT_SECRET="$SECRET" -a mittwald-mcp-fly2
```

### Health Check URLs
- OAuth Server: https://mittwald-oauth-server.fly.dev/health
- MCP Server: https://mittwald-mcp-fly2.fly.dev/health

### Logs
```bash
flyctl logs -a mittwald-oauth-server --no-tail | tail -50
flyctl logs -a mittwald-mcp-fly2 --no-tail | tail -50
```

<!-- MANUAL ADDITIONS START -->

## CLI-to-Library Architecture - CRITICAL

**Feature 012: Mittwald CLI converted to importable library to fix concurrent user failures**

### Problem
- MCP server spawned `mw` CLI processes for each tool invocation
- Process spawning caused concurrent user failures and Node.js compilation cache deadlocks
- 200-400ms overhead per CLI spawn vs <50ms target

### Solution Architecture
**Monorepo package:** `packages/mittwald-cli-core/`
- Extracted `src/lib/` business logic from `@mittwald/cli` v1.12.0
- Skipped CLI command layer (oclif wrappers)
- Direct function imports replace process spawning

**Why not import `@mittwald/cli` directly?**
- Package exports NO library interface (`main: null`, `exports: null`)
- Only exports binary: `bin/mw`
- oclif framework discourages programmatic command invocation

**Why not use `@mittwald/api-client` alone?**
- CLI contains orchestration logic (multi-step workflows, validation)
- One CLI command = multiple API calls + coordination
- Would require duplicating ~101 files of business logic

### Package Structure
```
packages/
  mittwald-cli-core/
    src/
      lib/           # Extracted from @mittwald/cli/src/lib/
      installers/    # Relocated from CLI command files
      index.ts       # Library function exports
```

### Integration Pattern
```typescript
// Tool handlers import library functions instead of spawning CLI:
import { listApps } from '@mittwald-mcp/cli-core';

const result = await listApps({
  projectId,
  apiToken: session.mittwaldAccessToken,
});
```

### Key Locations
- **Library package:** `packages/mittwald-cli-core/`
- **Tool handlers:** `src/handlers/tools/mittwald-cli/**/*.ts`
- **Plan:** `kitty-specs/012-convert-mittwald-cli/plan.md`
- **Spec:** `kitty-specs/012-convert-mittwald-cli/spec.md`

### Success Criteria
- 10 concurrent users, zero failures
- <50ms median response time (vs 200-400ms baseline)
- Zero `mw` CLI processes spawned
- 100% output parity validated via parallel execution

## Agent-Based MCP Tool Evaluation - CRITICAL

**Feature 013: Post-012 Eval Suite Reconciliation**

### Problem
- Feature 010 created eval suite for 175 tools (pre-CLI-to-library conversion)
- Feature 012 reduced tool count to 115 tools (library-based architecture)
- Existing eval prompts out of sync with current MCP server reality
- Need to validate post-012 MCP server health and establish new baseline

### Solution
**Eval Prompt Reconciliation:**
- Discover current tool inventory (115 tools across 19 domains)
- Archive prompts for 60 removed tools
- Update prompts for renamed/modified tools
- Create prompts for new tools (if any)
- Ensure all prompts formatted as Langfuse-importable JSON documents

**Agent Execution Model:**
- Users manually spawn agents (no orchestration automation)
- Work package (WP) prompt files contain eval instructions
- Agents execute via `/spec-kitty.implement` on WP files
- **CRITICAL**: Agents must CALL MCP tools directly, NOT write scripts
- Self-assessment captured via embedded JSON with marker extraction

### Inventory Changes (010 → 013)
- **Baseline (010)**: 175 tools, 10 domains
- **Current (013)**: 115 tools, 19 domains
- **Delta**: 60 tools removed/consolidated (34.3% reduction)
- **Primary cause**: CLI-to-library conversion simplified tool set

### Langfuse Format
Eval prompts use feature 010's Langfuse-compatible JSON structure:
```json
{
  "input": {
    "prompt": "Markdown with self-assessment instructions",
    "tool_name": "mcp__mittwald__mittwald_app_list",
    "display_name": "app/list",
    "context": {
      "dependencies": ["..."],
      "setup_instructions": "..."
    }
  },
  "expectedOutput": null,
  "metadata": {
    "domain": "app",
    "tier": 4,
    "eval_version": "2.0.0"
  }
}
```

### Key Locations
- **Feature spec:** `kitty-specs/013-agent-based-mcp-tool-evaluation/spec.md`
- **Plan:** `kitty-specs/013-agent-based-mcp-tool-evaluation/plan.md`
- **Research:** `kitty-specs/013-agent-based-mcp-tool-evaluation/research.md`
- **Eval prompts:** `evals/prompts/{domain}/*.json`
- **Archived prompts:** `evals/prompts/_archived/`
- **Tool inventory:** `evals/inventory/tools-current.json`

### Success Criteria
- 100% of 115 current tools have valid eval prompts
- All prompts formatted as Langfuse-importable JSON
- Prompts explicitly instruct "CALL tool directly, NOT write scripts"
- Archived prompts for removed tools documented
- Post-012 baseline established for future validation

## Domain-Grouped Eval Work Packages - CRITICAL

**Feature 014: Execute All Evals and Establish Baseline**

### Problem
- Feature 013 created 116 eval prompt JSON files but they haven't been executed yet
- No baseline data for post-012 MCP server health
- Manual copy-paste workflow from JSON files is cumbersome

### Solution
**Execute all 116 evals in this feature:**
- Generate 12 domain-grouped Work Package (WP) files during `/spec-kitty.tasks`
- Each WP contains all eval prompts for that domain, ordered by tier (0→4)
- Execute WPs via `/spec-kitty.implement`
- Agents call MCP tools directly, save self-assessments inline to disk
- Aggregate results using feature 010's existing scripts
- By feature completion: all 116 evals executed, baseline established

### Execution Model
**WP Generation (automated during task generation):**
- TypeScript script reads all JSON files from `evals/prompts/{domain}/`
- Extracts `input.prompt` field from each JSON
- Sorts by `metadata.tier` (ascending)
- Generates 12 markdown WP files (one per domain)
- WP files are task files, executed via `/spec-kitty.implement`

**Inline Self-Assessment Save:**
- Each eval prompt instructs agent: "After completing this eval, immediately save self-assessment JSON to `evals/results/{domain}/{tool-name}-result.json`"
- Agent writes result file before moving to next eval
- No batch save (prevents data loss if interrupted)

**Aggregation:**
- After all WPs execute, run `npx tsx evals/scripts/generate-coverage-report.ts`
- Produces `coverage-report.json` and `baseline-report.md`
- Feature 010 scripts handle the result file structure

### Domain Classification (116 tools across 12 domains)
- access-users (7), apps (8), automation (9), backups (8)
- containers (10), context (3), databases (14), domains-mail (22)
- identity (13), misc (5), organization (7), project-foundation (10)

### Execution Order (by tier)
1. **Tier 0** (no dependencies): identity, organization, context
2. **Tier 1-3** (organizational/project setup): project-foundation
3. **Tier 4** (requires project): remaining 8 domains

### Key Locations
- **Feature spec:** `kitty-specs/014-domain-grouped-eval-work-packages/spec.md`
- **Plan:** `kitty-specs/014-domain-grouped-eval-work-packages/plan.md`
- **Data model:** `kitty-specs/014-domain-grouped-eval-work-packages/data-model.md`
- **Quickstart:** `kitty-specs/014-domain-grouped-eval-work-packages/quickstart.md`
- **Eval prompts (input):** `evals/prompts/{domain}/*.json`
- **Results (output):** `evals/results/{domain}/*.json`
- **Aggregation scripts:** `evals/scripts/generate-coverage-report.ts`

### Success Criteria
- All 116 evals executed during this feature's implementation
- 100% of evals have self-assessments saved to `evals/results/{domain}/{tool}-result.json`
- Coverage report generated showing domain/tier breakdowns and success rates
- Post-014 baseline established and documented

<!-- MANUAL ADDITIONS END -->
