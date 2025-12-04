# Feature Specification: Session Log Analysis for LLM Efficiency

**Feature Branch**: `006-session-log-analysis`
**Created**: 2025-12-04
**Status**: Draft
**Input**: Comprehensively analyze 595 session logs from the 005-mcp-functional-test sprint to identify LLM confusion patterns, tool dependencies, and optimization opportunities. The analysis will inform both MCP server improvements and user documentation. Two audiences: LLMs via MCP and human end users. LLM confusion is a proxy for human confusion.

## Clarifications

### Session 2025-12-04
- Q: What confusion patterns should be detected? ’ A: All patterns - wrong tool selection, retry loops, unnecessary sub-agent spawning, time/token waste from exploration vs direct execution.
- Q: What outputs are expected? ’ A: Structured JSON/Markdown reports, tool dependency graphs, categorized confusion incidents, recommended tool chains for common use cases.
- Q: What analysis scope? ’ A: Comprehensive file-by-file analysis of all 595 sessions, organized by the 10 functional domains from 005.
- Q: Who are the audiences? ’ A: LLMs (via MCP) and human end users. LLM confusion indicates human confusion.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Parse and Index Session Logs (Priority: P1)

An analyst runs the log parser to ingest all 595 JSONL session logs and extract structured data about tool calls, errors, timing, and token usage. The parser creates an indexed corpus for subsequent analysis.

**Why this priority**: Without parsed and indexed data, no analysis can occur. This is the foundation for all other functionality.

**Independent Test**: Run parser on 10 sample logs and verify extracted events match the raw JSONL content.

**Acceptance Scenarios**:

1. **Given** the session logs directory exists at `tests/functional/session-logs/005-mcp-functional-test/`, **When** the parser runs, **Then** all 595 files are processed without error.
2. **Given** a JSONL log file, **When** parsed, **Then** tool calls, tool results, errors, timestamps, and token counts are extracted into a normalized structure.
3. **Given** parsed data, **When** indexed, **Then** sessions are grouped by their target MCP tool and functional domain.

---

### User Story 2 - Detect Confusion Patterns (Priority: P1)

An analyst runs the pattern detector to identify instances where the LLM exhibited confusion, inefficiency, or suboptimal behavior. Each incident is categorized and scored.

**Why this priority**: Pattern detection is the core analytical value - without it, the logs are just raw data.

**Independent Test**: Run detector on a known-confusing session (e.g., `0616a506-15b4-466f-9793-44ceebe2a82f.jsonl`) and verify it identifies the SlashCommand ’ Glob ’ WebSearch ’ Task chain as confusion.

**Acceptance Scenarios**:

1. **Given** a session where the LLM used SlashCommand instead of an MCP tool, **When** analyzed, **Then** a "wrong-tool-selection" incident is recorded with the tool attempted and tool needed.
2. **Given** a session with 3+ consecutive errors before success, **When** analyzed, **Then** a "retry-loop" incident is recorded with iteration count and total time wasted.
3. **Given** a session where a Task sub-agent was spawned for something achievable directly, **When** analyzed, **Then** an "unnecessary-delegation" incident is recorded with token cost.
4. **Given** a session with >60 seconds between tool calls, **When** analyzed, **Then** a "stuck-indicator" incident is recorded.
5. **Given** a session using unsupported features (e.g., WebSearch on Haiku), **When** analyzed, **Then** a "capability-mismatch" incident is recorded.

---

### User Story 3 - Map Tool Dependencies (Priority: P1)

An analyst runs the dependency mapper to discover which MCP tools require other tools to be called first. This produces a directed graph of tool prerequisites.

**Why this priority**: Dependency chains are critical for both LLM prompting and user documentation.

**Independent Test**: Analyze sessions for `app/create` and verify it detects `project/create` or `project/get` as prerequisites.

**Acceptance Scenarios**:

1. **Given** sessions where tool A always follows tool B, **When** analyzed across multiple sessions, **Then** B’A is recorded as a likely dependency.
2. **Given** sessions where tool A failed with "project not found" then succeeded after `project/get`, **When** analyzed, **Then** `project/get`’A is recorded as a required dependency.
3. **Given** all dependency relationships, **When** exported, **Then** a directed graph (DOT format or JSON adjacency list) is produced.
4. **Given** the dependency graph, **When** rendered, **Then** tools are grouped by their functional domain.

