# Plan: Exercise Tooling Surface and Registry Behavior

## Agent Brief
You are the LLM engineer tasked with hardening the MCP tooling layer. Build fixtures, extend tests, and update docs so the tool registry, schema validation, and CLI wrapper are thoroughly verified. Complete each checklist item exactly—if ambiguity arises, document assumptions in-code.

## Goal
Ensure the dynamic tool registry, schema handling, and CLI invocation logic are verified end-to-end so broken tools or misconfigured schemas are caught before release.

## Deliverables
1. Automated tests for `tool-scanner` covering inclusion/exclusion rules and error handling.
2. Validation of schema-driven argument checking for representative tools.
3. Smoke tests that confirm key CLI tools execute via `SessionAwareCli` with mocked CLI output.

## Work Breakdown

### Phase 1: Tool Registry Scanning
- [ ] **Add fixture tool modules** in `tests/fixtures/tools/` with the following cases:
  - Valid CLI tool registration (default export).
  - Duplicate tool name to trigger duplicate detection.
  - Tool in excluded list (e.g., `mittwald_login_reset`).
  - Module missing handler to ensure warning path executed.
- [ ] **Write tests for `loadTools`**
  - Verify valid tools are registered with schemas.
  - Ensure excluded tool is skipped and logged.
  - Confirm duplicate names result in warning and only first registration kept.
- [ ] **Test `scanTools` summary output**
  - Validate `failures[]` entries for malformed files.

### Phase 2: Schema Validation Coverage
- [ ] **Select representative tools** (`mittwald_project_list`, `mittwald_domain_virtualhost_create`, etc.).
- [ ] **Write unit tests for `handleToolCall`** using mocked `invokeCliTool` to assert:
  - Required fields produce validation errors.
  - Enum/boolean coercion works as expected.
  - Optional fields can be omitted without failures.
- [ ] **Add regression case** for tool with schema missing property to ensure fallback to `z.any()` path still works.

### Phase 3: CLI Smoke Tests
- [ ] **Extend CLI exec mocks** to capture environment variables and arguments.
- [ ] **Create tests** that run `handleToolCall` for:
  - Happy path: CLI returns JSON and response is formatted.
  - CLI failure: `CliToolError` surfaces user-friendly message.
  - Authentication failure classification (stderr contains “unauthorized”).
- [ ] **Add coverage for `tool-filter`**
  - Validate pagination, category filtering, and allowed-tools override.
  - Ensure configuration flags (`TOOL_FILTER_ENABLED`) change behavior.

### Phase 4: Documentation
- [ ] Update `tests/README.md` with new tool-related suites and usage examples.
- [ ] Capture lessons learned for adding schemas when introducing new tools.

## Definition of Done
- Running `pnpm test:tools` (new script) executes all registry + handler tests.
- CI fails if a tool schema or registration regression occurs.
- Tool filtering behavior is locked down by automated tests.
