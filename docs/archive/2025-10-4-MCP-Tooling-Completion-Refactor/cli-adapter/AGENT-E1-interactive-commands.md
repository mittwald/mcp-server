# Agent E1: Interactive Command Assessment & Strategy

**Agent ID**: E1
**Task**: Assess feasibility of interactive CLI commands and implement or document exclusions
**Duration**: 2-3 days
**Priority**: Medium (strategic decision-making)
**Dependencies**: A1 (exclusion framework)

---

## Objective

Determine whether interactive/streaming CLI commands can be supported in the MCP tool model, and either implement streaming wrappers or document permanent exclusions with security/technical rationale.

---

## Context

**Current State**:
- 7+ CLI commands require interactive TTY or streaming (exec, ssh, port-forward, shell, cp)
- MCP tool responses are synchronous request-response (no streaming support)
- No security policy for exposing SSH/port-forward operations via MCP
- Commands currently absent from coverage (appears as gaps)

**Target State**:
- Clear technical feasibility assessment documented
- Security review completed (if streaming feasible)
- Either: Streaming wrappers implemented, OR
- Permanent exclusions documented in `config/mw-cli-exclusions.json`
- Coverage tracking reflects exclusions (0% gap if excluded)

---

## Interactive Commands in Scope

### High Priority (User Impact)
1. **`app exec`** - Execute commands in app containers
2. **`container exec`** - Execute commands in generic containers
3. **`container ssh`** - SSH into containers
4. **`database redis shell`** - Interactive Redis REPL

### Medium Priority (Developer Tools)
5. **`container port-forward`** - Port forwarding for local development
6. **`database mysql shell`** - Interactive MySQL shell
7. **`database mysql phpmyadmin`** - Launch phpMyAdmin

### Lower Priority (Niche Use Cases)
8. **`container cp`** - Copy files to/from containers (may support read-only mode)

---

## Phase 1: Technical Feasibility Assessment (Day 1)

### Task 1.1: MCP Protocol Research

**Goal**: Determine if MCP supports streaming or long-lived connections

**Research Questions**:
- Does MCP protocol support streaming responses?
- Can tools return progressive updates (like SSE or WebSocket)?
- Are there MCP extensions for terminal emulation?
- Has Anthropic published guidance on interactive tools?

**Investigation Steps**:
1. Review MCP specification: https://spec.modelcontextprotocol.io/
2. Check `@modelcontextprotocol/sdk` for streaming APIs
3. Search for examples of streaming MCP tools
4. Review `src/server/mcp.ts` for transport capabilities

**Document Findings**:
```markdown
## MCP Streaming Capability Assessment

### Protocol Support
- [ ] MCP supports streaming: [YES/NO]
- [ ] Transport type: [HTTP/WebSocket/StdIO]
- [ ] Relevant APIs: [list SDK methods]

### Examples Found
- [ ] GitHub repos with streaming MCP tools: [links]
- [ ] Official examples: [links]
- [ ] Community discussions: [links]

### Conclusion
[Can we support streaming? YES/NO/MAYBE]
[If MAYBE, what constraints exist?]
```

### Task 1.2: Prototype Streaming Handler (If Feasible)

**Goal**: Build minimal proof-of-concept for streaming command output

**Only attempt if Task 1.1 finds streaming support**

**Prototype**: `src/handlers/tools/mittwald-cli/container/exec-streaming-cli.ts`

```typescript
import { invokeCliTool } from '@/tools/index.js';
import { spawn } from 'child_process';

export const handleContainerExecStreamingCli = async (args: any, context: any) => {
  // Attempt streaming approach
  const proc = spawn('mw', [
    'container', 'exec', args.containerId,
    '--project-id', args.projectId,
    '--', ...args.command
  ]);

  // TODO: How to stream stdout/stderr back to MCP client?
  // Option 1: Progressive tool responses (if MCP supports)
  // Option 2: SSE-style events
  // Option 3: Not possible

  return formatToolResponse('error', 'Streaming not yet implemented');
};
```

**Test**:
- Can we send progressive responses?
- Does MCP client receive updates in real-time?
- What happens with interactive input (stdin)?

**Document Outcome**:
```markdown
## Streaming Prototype Results

### Approach Tested
[Describe what was tried]

### Results
- [ ] Streaming output works: [YES/NO]
- [ ] Interactive input works: [YES/NO]
- [ ] MCP client compatibility: [GOOD/POOR/UNKNOWN]

### Blockers
[List technical limitations]

### Recommendation
[PROCEED with implementation / EXCLUDE from coverage]
```

---

## Phase 2: Security & Policy Review (Day 2)

**Only proceed if Phase 1 shows streaming is technically feasible**

### Task 2.1: Security Risk Assessment

**Goal**: Identify security risks of exposing SSH/exec via MCP

**Risks to Evaluate**:

1. **Command Injection**
   - Can malicious prompts inject arbitrary commands?
   - Are there safeguards in MCP client (Claude Code, Cline)?
   - Do we trust the OAuth token scope to limit damage?

