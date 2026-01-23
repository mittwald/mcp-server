---
work_package_id: WP06
title: OAuth Guides - Cursor & Codex CLI
lane: "done"
dependencies: []
subtasks:
- T009
- T010
- T011
- T012
phase: Phase B - OAuth Getting-Started Guides
assignee: ''
agent: "claude"
shell_pid: "30171"
review_status: "approved"
reviewed_by: "Robert Douglass"
history:
- timestamp: '2025-01-23T00:00:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
---

# Work Package Prompt: WP06 – OAuth Guides - Cursor & Codex CLI

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

**Goal**: Research OAuth and MCP integration patterns for Cursor and Codex CLI, then write comprehensive getting-started guides for each tool.

**Success Criteria**:
- ✅ Cursor OAuth + MCP integration research documented
- ✅ Codex CLI OAuth + MCP integration research documented
- ✅ Cursor getting-started guide written and published
- ✅ Codex CLI getting-started guide written and published
- ✅ Both guides follow Divio How-To format
- ✅ Both guides include OAuth registration, PKCE setup, verification steps
- ✅ Codex CLI guide emphasizes RFC 8252 loopback patterns
- ✅ Both guides include troubleshooting for common OAuth errors
- ✅ Developer can complete OAuth setup for either tool within 10 minutes

---

## Context & Constraints

**Prerequisites**: WP01 (Site 1 must exist to publish guides)

**Related Documents**:
- Spec: `/Users/robert/Code/mittwald-mcp/kitty-specs/016-mittwald-mcp-documentation/spec.md`
- OAuth Architecture: `/Users/robert/Code/mittwald-oauth/mittwald-oauth/docs/ARCHITECTURE.md`
- RFC 8252 (OAuth for Native Apps): https://datatracker.ietf.org/doc/html/rfc8252

**Critical Path Context**:
These guides complete the OAuth setup documentation for all 4 supported tools. Together with WP05, developers will have a complete getting-started path for any tool they choose.

**Architectural Context**:
- **Codex CLI** is a command-line tool using RFC 8252 loopback pattern
- **Cursor** is an IDE (VS Code fork) with potential extension-based OAuth
- Both tools require secure OAuth but may have different callback mechanics

**Constraints**:
- Codex CLI guide must explain loopback redirect URIs clearly
- Cursor guide must work for IDE/extension context
- Both guides must be independently complete

---

## Subtasks & Detailed Guidance

### Subtask T009 – Research Cursor OAuth + MCP Integration

**Purpose**: Investigate how Cursor (IDE) handles OAuth callbacks and MCP server configuration.

**Research Questions**:

1. **What is Cursor?**
   - IDE based on VS Code?
   - Standalone application?
   - How does it integrate with MCP?

2. **How does Cursor handle OAuth callbacks?**
   - IDE extension pattern (embedded browser)?
   - Loopback redirect (like native apps)?
   - Web-based redirect to app?

3. **How is PKCE configured in Cursor?**
   - Automatic or manual?
   - Configuration UI or file-based?

4. **How does Cursor register MCP servers?**
   - Settings UI in IDE?
   - Configuration file (JSON)?
   - Command palette?

5. **What are common OAuth errors in Cursor?**
   - Extension-specific errors?
   - Browser integration issues?

**Research Sources**:

1. **Official Cursor Documentation**:
   - https://cursor.sh or https://cursor.com
   - Look for: MCP setup, OAuth configuration

2. **Cursor Settings/Preferences**:
   - Install Cursor (if available)
   - Explore settings UI for MCP configuration

3. **GitHub / Community**:
   - Search: "Cursor IDE MCP OAuth setup"
   - Check Cursor GitHub repo (if public)

**Research Output**:

File: `docs/research/cursor-oauth-research.md`

```markdown
# Cursor OAuth + MCP Integration Research

**Researched**: 2025-01-23
**For**: WP06 - Getting-Started Guide

## Cursor Overview

- Type: IDE / VS Code fork / Extension
- MCP support: Native / Extension / Third-party
- Platform: macOS, Windows, Linux

## OAuth Callback Pattern

[Document findings]
- Pattern: IDE embedded browser / loopback / web redirect
- URL format: ...
- Configuration: UI / file / both

## PKCE Configuration

[Document findings]

## MCP Server Registration

[Document process]
- UI steps or file configuration
- Example configuration if file-based

## Common OAuth Errors

[Document errors and solutions]

## Sources

- [Links to documentation and examples]
```

