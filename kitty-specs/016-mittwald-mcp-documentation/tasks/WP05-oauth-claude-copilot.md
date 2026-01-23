---
work_package_id: WP05
title: OAuth Guides - Claude Code & GitHub Copilot
lane: "doing"
dependencies: []
subtasks:
- T005
- T006
- T007
- T008
phase: Phase B - OAuth Getting-Started Guides
assignee: ''
agent: "claude"
shell_pid: "29944"
review_status: ''
reviewed_by: ''
history:
- timestamp: '2025-01-23T00:00:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
---

# Work Package Prompt: WP05 – OAuth Guides - Claude Code & GitHub Copilot

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

**Goal**: Research OAuth and MCP integration patterns for Claude Code and GitHub Copilot, then write comprehensive getting-started guides for each tool.

**Success Criteria**:
- ✅ Claude Code OAuth + MCP integration research documented
- ✅ GitHub Copilot OAuth + MCP integration research documented
- ✅ Claude Code getting-started guide written and published
- ✅ GitHub Copilot getting-started guide written and published
- ✅ Both guides follow Divio How-To format
- ✅ Both guides include OAuth registration, PKCE setup, verification steps
- ✅ Both guides include troubleshooting for common OAuth errors
- ✅ Developer can complete OAuth setup for either tool within 10 minutes

---

## Context & Constraints

**Prerequisites**: WP01 (Site 1 must exist to publish guides)

**Related Documents**:
- Spec: `/Users/robert/Code/mittwald-mcp/kitty-specs/016-mittwald-mcp-documentation/spec.md` (User Scenario 1: Claude Code onboarding)
- Plan: `/Users/robert/Code/mittwald-mcp/kitty-specs/016-mittwald-mcp-documentation/plan.md`
- OAuth Architecture: `/Users/robert/Code/mittwald-oauth/mittwald-oauth/docs/ARCHITECTURE.md`
- Mittwald OAuth README: `/Users/robert/Code/mittwald-oauth/mittwald-oauth/README.md`

**Critical Path Context**:
OAuth authentication is the **gating factor** for all Mittwald MCP usage. If developers cannot complete OAuth setup, they cannot use any MCP tools. These guides are **the highest priority documentation** in the entire feature.

**Architectural Context**:
- **OAuth Server**: mittwald-oauth-server.fly.dev
- **OAuth Flow**: Authorization Code + PKCE (RFC 8252 for native apps)
- **Dynamic Client Registration**: RFC 7591 (clients register programmatically)
- **Redirect URIs**: Tool-specific patterns (loopback for native apps, callbacks for web-based)

**Constraints**:
- Guides must be tool-agnostic for Mittwald-specific steps (OAuth server, scopes)
- Guides must link to official tool documentation for MCP setup
- Troubleshooting must cover actual OAuth errors from mittwald-oauth-server
- Each guide must be independently followable (no dependencies between guides)

---

## Subtasks & Detailed Guidance

### Subtask T005 – Research Claude Code OAuth + MCP Integration

**Purpose**: Investigate how Claude Code handles OAuth callbacks, MCP server registration, and PKCE configuration to write an accurate getting-started guide.

**Research Questions to Answer**:

