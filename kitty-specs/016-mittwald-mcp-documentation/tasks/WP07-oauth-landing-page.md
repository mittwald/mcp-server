---
work_package_id: WP07
title: Create OAuth Guides Landing Page
lane: "doing"
dependencies: []
subtasks:
- T013
phase: Phase B - OAuth Getting-Started Guides
assignee: ''
agent: "claude-code"
shell_pid: "16408"
review_status: ''
reviewed_by: ''
history:
- timestamp: '2025-01-23T00:00:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
---

# Work Package Prompt: WP07 – Create OAuth Guides Landing Page

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

**Goal**: Create a landing page for OAuth getting-started guides that helps developers choose their tool and navigate to the appropriate setup guide.

**Success Criteria**:
- ✅ Landing page presents all 4 OAuth guides with clear differentiation
- ✅ Comparison table shows OAuth patterns, redirect URI types, and complexity
- ✅ Each guide linked with descriptive navigation
- ✅ Overview explains why OAuth is critical for MCP usage
- ✅ Quick-access links to all 4 guides
- ✅ Landing page follows Divio How-To format
- ✅ Developer can choose appropriate tool within 2 minutes

---

## Context & Constraints

**Prerequisites**: WP05 (Claude Code + Copilot guides) and WP06 (Cursor + Codex CLI guides) must be complete - all 4 guides must exist before creating landing page.

**Related Documents**:
- Spec: `/Users/robert/Code/mittwald-mcp/kitty-specs/016-mittwald-mcp-documentation/spec.md` (User Scenario 2: Developer explores tool options)
- Plan: `/Users/robert/Code/mittwald-mcp/kitty-specs/016-mittwald-mcp-documentation/plan.md`

**Purpose of Landing Page**:
- **Decision support**: Help developers choose the right tool for their workflow
- **Navigation hub**: Central access to all OAuth guides
- **Context setting**: Explain why OAuth is required for MCP