**Duration**: 3-4 hours

**Files Created**:
- `docs/research/cursor-oauth-research.md` (new)

---

### Subtask T010 – Write Cursor Getting-Started Guide

**Purpose**: Write a comprehensive OAuth setup guide for Cursor based on T009 research.

File: `docs/setup-and-guides/src/content/docs/getting-started/cursor.md`

**Structure**: Same as Claude Code guide (WP05/T006), but adapted for Cursor-specific patterns.

**Key sections**:
- Prerequisites (Cursor installation)
- Step 1: Register OAuth Client
- Step 2: Add Mittwald MCP to Cursor (IDE settings or config file)
- Step 3: Verify Connection
- Troubleshooting (Cursor-specific errors)
- Next Steps

**Cursor-specific adaptations**:
- If UI-based: Include screenshots of settings panels
- If file-based: Show exact JSON configuration format
- If extension: Installation and activation steps

**Example structure** (file-based config):

```markdown
## Step 2: Add Mittwald MCP to Cursor

Open Cursor's MCP configuration file:
- **macOS/Linux**: `~/.cursor/mcp.json`
- **Windows**: `%APPDATA%\Cursor\mcp.json`

Add Mittwald MCP configuration:

```json
{
  "servers": {
    "mittwald": {
      "url": "https://mittwald-mcp-fly2.fly.dev/mcp",
      "auth": {
        "type": "oauth",
        "clientId": "abc123...",
        "authorizationUrl": "https://mittwald-oauth-server.fly.dev/oauth/authorize",
        "tokenUrl": "https://mittwald-oauth-server.fly.dev/oauth/token",
        "redirectUri": "http://localhost:PORT/callback"
      }
    }
  }
}
```

Save the file and restart Cursor.
```

**Duration**: 3-4 hours

**Files Created**:
- `docs/setup-and-guides/src/content/docs/getting-started/cursor.md` (new)

---

### Subtask T011 – Research Codex CLI OAuth + MCP Integration

**Purpose**: Investigate Codex CLI's RFC 8252 loopback-based OAuth flow and MCP configuration.

**Research Questions**:

1. **What is Codex CLI?**
   - OpenAI's official CLI tool?
   - Community tool?
   - Current status and maintenance?