1. **How does Claude Code handle OAuth callbacks?**
   - Does it use RFC 8252 loopback pattern (http://127.0.0.1)?
   - What port does it use (fixed or dynamic)?
   - Does it start a temporary HTTP server for callbacks?

2. **How is PKCE configured in Claude Code?**
   - Is PKCE automatic or manual?
   - What code challenge method (S256, plain)?

3. **How does Claude Code register MCP servers?**
   - CLI command for adding MCP server?
   - Configuration file format?
   - Where are credentials stored?

4. **What are common OAuth errors in Claude Code?**
   - Redirect URI mismatches?
   - PKCE validation failures?
   - Token expiration handling?

**Research Sources**:

1. **Official Claude Code Documentation**:
   - Search for: "Claude Code MCP setup"
   - Search for: "Claude Code OAuth configuration"
   - Look for: CLI commands like `claude mcp add` or similar

2. **Anthropic Developer Documentation**:
   - https://developers.anthropic.com (if accessible)
   - Look for MCP integration guides

3. **Model Context Protocol Specification**:
   - https://modelcontextprotocol.io (if exists) or Anthropic's MCP docs
   - OAuth authentication section

4. **GitHub / Community**:
   - Search GitHub for "Claude Code MCP OAuth" examples
   - Check Anthropic community forums or Discord

**Research Output**:

Create a research document: `docs/research/claude-code-oauth-research.md`

```markdown
# Claude Code OAuth + MCP Integration Research

**Researched**: 2025-01-23
**For**: WP05 - Getting-Started Guide

## OAuth Callback Pattern

[Document findings here]
- Pattern: RFC 8252 loopback / Web-based / Other
- URL format: http://127.0.0.1:PORT/callback or different
- Port: Fixed (e.g., 3000) or dynamic
- Server: Temporary or persistent

## PKCE Configuration

[Document findings here]
- Automatic: Yes/No
- Code challenge method: S256 / plain
- Configuration location: CLI flags / config file

## MCP Server Registration

[Document CLI command or process]
```bash
claude mcp add --name mittwald --url https://mittwald-mcp-fly2.fly.dev/mcp
```

- Credentials: How OAuth token is stored
- Configuration file: Location and format

## Common OAuth Errors

1. **Redirect URI mismatch**
   - Error message: "..."
   - Cause: ...
   - Fix: ...

2. **PKCE validation failure**
   - Error message: "..."
   - Cause: ...
   - Fix: ...

## Sources

- Official docs: [URL]
- Community examples: [URL]
- MCP spec: [URL]
```

**Duration**: 3-4 hours of research

**Files Created**:
- `docs/research/claude-code-oauth-research.md` (new)

---

### Subtask T006 – Write Claude Code Getting-Started Guide

**Purpose**: Write a comprehensive, step-by-step OAuth setup guide for Claude Code based on T005 research.

**Guide Structure** (Divio How-To Format):

File: `docs/setup-and-guides/src/content/docs/getting-started/claude-code.md`

```markdown
---
title: Getting Started with Claude Code
description: Complete OAuth setup guide for using Mittwald MCP with Claude Code
sidebar:
  order: 1
---

# Getting Started: Claude Code

This guide shows you how to set up OAuth authentication and connect Mittwald MCP to Claude Code.

**Time to complete**: ~10 minutes

## What You'll Accomplish

By the end of this guide, you'll:
- Register Claude Code as an OAuth client with Mittwald
- Configure OAuth redirect URIs for Claude Code
- Connect Claude Code to the Mittwald MCP server
- Verify your connection by running a test command

## Prerequisites

Before you begin, ensure you have:
- **Claude Code installed** ([Installation guide](https://claude.ai/code))
- **Mittwald account** with API access
- **Terminal/command line access**
- **Node.js** (if required by Claude Code)

## Step 1: Register OAuth Client

Claude Code needs to register with Mittwald's OAuth server before it can authenticate.

**Register using Dynamic Client Registration (DCR)**:

```bash
curl -X POST https://mittwald-oauth-server.fly.dev/oauth/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Claude Code CLI - [Your Name]",
    "redirect_uris": ["http://127.0.0.1:PORT/callback"],
    "grant_types": ["authorization_code"],
    "response_types": ["code"],
    "token_endpoint_auth_method": "none"
  }'
```

**Replace**:
- `[Your Name]` with your name or identifier
- `PORT` with the port Claude Code uses (check T005 research)

**Response**:
```json
{
  "client_id": "abc123...",
  "client_secret": null,
  "redirect_uris": ["http://127.0.0.1:PORT/callback"],
  "registration_access_token": "xyz789..."
}
```

**Save these values**:
- `client_id` - You'll need this for Step 2
- `registration_access_token` - Keep this secure

## Step 2: Add Mittwald MCP to Claude Code

[Include actual CLI command from T005 research]

**Example** (replace with actual command):
```bash
claude mcp add \
  --name mittwald \
  --url https://mittwald-mcp-fly2.fly.dev/mcp \
  --auth-type oauth \
  --client-id abc123...