---

### User Story 4 - Generate Domain Reports (Priority: P2)

An analyst generates per-domain reports summarizing findings for each of the 10 functional domains. Reports include confusion counts, dependency chains, and efficiency metrics.

**Why this priority**: Domain-level reports make findings actionable for specific API areas.

**Independent Test**: Generate report for "automation" domain (cronjob tools) and verify it contains all sessions testing cronjob tools.

**Acceptance Scenarios**:

1. **Given** parsed sessions grouped by domain, **When** report is generated for a domain, **Then** it includes: session count, tool coverage, confusion incidents, and dependency chains.
2. **Given** confusion incidents in a domain, **When** reported, **Then** incidents are sorted by severity (token waste × frequency).
3. **Given** all 10 domains, **When** reports are generated, **Then** a summary index links to each domain report.

---

### User Story 5 - Generate Tool Chain Recommendations (Priority: P2)

An analyst generates recommended tool chains for common use cases based on successful session patterns. These become templates for LLM prompting and user guides.

**Why this priority**: Actionable recommendations translate analysis into value.

**Independent Test**: Generate recommendation for "deploy an app" use case and verify it lists the correct tool sequence.

**Acceptance Scenarios**:

1. **Given** successful sessions achieving a goal (e.g., "create project and app"), **When** analyzed, **Then** the common tool sequence is extracted as a recommended chain.
2. **Given** multiple paths to the same goal, **When** compared, **Then** the most efficient path (fewest tools, lowest tokens) is marked as recommended.
3. **Given** recommended chains, **When** exported, **Then** each includes: use case name, tool sequence, required parameters, and example prompts.

---

### User Story 6 - Export Analysis Artifacts (Priority: P3)

An analyst exports all analysis results to structured files for use in future sprints (MCP improvements, documentation generation).

**Why this priority**: Persistence ensures analysis work is not lost and can be consumed by other tools.

**Independent Test**: Run full export and verify all expected files are created with valid JSON/Markdown.

**Acceptance Scenarios**:

1. **Given** completed analysis, **When** exported, **Then** files are written to `kitty-specs/006-session-log-analysis/output/`.
2. **Given** confusion incidents, **When** exported, **Then** `incidents.json` contains all categorized incidents with session references.
3. **Given** dependency graph, **When** exported, **Then** `dependencies.json` and `dependencies.dot` are created.
4. **Given** domain reports, **When** exported, **Then** `reports/{domain}.md` files are created for all 10 domains.
5. **Given** tool chain recommendations, **When** exported, **Then** `recommendations.json` and `recommendations.md` are created.

---

### Edge Cases

- What happens when a session log is malformed or truncated? ’ Parser logs error and continues with remaining files.
- What happens when a session has no tool calls? ’ Session is marked as "empty" and excluded from tool-specific analysis.
- What happens when dependency detection finds circular references? ’ Cycles are logged as warnings and the graph remains acyclic (latest edge wins).
- What happens when a tool appears in 0 sessions? ’ Tool is listed as "untested" in coverage reports.

## Requirements *(mandatory)*

### Functional Requirements

#### Parsing & Indexing (FR-01x)
- **FR-011**: System MUST parse JSONL session logs extracting: type, timestamp, sessionId, message content, tool calls, tool results, token usage.
- **FR-012**: System MUST handle both UUID-named sessions (main sessions) and agent-prefixed files (sub-agent logs).
- **FR-013**: System MUST link sub-agent logs to their parent session via the `parentUuid` field.
- **FR-014**: System MUST assign each session to one of the 10 functional domains based on the tool under test.
- **FR-015**: System MUST create an index mapping: sessionId ’ file path, tool ’ sessions, domain ’ sessions.

#### Confusion Detection (FR-02x)
- **FR-021**: System MUST detect "wrong-tool-selection" when tool_use targets an inappropriate tool (e.g., SlashCommand for MCP tool).
- **FR-022**: System MUST detect "retry-loop" when 3+ consecutive tool calls fail before success.
- **FR-023**: System MUST detect "unnecessary-delegation" when Task agent is spawned for single-tool operations.
- **FR-024**: System MUST detect "stuck-indicator" when >60 seconds elapse between tool calls without user input.
- **FR-025**: System MUST detect "capability-mismatch" when tool fails due to model limitations (e.g., WebSearch on Haiku).
- **FR-026**: System MUST detect "exploration-waste" when >3 exploratory tools (Glob, Grep, Read) precede the target MCP tool.
- **FR-027**: System MUST calculate token waste for each incident (tokens spent on failed/unnecessary operations).
- **FR-028**: System MUST assign severity scores based on: token waste × time waste × frequency across corpus.

