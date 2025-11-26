# Work Packages: MCP Documentation Sprint

**Inputs**: Design documents from `/kitty-specs/002-mcp-documentation-sprint/`
**Prerequisites**: plan.md (required), spec.md (user stories), research.md

**Tests**: Not applicable (documentation only)

**Organization**: Fine-grained subtasks (`Txxx`) roll up into work packages (`WPxx`). Each work package produces one deliverable markdown file.

**Prompt Files**: Each work package references a matching prompt file in `tasks/planned/`.

## Subtask Format: `[Txxx] [P?] Description`
- **[P]** indicates the subtask can proceed in parallel (different sections).

---

## Work Package WP01: OAuth Scope Caching Documentation (Priority: P0) 🎯 MVP

**Goal**: Create `docs/oauth-scope-caching.md` explaining intentional session-scoped caching behavior.
**Independent Test**: Document exists, covers all sections from spec, no broken links.
**Prompt**: `tasks/planned/WP01-oauth-scope-caching.md`

### Included Subtasks
- [ ] T001 Create docs/ directory structure if needed
- [ ] T002 Write overview section explaining what scope caching is
- [ ] T003 [P] Write "Why This Behavior Exists" section (security/UX tradeoff)
- [ ] T004 [P] Write troubleshooting FAQ section ("why don't I see new permissions?")

### Implementation Notes
1. Create file at `docs/oauth-scope-caching.md`
2. Use research.md section on OAuth for technical details
3. Explain PKCE flow and session lifetime
4. Include re-authentication guidance

### Parallel Opportunities
- T003 and T004 can be written independently once T002 establishes structure.

### Dependencies
- None (first work package).

### Risks & Mitigations
- Misrepresenting OAuth behavior → cross-reference with actual implementation in src/oauth/

---

## Work Package WP02: Tool Concurrency Documentation (Priority: P0)

**Goal**: Create `docs/tool-concurrency.md` categorizing 173 tools (82 safe, 91 racy).
**Independent Test**: Document exists, all 173 tools listed, categories match research.md.
**Prompt**: `tasks/planned/WP02-tool-concurrency.md`

### Included Subtasks
- [ ] T005 Write summary section (82 safe, 91 racy overview)
- [ ] T006 [P] Write safe tools categorized list (by domain: App, Backup, Container, etc.)
- [ ] T007 [P] Write racy tools categorized list (by domain)
- [ ] T008 [P] Write MCP client recommendations section

### Implementation Notes
1. Create file at `docs/tool-concurrency.md`
2. Pull tool lists directly from research.md section 1
3. Format as collapsible details or tables for readability
4. Include criteria explanation (read-only vs mutations)

### Parallel Opportunities
- T006, T007, T008 can all proceed in parallel once T005 establishes structure.

### Dependencies
- None (can run parallel to WP01).

### Risks & Mitigations
- Tool count mismatch → validate against research.md totals (82 + 91 = 173)

---

## Work Package WP03: Claude Desktop Integration Guide (Priority: P1)

**Goal**: Create `docs/guides/claude-desktop.md` with setup and auth instructions.
**Independent Test**: Guide covers config location, JSON structure, both auth methods, mittwald examples.
**Prompt**: `tasks/planned/WP03-claude-desktop-guide.md`

### Included Subtasks
- [ ] T009 Write prerequisites and configuration file location section
- [ ] T010 [P] Write authentication methods section (env vars, mcp-remote proxy)
- [ ] T011 [P] Write mittwald-specific configuration examples
- [ ] T012 [P] Write troubleshooting and limitations section

### Implementation Notes
1. Create `docs/guides/` directory
2. Create file at `docs/guides/claude-desktop.md`
3. Use research.md section 2 for technical details
4. Include both macOS and Windows paths
5. Provide complete JSON examples for mittwald

### Parallel Opportunities
- T010, T011, T012 can proceed in parallel once T009 establishes structure.

### Dependencies
- T001 (directory creation) from WP01.

### Risks & Mitigations
- Outdated config format → note version/date at top of guide

---

## Work Package WP04: ChatGPT Integration Guide (Priority: P1)

**Goal**: Create `docs/guides/chatgpt.md` with Developer Mode setup and OAuth requirements.
**Independent Test**: Guide covers UI-based setup, OAuth requirements, mittwald compatibility notes.
**Prompt**: `tasks/planned/WP04-chatgpt-guide.md`