```

Claude Code will:
1. Open your browser to the Mittwald OAuth authorization page
2. Prompt you to log in with your Mittwald account
3. Ask you to authorize Claude Code to access your Mittwald resources
4. Redirect back to Claude Code with an authorization code
5. Exchange the code for an access token
6. Store the token securely

## Step 3: Verify Your Connection

Test that Claude Code can access Mittwald MCP tools.

**Run a simple MCP command**:

[Include actual command from T005 research]

**Example**:
```bash
claude mcp call mittwald.user.get
```

**Expected output**:
```json
{
  "id": "user-abc123",
  "email": "your-email@example.com",
  "name": "Your Name"
}
```

✅ **Success!** Claude Code is now connected to Mittwald MCP.

## Troubleshooting

### Error: "redirect_uri is not registered"

**Cause**: The redirect URI you used in Step 1 doesn't match what Claude Code is sending.

**Fix**:
1. Check the exact redirect URI Claude Code uses (see browser address bar during OAuth flow)
2. Re-register with the correct URI:
   ```bash
   curl -X POST https://mittwald-oauth-server.fly.dev/oauth/register \
     -H "Content-Type: application/json" \
     -d '{"client_name": "Claude Code", "redirect_uris": ["CORRECT_URI"]}'
   ```

### Error: "PKCE validation failed"

**Cause**: Code verifier doesn't match the code challenge.

**Fix**:
- Ensure you're using the latest version of Claude Code
- PKCE should be automatic - if you're configuring manually, use S256 method
- Contact support if issue persists

### Error: "Client authentication failed"

**Cause**: client_id is incorrect or registration expired.

**Fix**:
1. Verify client_id from Step 1 matches what you're using
2. Re-register if registration has expired

### OAuth authorization page doesn't open

**Cause**: Browser integration may be disabled or blocked.

**Fix**:
- Ensure default browser is set
- Try running command with `--browser` flag (if supported)
- Manual flow: Copy authorization URL from terminal and open in browser

### Access token expired

**Cause**: Tokens expire after a certain period (check OAuth server documentation).

**Fix**:
- Claude Code should refresh tokens automatically
- If not, re-run the `claude mcp add` command to re-authenticate

## Next Steps

Now that Claude Code is connected to Mittwald MCP, you can:
- **Explore tools**: See [Tool Reference](/reference/tools/) for all 115 available tools
- **Try a use case**: Check [Case Studies](/case-studies/) for real-world examples
- **Learn more**: Read [What is MCP?](/explainers/what-is-mcp/) to understand how it works

## Need Help?

- **OAuth server documentation**: https://mittwald-oauth-server.fly.dev/.well-known/oauth-authorization-server
- **Mittwald support**: support@mittwald.de
- **Community**: [Mittwald Community Forum](https://community.mittwald.de) (if exists)
```

**Duration**: 3-4 hours to write and refine

**Files Created**:
- `docs/setup-and-guides/src/content/docs/getting-started/claude-code.md` (new)

**Testing**:
After writing, test the guide:
1. Follow each step exactly as written
2. Note any unclear instructions
3. Capture actual error messages for troubleshooting section
4. Time the process - should be ~10 minutes

---

### Subtask T007 – Research GitHub Copilot OAuth + MCP Integration

**Purpose**: Same as T005, but for GitHub Copilot.

**Research Questions** (same as T005):
1. How does GitHub Copilot handle OAuth callbacks?
2. How is PKCE configured?
3. How does Copilot register MCP servers?
4. Common OAuth errors?

**Research Sources**:
1. **GitHub Copilot Documentation**:
   - https://docs.github.com/en/copilot
   - Search for MCP integration guides

2. **VS Code Extension Documentation** (if Copilot uses VS Code):
   - Look for MCP configuration in VS Code settings

3. **OpenAI Documentation** (if relevant):
   - Copilot may use OpenAI infrastructure

**Research Output**:

File: `docs/research/github-copilot-oauth-research.md`

Same structure as T005 research document.

**Duration**: 3-4 hours

**Files Created**:
- `docs/research/github-copilot-oauth-research.md` (new)

**Notes**:
- GitHub Copilot integration may differ significantly from Claude Code
- May be IDE-based (VS Code extension) rather than CLI
- OAuth pattern may be web-based rather than RFC 8252 loopback

---

### Subtask T008 – Write GitHub Copilot Getting-Started Guide

**Purpose**: Same as T006, but for GitHub Copilot.

**Guide Structure**: Same as T006 (Divio How-To format)

File: `docs/setup-and-guides/src/content/docs/getting-started/github-copilot.md`

**Adapt for Copilot-specific patterns**:
- If IDE-based: Include VS Code setup instructions
- If web-based OAuth: Different redirect URI pattern
- Include Copilot-specific screenshots or CLI output

**Duration**: 3-4 hours

**Files Created**:
- `docs/setup-and-guides/src/content/docs/getting-started/github-copilot.md` (new)

---

## Test Strategy

**Research Validation**:
1. **Verify findings with actual tools**:
   - Install Claude Code and GitHub Copilot
   - Attempt OAuth flow
   - Document actual behavior vs. documented behavior

2. **Cross-reference official documentation**:
   - Compare research findings with official docs
   - Flag discrepancies