2. **Shell Access Exposure**
   - Does exec/ssh give full shell access to containers?
   - Can users escalate privileges within containers?
   - Are container environments isolated sufficiently?

3. **Port Forwarding Security**
   - Can port-forward expose internal services to public?
   - Are there rate limits or abuse prevention?

4. **Credential Leakage**
   - Could interactive shells leak credentials in output?
   - Do we need to redact shell output (hard with ANSI codes)?

**Document Findings**:
```markdown
## Security Risk Assessment

### Command Injection
- Risk Level: [LOW/MEDIUM/HIGH]
- Mitigation: [describe]

### Shell Access
- Risk Level: [LOW/MEDIUM/HIGH]
- Mitigation: [describe]

### Port Forwarding
- Risk Level: [LOW/MEDIUM/HIGH]
- Mitigation: [describe]

### Credential Leakage
- Risk Level: [LOW/MEDIUM/HIGH]
- Mitigation: [describe]

### Overall Risk
[ACCEPTABLE / REQUIRES MITIGATION / UNACCEPTABLE]
```

### Task 2.2: Security Team Consultation

**Stakeholders**:
- Security engineer (if available)
- Platform team lead
- Product owner

**Questions for Security Team**:
1. Is exposing SSH/exec via AI-driven MCP acceptable?
2. What additional safeguards are required?
3. Are there compliance concerns (SOC2, ISO 27001)?
4. Do we need audit logging beyond current implementation?

**Document Outcome**:
```markdown
## Security Team Decision

### Date: [DATE]
### Attendees: [Names]

### Decision
- [ ] APPROVED: Interactive commands can be implemented with conditions
- [ ] CONDITIONAL: Requires additional safeguards (list below)
- [ ] DENIED: Too high risk, exclude permanently

### Conditions (if approved)
1. [Condition 1]
2. [Condition 2]

### Rationale
[Security team's reasoning]
```

---

## Phase 3A: Implementation (If Approved) (Day 3)

**Only proceed if Phase 2 approves**

### Task 3A.1: Implement Streaming Wrappers

**Commands to Implement** (Priority order):
1. `container exec` (highest user value)
2. `app exec` (second highest)
3. `database redis shell`
4. `container ssh`
5. `container port-forward` (if security approves)

**Pattern**:
```typescript
import { invokeCliTool } from '@/tools/index.js';
import { formatToolResponse } from '@/tools/response-formatter.js';

export const handleContainerExecCli = async (args: any, context: any) => {
  // Implement streaming logic based on Phase 1 findings
  // Add security safeguards from Phase 2 conditions

  try {
    const result = await invokeStreamingCliTool({
      toolName: 'mittwald_container_exec',
      argv: ['container', 'exec', args.containerId, '--', ...args.command],
      context,
      streamOutput: true, // New feature
    });

    return formatToolResponse('success', 'Command executed', { output: result.stream });
  } catch (error) {
    return formatToolResponse('error', 'Execution failed', { error: error.message });
  }
};
```

### Task 3A.2: Testing

**Tests Required**:
- [ ] Unit tests for each streaming handler
- [ ] Integration test: Execute simple command (echo)
- [ ] Integration test: Interactive command (stdin handling)
- [ ] Security test: Command injection prevention
- [ ] Security test: Credential redaction in output

### Task 3A.3: Documentation

**Update Files**:
1. `docs/tool-examples/container-interactive.md` - Usage examples
2. `docs/ARCHITECTURE.md` - Streaming architecture section
3. `README.md` - Note streaming support

---

## Phase 3B: Exclusion Documentation (If Denied) (Day 3)

**Proceed if Phase 1 shows infeasibility OR Phase 2 denies**

### Task 3B.1: Update Exclusion Config

**File**: `config/mw-cli-exclusions.json`

```json
{
  "commands": [
    "app exec",
    "container cp",
    "container exec",
    "container port-forward",
    "container ssh",
    "database mysql phpmyadmin",
    "database mysql shell",
    "database redis shell"
  ],
  "rationale": {
    "app exec": "Requires interactive TTY - not supported by MCP synchronous tool model. See docs/interactive-commands-decision.md",
    "container cp": "Requires bidirectional file streaming - MCP tools cannot handle binary file transfer",
    "container exec": "Requires interactive shell with stdin/stdout streaming - not supported by MCP",
    "container port-forward": "Requires persistent connection - incompatible with MCP request-response model",
    "container ssh": "Requires SSH TTY with ANSI terminal codes - not supported by MCP",
    "database mysql phpmyadmin": "Launches browser-based tool - out of scope for CLI automation",
    "database mysql shell": "Requires interactive MySQL REPL - not supported by MCP",
    "database redis shell": "Requires interactive Redis REPL - not supported by MCP"
  },
  "technicalDecision": {
    "date": "2025-10-02",
    "assessedBy": "Agent E1",
    "mcpStreamingSupport": false,
    "securityApproval": "N/A - technically infeasible",
    "documentationLink": "docs/interactive-commands-decision.md"
  }
}
```