#### Dependency Mapping (FR-03x)
- **FR-031**: System MUST track tool call sequences within each session.
- **FR-032**: System MUST identify prerequisite relationships when tool B consistently precedes tool A.
- **FR-033**: System MUST identify error-recovery dependencies when failure message mentions missing resource that another tool provides.
- **FR-034**: System MUST produce a directed acyclic graph of tool dependencies.
- **FR-035**: System MUST group tools by functional domain in the dependency visualization.

#### Reporting (FR-04x)
- **FR-041**: System MUST generate a summary report with corpus-wide statistics.
- **FR-042**: System MUST generate per-domain reports for all 10 domains.
- **FR-043**: System MUST include in each domain report: session count, tools tested, confusion incidents, dependencies, efficiency metrics.
- **FR-044**: System MUST rank confusion incidents by impact (severity × frequency).
- **FR-045**: System MUST generate recommended tool chains for identified use cases.

#### Export (FR-05x)
- **FR-051**: System MUST export incidents as JSON with schema: `{id, type, severity, sessionId, toolAttempted, toolNeeded, tokenWaste, timeWaste, context}`.
- **FR-052**: System MUST export dependencies as JSON adjacency list and DOT format.
- **FR-053**: System MUST export domain reports as Markdown files.
- **FR-054**: System MUST export tool chain recommendations as JSON and Markdown.
- **FR-055**: System MUST create a manifest file listing all generated artifacts.

### Key Entities

- **Session**: A single Claude Code execution with sessionId, log file path, target tool, domain, events, and metrics.
- **Event**: A parsed log entry with type (user/assistant/tool_use/tool_result), timestamp, content, and token usage.
- **Incident**: A detected confusion pattern with type, severity, session reference, token waste, and context.
- **Dependency**: A directed edge from prerequisite tool to dependent tool with confidence score and evidence sessions.
- **ToolChain**: A recommended sequence of tools for a use case with parameters and example prompts.
- **DomainReport**: Aggregated findings for one functional domain with statistics, incidents, and recommendations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 595 session logs are successfully parsed with <1% error rate.
- **SC-002**: At least 5 distinct confusion pattern types are detected across the corpus.
- **SC-003**: Dependency graph covers all tools that appear in 3+ sessions.
- **SC-004**: Reports are generated for all 10 functional domains.
- **SC-005**: At least 10 recommended tool chains are identified for common use cases.
- **SC-006**: All artifacts are exported to the output directory with valid JSON/Markdown.
- **SC-007**: Analysis completes within 10 minutes on the full corpus.
- **SC-008**: Findings are actionable - each confusion type has a clear path to remediation (for future sprint).

## Data Source

**Location**: `tests/functional/session-logs/005-mcp-functional-test/`
**Files**: 595 JSONL files (main sessions + sub-agent logs)
**Size**: ~13MB total
**Format**: Newline-delimited JSON with event types: queue-operation, user, assistant, tool_use, tool_result

## Functional Domains (from 005)

| Domain | Tool Patterns | Description |
|--------|--------------|-------------|
| identity | user/, login/, context/ | User authentication and context |
| organization | org/, extension/ | Organization management |
| project-foundation | project/, server/ | Projects and servers |
| apps | app/ | Application management |
| containers | container/, stack/, volume/, registry/ | Container orchestration |
| databases | database/ | Database management |
| domains-mail | domain/, mail/ | Domains and email |
| access-users | sftp/, ssh/ | Access credentials |
| automation | cronjob/ | Scheduled tasks |
| backups | backup/ | Backup management |

## Assumptions

- Session logs are complete and not corrupted (validated during 005 sprint).
- The JSONL format matches Claude Code 2.0.58+ output schema.
- Sub-agent logs can be correlated to parent sessions via parentUuid.
- Tool names follow the `mcp__mittwald__mittwald_{tool}` pattern.
- Analysis will be run on a developer machine with sufficient memory for 13MB corpus.