**Guide Validation**:
1. **Follow-the-guide testing**:
   - New developer (or reviewer) follows guide step-by-step
   - Note confusing steps, missing information
   - Time the process (should be ~10 minutes)

2. **Error scenario testing**:
   - Intentionally cause errors (wrong redirect URI, wrong client_id)
   - Verify troubleshooting section helps resolve them

3. **Build verification**:
   ```bash
   cd docs/setup-and-guides
   npm run build
   ```
   - ✅ Guides appear in navigation
   - ✅ Links work
   - ✅ Formatting correct

**Acceptance Testing**:
- Developer with no prior Mittwald MCP experience completes OAuth setup within 10 minutes
- OAuth registration succeeds
- MCP connection verifies successfully
- No questions or confusion during process

---

## Risks & Mitigations

**Risk 1: Official documentation may be incomplete or unavailable**
- **Cause**: MCP integration may be new; docs may lag
- **Mitigation**: Use community examples, GitHub repos, experimental testing
- **Fallback**: Contact Anthropic/GitHub support for clarification

**Risk 2: OAuth patterns may change between research and guide writing**
- **Cause**: Tools update OAuth implementation
- **Mitigation**: Version-pin research findings; note "as of [date]"
- **Future**: Establish review cadence for guide updates

**Risk 3: Troubleshooting may not cover all errors**
- **Cause**: Can't test every possible error scenario
- **Mitigation**: Start with most common errors; expand based on user feedback
- **Iteration**: Update guides as new errors are reported

**Risk 4: Guide may be too long or too short**
- **Cause**: Balance between thoroughness and conciseness
- **Mitigation**: Follow 10-minute completion target; remove extraneous content
- **Testing**: Time actual completion; adjust detail level

---

## Review Guidance

**Key Acceptance Criteria**:

1. **Research is comprehensive**:
   - All research questions answered
   - OAuth callback pattern documented
   - PKCE configuration documented
   - MCP registration process documented
   - Common errors identified

2. **Guides are complete**:
   - All sections present (prerequisites, steps, troubleshooting, next steps)
   - OAuth registration covered
   - PKCE setup explained
   - Verification step included
   - Troubleshooting has 3+ error scenarios

3. **Guides follow Divio How-To format**:
   - Goal-oriented (solve OAuth setup problem)
   - Step-by-step instructions
   - Assumes basic developer knowledge
   - Links to deeper explanations (reference, explainers)

4. **Guides are independently followable**:
   - No dependencies on other guides
   - Complete from start to finish
   - No missing steps

5. **Guides are accurate**:
   - Based on research findings
   - CLI commands are correct
   - Troubleshooting reflects actual errors

**Verification Commands**:

```bash
# Check guides exist
ls docs/setup-and-guides/src/content/docs/getting-started/
# Expected: claude-code.md, github-copilot.md

# Check research exists
ls docs/research/
# Expected: claude-code-oauth-research.md, github-copilot-oauth-research.md

# Build and verify
cd docs/setup-and-guides
npm run build
npm run dev
# Visit http://localhost:4321/getting-started/claude-code/
# Visit http://localhost:4321/getting-started/github-copilot/
```

**Review Checklist**:
- [ ] Claude Code research complete (all questions answered)
- [ ] GitHub Copilot research complete
- [ ] Claude Code guide written
- [ ] GitHub Copilot guide written
- [ ] Both guides follow Divio How-To format
- [ ] Both guides include OAuth registration
- [ ] Both guides include PKCE setup
- [ ] Both guides include verification
- [ ] Both guides include troubleshooting (3+ errors)
- [ ] Both guides independently followable
- [ ] Guides build and display correctly
- [ ] Completion time ~10 minutes (tested)

---

## Implementation Command

To implement this work package:

```bash
spec-kitty implement WP05 --base WP01
```

*(Depends on WP01; Site 1 must exist to publish guides)*

---

## Activity Log

> Entries MUST be in chronological order (oldest first, newest last).

*[Activity log will be populated during implementation and review]*
- 2026-01-23T10:44:11Z – claude – shell_pid=6220 – lane=doing – Started implementation via workflow command
- 2026-01-23T10:49:29Z – claude – shell_pid=6220 – lane=for_review – OAuth guides complete: Claude Code and GitHub Copilot research and getting-started guides written and tested. All subtasks (T005-T008) implemented. 1700+ lines of comprehensive documentation. Build verified.
- 2026-01-23T11:08:14Z – claude – shell_pid=29944 – lane=doing – Started review via workflow command