### Task 3B.2: Create Decision Document

**File**: `docs/interactive-commands-decision.md`

```markdown
# Interactive Command Exclusion Decision

**Date**: 2025-10-02
**Agent**: E1 (Interactive Command Assessment)
**Status**: PERMANENTLY EXCLUDED

---

## Executive Summary

After technical feasibility assessment and security review, interactive CLI commands requiring TTY/streaming are **permanently excluded** from MCP tool coverage due to [MCP protocol limitations / security concerns / both].

---

## Commands Excluded

1. app exec
2. container cp
3. container exec
4. container port-forward
5. container ssh
6. database mysql phpmyadmin
7. database mysql shell
8. database redis shell

---

## Technical Assessment

### MCP Protocol Limitations
[Describe findings from Phase 1]
- MCP tools are synchronous request-response
- No streaming support in protocol version X.Y
- No plans for streaming in roadmap

### Why Interactive Commands Don't Fit
- **stdin requirement**: MCP has no mechanism for progressive user input
- **ANSI codes**: Terminal control codes incompatible with JSON responses
- **Long-lived connections**: Tools must complete within timeout (2-10 minutes)

---

## Security Considerations

[If Phase 2 was conducted, include findings]
[If Phase 1 blocked, explain security was not assessed due to infeasibility]

---

## Alternative Approaches

Users needing interactive access should:
1. Use `mw` CLI directly (not via MCP)
2. Access container shell via mittwald dashboard
3. Use port-forward outside of MCP context

---

## Coverage Impact

With these 8 commands excluded, CLI coverage is:
- Total commands: 178
- Covered by tools: 137
- Excluded (interactive): 8
- Missing (should implement): 33
- **Effective coverage**: 81.8% ((137 + 8) / 178)

---

## Future Reconsideration

This decision will be revisited if:
- MCP protocol adds streaming support
- Alternative transport (WebSocket) becomes available
- Security team approves with robust safeguards

---

**Approved by**: [Name/Role]
**Review date**: [DATE]
```

### Task 3B.3: Update Coverage Tooling

**File**: `scripts/generate-mw-coverage.ts`

Ensure exclusion config is loaded and excluded commands don't count as "missing":

```typescript
const exclusions = loadExclusions(); // from config/mw-cli-exclusions.json

coverage.summary.missingCommands = cliCommands.filter(cmd => {
  const covered = mcpTools.has(cmd.fullCommand);
  const excluded = exclusions.has(cmd.fullCommand);
  return !covered && !excluded; // Don't count excluded as missing
}).length;

coverage.summary.excludedCommands = exclusions.size;
coverage.summary.coveragePercent =
  ((coverage.summary.coveredCommands + coverage.summary.excludedCommands) /
   coverage.summary.totalCommands) * 100;
```

---

## Deliverables

**If Streaming Implemented** (Phase 3A):
- [ ] 5-8 streaming tool handlers
- [ ] Unit tests for all
- [ ] Integration tests
- [ ] Security tests
- [ ] Documentation (architecture + examples)
- [ ] Updated coverage report

**If Excluded** (Phase 3B):
- [ ] `config/mw-cli-exclusions.json` updated
- [ ] `docs/interactive-commands-decision.md` created
- [ ] Coverage script updated to handle exclusions
- [ ] `docs/mittwald-cli-coverage.md` regenerated (if Agent A1 done)

---

## Success Criteria

- [ ] Feasibility assessment completed and documented
- [ ] Security review conducted (if applicable)
- [ ] Either: Streaming wrappers working, OR exclusions documented
- [ ] Coverage tracking reflects decision (no false "missing" reports)
- [ ] Stakeholders approve decision

---

## Dependencies & Blockers

**Requires**:
- Agent A1 (exclusion framework in coverage tooling)

**Blocked By**:
- MCP protocol limitations (if no streaming support)
- Security team availability (for approval)

---

## Risk Mitigation

### Risk: Streaming Complexity
**Mitigation**: Start with simplest command (container exec with static command), then expand if successful

### Risk: Security Denial
**Mitigation**: Have exclusion path ready (Phase 3B) as fallback

### Risk: Time Overrun
**Mitigation**: Timebox Phase 1 to 1 day max; if inconclusive, default to exclusion

---

## Related Documentation

- **Agent A1**: `docs/agent-prompts/cli-adapter/AGENT-A1-coverage-tooling.md` (Exclusion config)
- **Architecture**: `docs/mcp-cli-gap-architecture.md` (Section 4: Constraints)
- **Project Plan**: `docs/mcp-cli-gap-project-plan.md` (Workstream D)

---

**Agent Status**: Ready to execute
**Estimated Effort**: 2-3 days
**Next Steps**: Start with Phase 1 (feasibility assessment)
