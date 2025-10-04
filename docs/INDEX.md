# Mittwald MCP Documentation Index

**Last Updated**: 2025-10-04
**Purpose**: Quick reference to find current, actionable documentation

---

## 📘 Core Documentation

### Essential Reading
- **`../README.md`** – Project overview, setup, and quick start
- **`../ARCHITECTURE.md`** – OAuth 2.1 bridge, MCP server design, security standards
- **`CREDENTIAL-SECURITY.md`** – **REQUIRED** security standard for credential-handling tools

### Automation & Tooling
- **`coverage-automation.md`** – CLI coverage tracking, CI enforcement, exclusion policy
- **`mittwald-cli-coverage.md`** – Auto-generated CLI command coverage report

---

## 🛠️ Tool Documentation

### Tool Usage Examples
- **`tool-examples/database.md`** – MySQL/Redis database management tools
- **`tool-examples/organization.md`** – Organization and membership management
- **`tool-examples/volumes.md`** – Volume lifecycle and management

### Tool Safety Guides
- **`tool-safety/destructive-operations.md`** – C4 pattern for delete/revoke operations
- **`tool-safety/volume-operations.md`** – Volume-specific safety considerations

### Specialized Tools
- **`app-dependency-tools.md`** – Application dependency management (PHP/Node)
- **`container-update-tool.md`** – Container configuration updates
- **`ddev-resources.md`** – DDEV local development environment integration

---

## 🔐 OAuth & Security

### OAuth Implementation
- **`oauth2c-end-to-end.md`** – Complete OAuth 2.1 + PKCE flow documentation
- **`oauth-testing-tools.md`** – OAuth regression testing automation
- **`claude-desktop-notes.md`** – Claude Desktop MCP integration notes

---

## 📋 Architecture & Planning

### Current Architecture
- **`mcp-cli-gap-architecture.md`** – CLI adapter pattern and gap analysis
- **`mcp-cli-gap-project-plan.md`** – CLI migration project plan
- **`interactive-commands-decision.md`** – Strategy for interactive CLI commands

### Project Reviews
- **`PATTERN-ADOPTION-REVIEW.md`** – C4 pattern adoption across destructive operations

---

## 📦 Reference Materials

### Tool Audits
- **`registry-tool-audit.md`** – Container registry tool analysis

### Configuration
- **`../config/mittwald-scopes.json`** – OAuth scope catalog
- **`../config/mw-cli-exclusions.json`** – Intentional CLI coverage gaps

### Testing
- **`../tests/README.md`** – Test matrix and environment setup

---

## 🗄️ Historical Documentation

### Archive Organization
All completed agent work, historical analyses, and superseded documentation has been moved to **`archive/`** with timestamped folders:

- **`archive/2025-10-4-MCP-Tooling-Completion-Refactor/`** – Complete agent-based development cycle
  - `agent-reviews/` – Final reviews for agents A1, B1-B2, C1-C6, D1-D3, E1, S1
  - `cli-adapter/` – CLI adapter migration agent prompts
  - Agent prompts and standards documentation

- **`archive/2025-10-Migrations/`** – Migration guides and backlog
  - Credential security migration
  - Registry/stack taxonomy updates

- **`archive/2025-10-oclif-invalid-regex-debug/`** – Technical debug session

- **`archive/2025-09-*.md`** – September OAuth/ChatGPT integration work

- **`archive/PATTERN-*.md`** – Pattern adoption planning and audits (superseded)

See **`archive/README.md`** for detailed archive navigation.

---

## 📌 Quick Navigation

### For New Developers
1. Start with `../README.md`
2. Read `../ARCHITECTURE.md`
3. Review `CREDENTIAL-SECURITY.md` (security required reading)
4. Check `tool-examples/` for usage patterns

### For Security Auditors
1. **`CREDENTIAL-SECURITY.md`** – Three-layer defense model
2. **`tool-safety/destructive-operations.md`** – C4 safety pattern
3. **`../tests/security/`** – Security test suite

### For Contributors
1. **`coverage-automation.md`** – How to add new CLI tools
2. **`mcp-cli-gap-architecture.md`** – CLI adapter pattern
3. **`CREDENTIAL-SECURITY.md`** – Security requirements for credential tools

### For OAuth Integration
1. **`oauth2c-end-to-end.md`** – Complete OAuth flow
2. **`claude-desktop-notes.md`** – MCP client setup
3. **`oauth-testing-tools.md`** – Testing utilities

---

## 🔄 Maintenance

### Auto-Generated Files
These files are automatically regenerated - do not edit manually:
- `mittwald-cli-coverage.md` – Regenerate with `npm run coverage:generate`

### When to Archive
Move documentation to `archive/YYYY-MM-DD-descriptive-name/` when:
- Project phase completes (e.g., agent-based development)
- Documentation is superseded by newer approach
- Historical context is valuable but not current guidance

### Index Updates
Update this index when:
- New operational documentation is created
- Major architectural changes occur
- Documentation is moved to archive

---

**For historical context and completed work, see:** `archive/README.md`