### Included Subtasks
- [ ] T013 Write prerequisites and Developer Mode setup section
- [ ] T014 [P] Write OAuth requirements section (endpoints, DCR, PKCE)
- [ ] T015 [P] Write mittwald-specific setup and limitations
- [ ] T016 [P] Write troubleshooting and platform limitations section

### Implementation Notes
1. Create file at `docs/guides/chatgpt.md`
2. Use research.md section 3 for technical details
3. Emphasize OAuth-only requirement (no API token)
4. Note 40-tool limit and per-chat Developer Mode requirement
5. Include OpenAI Platform API workaround for testing

### Parallel Opportunities
- T014, T015, T016 can proceed in parallel once T013 establishes structure.

### Dependencies
- docs/guides/ directory from WP03.

### Risks & Mitigations
- ChatGPT MCP support is newer/evolving → note as "as of 2025" and link official docs

---

## Work Package WP05: Cursor Integration Guide (Priority: P1)

**Goal**: Create `docs/guides/cursor.md` with config file setup and auth options.
**Independent Test**: Guide covers both global/project config, all auth methods, mittwald examples.
**Prompt**: `tasks/planned/WP05-cursor-guide.md`

### Included Subtasks
- [ ] T017 Write prerequisites and configuration file locations section
- [ ] T018 [P] Write authentication methods section (env vars, headers, OAuth)
- [ ] T019 [P] Write mittwald-specific configuration examples
- [ ] T020 [P] Write quirks, limitations, and troubleshooting section

### Implementation Notes
1. Create file at `docs/guides/cursor.md`
2. Use research.md section 4 for technical details
3. Compare to Claude Desktop format (baseline)
4. Highlight native remote server support via `url` field
5. Include project-specific `.cursor/mcp.json` option

### Parallel Opportunities
- T018, T019, T020 can proceed in parallel once T017 establishes structure.

### Dependencies
- docs/guides/ directory from WP03.

### Risks & Mitigations
- Cursor updates frequently → note version tested and link official docs

---

## Dependency & Execution Summary

```
WP01 (OAuth docs)  ─────┐
                        ├──→ WP03 (Claude Desktop) ──→ WP04 (ChatGPT) ──→ WP05 (Cursor)
WP02 (Concurrency) ─────┘
```

- **Sequence**: WP01 and WP02 can run in parallel. WP03-WP05 depend on docs/guides/ directory.
- **Parallelization**: Within each WP, sections marked [P] can be written concurrently.
- **MVP Scope**: WP01 (OAuth) + WP02 (Concurrency) = minimum useful documentation.

---

## Subtask Index (Reference)

| Subtask ID | Summary | Work Package | Priority | Parallel? |
|------------|---------|--------------|----------|-----------|
| T001 | Create docs/ directory structure | WP01 | P0 | No |
| T002 | OAuth overview section | WP01 | P0 | No |
| T003 | OAuth "Why This Behavior" section | WP01 | P0 | Yes |
| T004 | OAuth troubleshooting FAQ | WP01 | P0 | Yes |
| T005 | Tool concurrency summary | WP02 | P0 | No |
| T006 | Safe tools categorized list | WP02 | P0 | Yes |
| T007 | Racy tools categorized list | WP02 | P0 | Yes |
| T008 | MCP client recommendations | WP02 | P0 | Yes |
| T009 | Claude Desktop prerequisites/config | WP03 | P1 | No |
| T010 | Claude Desktop auth methods | WP03 | P1 | Yes |
| T011 | Claude Desktop mittwald examples | WP03 | P1 | Yes |
| T012 | Claude Desktop troubleshooting | WP03 | P1 | Yes |
| T013 | ChatGPT prerequisites/setup | WP04 | P1 | No |
| T014 | ChatGPT OAuth requirements | WP04 | P1 | Yes |
| T015 | ChatGPT mittwald setup | WP04 | P1 | Yes |
| T016 | ChatGPT troubleshooting | WP04 | P1 | Yes |
| T017 | Cursor prerequisites/config | WP05 | P1 | No |
| T018 | Cursor auth methods | WP05 | P1 | Yes |
| T019 | Cursor mittwald examples | WP05 | P1 | Yes |
| T020 | Cursor quirks/troubleshooting | WP05 | P1 | Yes |