**Constraints**:
- Must be neutral (don't recommend one tool over others)
- Must link to actual guides (dependencies: WP05, WP06)
- Must work as standalone page and navigation hub

---

## Subtasks & Detailed Guidance

### Subtask T013 – Create OAuth Guides Landing Page

**Purpose**: Create a comprehensive landing page that presents all 4 OAuth guides with comparison information to help developers choose their tool.

**Steps**:

1. **Create landing page file**:

   File: `docs/setup-and-guides/src/content/docs/getting-started/index.md`

   ```markdown
   ---
   title: Getting Started with Mittwald MCP
   description: Choose your tool and set up OAuth authentication to start using Mittwald MCP
   sidebar:
     order: 0
   ---

   # Getting Started with Mittwald MCP

   Welcome! This guide helps you set up OAuth authentication for Mittwald MCP with your preferred agentic coding tool.

   **Why OAuth is required**: Mittwald MCP uses OAuth 2.1 to securely authenticate your access to Mittwald resources. Before you can use any MCP tools, you must complete OAuth setup for your chosen tool.

   ## Choose Your Tool

   Mittwald MCP works with 4 popular agentic coding tools. Choose the one you use:

   ### Claude Code
   **Best for**: Developers using Anthropic's Claude Code CLI

   - **OAuth Pattern**: RFC 8252 loopback (native app)
   - **Redirect URI**: `http://127.0.0.1/callback` (dynamic port)
   - **Complexity**: ⭐⭐ (Moderate - CLI-based OAuth)
   - **Setup Time**: ~10 minutes

   → [Set up Claude Code](/getting-started/claude-code/)

   ---

   ### GitHub Copilot
   **Best for**: Developers using GitHub Copilot in VS Code or other IDEs

   - **OAuth Pattern**: IDE extension-based
   - **Redirect URI**: [Depends on implementation - see guide]
   - **Complexity**: ⭐⭐ (Moderate - IDE integration)
   - **Setup Time**: ~10 minutes

   → [Set up GitHub Copilot](/getting-started/github-copilot/)

   ---

   ### Cursor
   **Best for**: Developers using Cursor IDE (VS Code fork)

   - **OAuth Pattern**: IDE-based (similar to VS Code)
   - **Redirect URI**: [Depends on implementation - see guide]
   - **Complexity**: ⭐⭐ (Moderate - IDE configuration)
   - **Setup Time**: ~10 minutes

   → [Set up Cursor](/getting-started/cursor/)

   ---

   ### Codex CLI
   **Best for**: Developers using OpenAI's Codex CLI tool

   - **OAuth Pattern**: RFC 8252 loopback (native app)
   - **Redirect URI**: `http://127.0.0.1/callback` (dynamic port)
   - **Complexity**: ⭐⭐ (Moderate - CLI-based OAuth)
   - **Setup Time**: ~10 minutes

   → [Set up Codex CLI](/getting-started/codex-cli/)

   ---

   ## Comparison Table

   | Feature | Claude Code | GitHub Copilot | Cursor | Codex CLI |
   |---------|-------------|----------------|--------|-----------|
   | **Type** | CLI | IDE Extension | IDE | CLI |
   | **OAuth Pattern** | RFC 8252 Loopback | IDE Extension | IDE Extension | RFC 8252 Loopback |
   | **Browser Required** | Yes (for auth) | Yes | Yes | Yes |
   | **PKCE** | Automatic | Automatic | Automatic | Automatic |
   | **Config Method** | CLI command | IDE settings | IDE settings | CLI command |
   | **Platform** | macOS, Linux, Windows | VS Code | macOS, Linux, Windows | macOS, Linux, Windows |

   ## What is OAuth and Why Do I Need It?

   **OAuth 2.1** is a secure authorization protocol that allows Mittwald MCP to access your Mittwald resources on your behalf without sharing your password.

   **How it works**:
   1. Your tool (Claude Code, Copilot, Cursor, or Codex CLI) requests access to Mittwald
   2. You log in to Mittwald and authorize the tool
   3. Mittwald issues an access token to your tool
   4. Your tool uses the token to call MCP tools securely

   **Security features**:
   - **PKCE** (Proof Key for Code Exchange): Prevents authorization code interception
   - **Scoped access**: Tools only get access to resources you authorize
   - **Token expiration**: Tokens expire and refresh automatically
   - **No password sharing**: Your Mittwald password never leaves Mittwald's servers

   Want to learn more? See [How OAuth Integration Works](/explainers/oauth-integration/)

   ## Common OAuth Concepts

   **Redirect URI**: The callback URL where Mittwald OAuth sends you after authorization. Each tool uses a different pattern.

   **Client ID**: Unique identifier for your tool, obtained during registration.

   **Authorization Code**: Temporary code exchanged for an access token (you don't handle this manually).

   **Access Token**: Credential your tool uses to call MCP tools on your behalf.

   **PKCE**: Security extension that prevents code interception attacks. Required by Mittwald OAuth.

   ## After OAuth Setup

   Once OAuth is configured, you can:
   - **Use MCP tools**: Natural language commands to manage Mittwald infrastructure
   - **Follow tutorials**: Try [case studies](/case-studies/) for real-world examples
   - **Explore tools**: Browse [tool reference](/reference/) for all 115 available tools

   ## Need Help?

   - **OAuth errors**: Check the troubleshooting section in your tool's guide
   - **Mittwald support**: support@mittwald.de
   - **MCP questions**: See [What is MCP?](/explainers/what-is-mcp/)

   ---

   *Ready to get started? Choose your tool above and follow the guide!*
   ```

2. **Update Site 1 navigation** to include landing page:

   File: `docs/setup-and-guides/astro.config.mjs`

   Update the sidebar to include the new OAuth guides:

   ```javascript
   sidebar: [
     {
       label: 'Home',
       link: '/',
     },
     {
       label: 'Getting Started',
       items: [
         { label: 'Choose Your Tool', link: '/getting-started/' },
         { label: 'Claude Code', link: '/getting-started/claude-code/' },
         { label: 'GitHub Copilot', link: '/getting-started/github-copilot/' },
         { label: 'Cursor', link: '/getting-started/cursor/' },
         { label: 'Codex CLI', link: '/getting-started/codex-cli/' },
       ],
     },
     // ... rest of navigation
   ]
   ```

3. **Add OAuth overview diagram** (optional but recommended):

   Create a simple Mermaid diagram showing the OAuth flow:

   File: Add to landing page or create separate diagram file:

   ````markdown
   ## OAuth Flow Diagram

   ```mermaid
   sequenceDiagram
       participant User
       participant Tool as Your Tool<br/>(Claude, Copilot, etc.)
       participant OAuth as Mittwald OAuth Server
       participant Mittwald as Mittwald API

       User->>Tool: Start OAuth setup
       Tool->>OAuth: Register client (DCR)
       OAuth-->>Tool: client_id
       Tool->>Tool: Generate PKCE verifier
       Tool->>OAuth: Authorization request + code_challenge
       OAuth->>User: Login & authorize
       User-->>OAuth: Approve
       OAuth->>Tool: Redirect with authorization code
       Tool->>OAuth: Exchange code + verifier for token
       OAuth->>OAuth: Verify PKCE
       OAuth-->>Tool: Access token
       Tool->>Mittwald: Call MCP tools with token
       Mittwald-->>Tool: Response
   ```

   This diagram shows the complete OAuth flow from tool registration to MCP usage.
   ````

4. **Test the landing page**:

   ```bash
   cd docs/setup-and-guides
   npm run dev
   ```

   **Manual testing**:
   - Visit http://localhost:4321/getting-started/
   - ✅ All 4 tools presented clearly
   - ✅ Comparison table visible and readable
   - ✅ Links to all 4 guides work
   - ✅ OAuth explanation is clear
   - ✅ Diagram renders correctly (if included)

5. **Verify navigation**:

   - Check sidebar: "Getting Started" section should show landing page + 4 guides
   - Click through all links
   - Verify breadcrumbs work

6. **Build and verify**:

   ```bash
   npm run build
   ```

   - ✅ Landing page builds successfully
   - ✅ Appears in navigation
   - ✅ Links to individual guides work

**Files Created/Modified**:
- `docs/setup-and-guides/src/content/docs/getting-started/index.md` (new)
- `docs/setup-and-guides/astro.config.mjs` (modified - navigation updated)

**Parallel?**: No - depends on WP05 and WP06 (all 4 guides must exist)

**Notes**:
- Landing page serves as decision support for developers
- Comparison table is key feature - make it scannable
- OAuth explanation provides context without deep technical detail
- Links to deeper explanation (/explainers/oauth-integration/) for those who want more

---

## Test Strategy

**Manual Testing**:

1. **Navigation testing**:
   - Visit landing page
   - Click each of the 4 tool links
   - Verify links work and lead to correct guides
   - Return to landing page via breadcrumbs

2. **Comparison table testing**:
   - Read comparison table
   - Verify information is accurate (cross-reference with research docs)
   - Check for readability (table width, mobile view)

3. **Content clarity testing**:
   - Read OAuth overview section
   - Verify explanations are clear
   - Check if non-specialist understands the concepts

4. **Diagram testing** (if included):
   - Verify Mermaid diagram renders
   - Check if diagram is clear and helpful
   - Test in light and dark modes

**Build Testing**:

```bash
cd docs/setup-and-guides
npm run build
# Verify no errors

# Check navigation structure in dist/
grep -r "getting-started" dist/ | head -10
# Verify landing page and 4 guides present
```

**Accessibility Testing**:
- Heading hierarchy correct (H1 → H2)
- Comparison table has headers
- Links have descriptive text
- Diagram has alt text (if image) or accessible rendering (if Mermaid)

---

## Risks & Mitigations

**Risk 1: Comparison table may not be accurate**
- **Cause**: Research findings may be incomplete or incorrect
- **Mitigation**: Cross-reference with WP05/WP06 research docs
- **Update process**: Easy to update table as new information emerges

**Risk 2: Tool recommendations may become outdated**
- **Cause**: Tools add or change MCP support
- **Mitigation**: Note "as of 2025-01-23"; establish review schedule
- **Maintenance**: Update quarterly or when major tool updates occur

**Risk 3: Developers may skip OAuth and try to use tools directly**
- **Cause**: Inadequate emphasis on OAuth requirement
- **Mitigation**: Clear messaging "OAuth is required before using any MCP tools"
- **Placement**: Put this message prominently at top of page

**Risk 4: Mermaid diagram may not render**
- **Cause**: Starlight may not have Mermaid plugin configured
- **Mitigation**: Test rendering; if not working, use static image instead
- **Fallback**: Remove diagram if it complicates setup

---

## Review Guidance

**Key Acceptance Criteria**:

1. **Landing page is comprehensive**:
   - Presents all 4 tools with descriptions
   - Comparison table is clear and accurate
   - OAuth overview explains the requirement
   - Links to all 4 guides work

2. **Navigation is updated**:
   - Landing page appears in "Getting Started" section
   - All 4 guides appear below landing page
   - Order is logical (landing first, then guides)

3. **Content is accessible**:
   - Headings follow hierarchy
   - Table has proper headers
   - Links are descriptive
   - Diagram (if present) is accessible

4. **Information is accurate**:
   - Tool descriptions match reality
   - OAuth patterns match research findings
   - Complexity ratings are fair
   - Setup times are realistic

**Verification Commands**:

```bash
# Check file exists
ls docs/setup-and-guides/src/content/docs/getting-started/index.md

# Build and preview
cd docs/setup-and-guides
npm run build
npm run dev

# Visit http://localhost:4321/getting-started/
# Verify all 4 tool links work
```

**Review Checklist**:
- [ ] Landing page created with all sections
- [ ] All 4 tools presented with descriptions
- [ ] Comparison table included and accurate
- [ ] OAuth overview explains requirement clearly
- [ ] Links to all 4 guides work
- [ ] Navigation updated in astro.config.mjs
- [ ] Landing page appears first in "Getting Started"
- [ ] Diagram renders correctly (if included)
- [ ] Build succeeds
- [ ] Page is accessible (headings, table headers, links)
- [ ] Mobile-responsive (table doesn't overflow)

---

## Implementation Command

To implement this work package:

```bash
spec-kitty implement WP07 --base WP06
```

*(Depends on WP05 and WP06; all guides must exist first)*

---

## Activity Log

> Entries MUST be in chronological order (oldest first, newest last).

*[Activity log will be populated during implementation and review]*
- 2026-01-23T10:57:43Z – claude-code – shell_pid=16408 – lane=doing – Started implementation via workflow command