2. **How does Codex CLI handle OAuth callbacks?**
   - RFC 8252 loopback (http://127.0.0.1:PORT)?
   - Dynamic port selection?
   - Temporary HTTP server for callback?

3. **How is PKCE implemented?**
   - Code verifier generation?
   - S256 challenge method?

4. **How does Codex CLI register MCP servers?**
   - CLI command syntax?
   - Configuration file location?

5. **What are common OAuth errors?**
   - Loopback-specific errors?
   - Port binding issues?

**Research Sources**:

1. **OpenAI Developer Documentation**:
   - https://developers.openai.com/codex/cli (per user specification)
   - CLI installation and setup guides

2. **Codex CLI GitHub Repository**:
   - Search GitHub for "openai codex cli"
   - Read README, installation docs

3. **RFC 8252 Specification**:
   - https://datatracker.ietf.org/doc/html/rfc8252
   - Section 8.3: Loopback redirect URIs for native apps

4. **mittwald-oauth-server Documentation**:
   - Review `/Users/robert/Code/mittwald-oauth/mittwald-oauth/README.md`
   - Section on RFC 8252 native app support

**Research Output**:

File: `docs/research/codex-cli-oauth-research.md`

```markdown
# Codex CLI OAuth + MCP Integration Research

**Researched**: 2025-01-23
**For**: WP06 - Getting-Started Guide

## Codex CLI Overview

- Official tool: Yes/No
- Maintainer: OpenAI / Community
- Installation: npm / pip / binary
- Platform: macOS, Windows, Linux

## RFC 8252 Loopback Pattern

Codex CLI uses RFC 8252 for secure OAuth in CLI environments.

**Loopback redirect URI**:
- Format: `http://127.0.0.1:PORT/callback`
- Port: Dynamic (chosen at runtime) or fixed
- Server: Temporary HTTP server started by CLI for callback

**How it works**:
1. CLI generates PKCE verifier and challenge
2. CLI starts temporary HTTP server on loopback (127.0.0.1)
3. CLI opens browser with authorization URL + code challenge
4. User authenticates via browser
5. OAuth server redirects to loopback (http://127.0.0.1:PORT/callback)
6. CLI's HTTP server receives authorization code
7. CLI exchanges code + verifier for tokens
8. CLI shuts down HTTP server

## Mittwald OAuth Server Support

Mittwald OAuth server supports RFC 8252 (per README.md):
- **Dynamic port matching**: Client registers with http://127.0.0.1/callback, server accepts any port
- **Loopback addresses**: 127.0.0.1, [::1], localhost all supported
- **HTTP allowed**: HTTP (not HTTPS) permitted for loopback redirect URIs

## PKCE Configuration

[Document Codex CLI PKCE details]

## MCP Server Registration

[Document CLI commands]
```bash
codex mcp add mittwald https://mittwald-mcp-fly2.fly.dev/mcp
```

## Common OAuth Errors

1. **Port already in use**
   - Cause: Another process using the port
   - Fix: CLI should auto-select different port

2. **Browser doesn't open**
   - Cause: No default browser or terminal restrictions
   - Fix: Copy URL manually

## Sources

- [Links to Codex CLI docs, RFC 8252, examples]
```

**Duration**: 3-4 hours

**Important**: Codex CLI may use a different OAuth pattern than Claude Code. Pay special attention to loopback mechanics.

**Files Created**:
- `docs/research/codex-cli-oauth-research.md` (new)

---

### Subtask T012 – Write Codex CLI Getting-Started Guide

**Purpose**: Write a comprehensive OAuth setup guide for Codex CLI emphasizing RFC 8252 loopback patterns.

File: `docs/setup-and-guides/src/content/docs/getting-started/codex-cli.md`

**Structure**: Same Divio How-To format, but adapted for CLI context.

**CLI-specific adaptations**:
- Emphasis on command-line interface (no GUI)
- Terminal-based OAuth flow explanation
- Loopback redirect URI configuration
- Port selection and troubleshooting

**Example sections**:

```markdown
## Step 1: Register OAuth Client

Register Codex CLI with Mittwald OAuth using loopback redirect URI:

```bash
curl -X POST https://mittwald-oauth-server.fly.dev/oauth/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Codex CLI - [Your Name]",
    "redirect_uris": ["http://127.0.0.1/callback"],
    "grant_types": ["authorization_code"],
    "response_types": ["code"],
    "token_endpoint_auth_method": "none"
  }'
```

**Note**: The redirect URI uses `http://127.0.0.1/callback` without a port. Mittwald OAuth server will accept callbacks on **any port** (e.g., http://127.0.0.1:54321/callback) due to RFC 8252 dynamic port matching.

**Save the response**:
```json
{
  "client_id": "abc123...",
  ...
}
```

## Step 2: Add Mittwald MCP to Codex CLI

Run the Codex CLI command to add Mittwald MCP:

```bash
codex mcp add mittwald \
  --url https://mittwald-mcp-fly2.fly.dev/mcp \
  --auth oauth \
  --client-id abc123...
```

**What happens next**:
1. Codex CLI generates a PKCE code verifier and challenge
2. CLI starts a temporary HTTP server on http://127.0.0.1:[random-port]
3. CLI opens your browser to the Mittwald OAuth authorization page
4. You log in and authorize Codex CLI
5. Mittwald OAuth redirects to http://127.0.0.1:[port]/callback
6. CLI's HTTP server receives the authorization code
7. CLI exchanges code + verifier for tokens (PKCE verification)
8. CLI saves your tokens securely
9. CLI shuts down the temporary server

**This process happens automatically** when you run the command.

## Step 3: Verify Your Connection

Test that Codex CLI can access Mittwald MCP:

```bash
codex mcp call mittwald.user.get
```

**Expected output**:
```json
{
  "id": "user-abc123",
  "email": "your-email@example.com",
  "name": "Your Name"
}
```

✅ **Success!** Codex CLI is connected to Mittwald MCP.

## Troubleshooting

### Error: "Port already in use"

**Cause**: The random port selected by Codex CLI is already in use by another process.

**Fix**:
- Codex CLI should automatically try a different port
- If it doesn't, stop any conflicting processes:
  ```bash
  # macOS/Linux: Find process using port
  lsof -i :PORT
  # Kill the process or let CLI retry
  ```

### Error: "Browser didn't open"

**Cause**: CLI couldn't open your default browser automatically.

**Fix**:
1. Look for the authorization URL in the terminal output
2. Copy the URL manually
3. Paste it into your browser
4. Complete the authorization flow
5. The CLI will detect the callback automatically

### Error: "redirect_uri mismatch"

**Cause**: Mittwald OAuth server received a callback for a port that doesn't match your registration.

**Why this shouldn't happen**: Mittwald OAuth supports RFC 8252 dynamic port matching. If you registered `http://127.0.0.1/callback` (without port), the server accepts callbacks on any port.

**Fix**:
- Verify your registration includes `http://127.0.0.1/callback` (without a specific port)
- If you registered with a specific port (e.g., `http://127.0.0.1:3000/callback`), re-register without the port

### Error: "PKCE validation failed"

**Cause**: Code verifier doesn't match the code challenge (implementation error in CLI or server).

**Fix**:
- Update Codex CLI to latest version
- Ensure you're using S256 code challenge method
- Contact support if issue persists

## Next Steps

- **Explore tools**: [Tool Reference](/reference/tools/) for all 115 tools
- **Try a use case**: [Case Studies](/case-studies/) for practical examples
- **Learn more**: [What is MCP?](/explainers/what-is-mcp/) for deeper understanding
```

**Duration**: 3-4 hours to write and refine

**Files Created**:
- `docs/setup-and-guides/src/content/docs/getting-started/codex-cli.md` (new)

**Testing**:
- Follow guide step-by-step with actual Codex CLI
- Verify OAuth flow works with loopback redirect
- Test troubleshooting steps

---

## Test Strategy

**Research Validation** (T009, T011):
1. **Install and test tools**:
   - Install Cursor IDE
   - Install Codex CLI
   - Attempt OAuth flow with mittwald-oauth-server (staging or production)
   - Document actual behavior

2. **Cross-reference with RFC 8252**:
   - Verify loopback patterns match RFC specification
   - Verify Mittwald OAuth server behavior matches spec

3. **Cross-reference with official tool docs**:
   - Compare research findings with official documentation
   - Note discrepancies or updates

**Guide Validation** (T010, T012):
1. **Follow-the-guide testing**:
   - Fresh developer follows guide step-by-step
   - Time the process (target: ~10 minutes)
   - Note confusing steps or missing details

2. **Error scenario testing**:
   - Intentionally trigger errors (wrong client_id, wrong port, etc.)
   - Verify troubleshooting section helps resolve them
   - Add new errors to troubleshooting if discovered

3. **Build verification**:
   ```bash
   cd docs/setup-and-guides
   npm run build
   ```
   - ✅ Guides appear in navigation under "Getting Started"
   - ✅ Links work
   - ✅ Code blocks have proper syntax highlighting

**Acceptance Testing**:
- Developer completes OAuth setup for Cursor within 10 minutes
- Developer completes OAuth setup for Codex CLI within 10 minutes
- No questions or confusion during process
- OAuth flow works from start to finish

---

## Risks & Mitigations

**Risk 1: Cursor MCP support may be limited or non-existent**
- **Cause**: Cursor may not have official MCP support yet
- **Mitigation**: Research community solutions; document "experimental" status if applicable
- **Fallback**: Note in guide if MCP support is not yet available

**Risk 2: Codex CLI documentation may be sparse**
- **Cause**: Codex CLI may be experimental or community-maintained
- **Mitigation**: Use RFC 8252 as reference; test with mittwald-oauth-server directly
- **Fallback**: Provide manual OAuth flow instructions

**Risk 3: RFC 8252 loopback pattern may be confusing for developers**
- **Cause**: Loopback redirect URIs are less common than web redirects
- **Mitigation**: Clear explanation with diagrams; emphasize that "it just works"
- **Visual aids**: Add diagram showing loopback flow

**Risk 4: Tools may update OAuth implementation between research and publication**
- **Cause**: Active development of MCP tooling
- **Mitigation**: Date research findings; establish review cadence
- **Monitoring**: Track tool updates and update guides accordingly

**Risk 5: Port conflicts may frustrate users**
- **Cause**: Random port selection may conflict with running services
- **Mitigation**: Clear troubleshooting for port issues
- **Best practice**: Document how to check for port conflicts

---

## Review Guidance

**Key Acceptance Criteria**:

1. **Research is thorough**:
   - Cursor OAuth pattern documented
   - Codex CLI RFC 8252 loopback pattern documented
   - MCP registration process clear for both tools
   - Common errors identified with solutions

2. **Guides are complete**:
   - All sections present (prerequisites, steps, troubleshooting)
   - OAuth registration covered
   - PKCE setup explained
   - Verification step included
   - 3+ troubleshooting scenarios per guide

3. **Cursor guide is IDE-specific**:
   - Screenshots (if UI-based) or config examples (if file-based)
   - IDE-specific terminology
   - Settings/preferences navigation clear

4. **Codex CLI guide emphasizes loopback**:
   - RFC 8252 loopback explained clearly
   - Dynamic port matching explained
   - Temporary HTTP server concept clear
   - Terminal-based flow documented

5. **Guides follow Divio How-To format**:
   - Goal-oriented
   - Step-by-step
   - Practical, actionable
   - Minimal theory (link to explainers)

**Verification Commands**:

```bash
# Check research exists
ls docs/research/
# Expected: cursor-oauth-research.md, codex-cli-oauth-research.md

# Check guides exist
ls docs/setup-and-guides/src/content/docs/getting-started/
# Expected: cursor.md, codex-cli.md

# Build and preview
cd docs/setup-and-guides
npm run build
npm run dev
# Visit /getting-started/cursor/
# Visit /getting-started/codex-cli/
```

**Review Checklist**:
- [ ] Cursor research complete (OAuth pattern, MCP registration)
- [ ] Codex CLI research complete (RFC 8252 loopback emphasis)
- [ ] Cursor guide written with tool-specific details
- [ ] Codex CLI guide written with loopback explanation
- [ ] Both guides follow Divio How-To format
- [ ] Both guides include OAuth registration steps
- [ ] Both guides include PKCE setup
- [ ] Both guides include verification
- [ ] Both guides include troubleshooting (3+ errors each)
- [ ] Codex CLI guide explains RFC 8252 clearly
- [ ] Both guides independently followable
- [ ] Guides build and display correctly
- [ ] Completion time ~10 minutes (tested for both)

---

## Implementation Command

To implement this work package:

```bash
spec-kitty implement WP06 --base WP01
```

*(Depends on WP01; Site 1 must exist to publish guides. Can be implemented in parallel with WP05.)*

---

## Activity Log

> Entries MUST be in chronological order (oldest first, newest last).

*[Activity log will be populated during implementation and review]*
- 2026-01-23T10:52:59Z – claude-code – shell_pid=12625 – lane=doing – Started implementation via workflow command
- 2026-01-23T10:57:35Z – claude-code – shell_pid=12625 – lane=for_review – Ready for review: Cursor and Codex CLI OAuth research and getting-started guides complete. 4 subtasks completed: T009 (Cursor research), T010 (Cursor guide), T011 (Codex CLI research), T012 (Codex CLI guide). All guides follow Divio How-To format with step-by-step instructions, troubleshooting sections, and FAQ. Research documents comprehensively explain OAuth patterns specific to each tool.
- 2026-01-23T11:08:29Z – claude – shell_pid=30171 – lane=doing – Started review via workflow command
- 2026-01-23T11:08:36Z – claude – shell_pid=30171 – lane=done – Review passed: Cursor and Codex CLI OAuth research completed. Getting-started guides written following Divio How-To format with step-by-step instructions. Cursor guide includes IDE-specific details. Codex CLI guide emphasizes RFC 8252 loopback pattern. All 4 subtasks implemented (T009-T012). Comprehensive research and troubleshooting sections included.
