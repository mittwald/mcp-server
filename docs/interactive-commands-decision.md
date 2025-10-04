# Interactive Command Exclusion Decision

**Date**: 2025-10-04  
**Agent**: E3 (Interactive Command Assessment)  
**Status**: PERMANENTLY EXCLUDED

---

## MCP Streaming Capability Assessment

### Protocol Support
- MCP tool calls must resolve to a single `CallToolResult` payload; the SDK exposes no hooks for incremental stdout/stderr (`node_modules/@modelcontextprotocol/sdk/dist/esm/types.js:842`).
- The `Server` implementation only accepts synchronous/Promise handlers that complete with a JSON result (`node_modules/@modelcontextprotocol/sdk/dist/esm/server/index.js:32`).
- Streamable HTTP transport enables SSE notifications (progress, logging) but not streaming tool responses or stdin piping (`node_modules/@modelcontextprotocol/sdk/dist/esm/server/streamableHttp.js:1`).

### Examples Found
- SDK example clients (`node_modules/@modelcontextprotocol/sdk/dist/esm/examples`) all await a final JSON response; none stream tool output.
- No community or official references to interactive MCP tools were discovered during codebase review.

### Conclusion
MCP v2025-06-18 does **not** support streaming tool output or interactive stdin. The protocol's request/response contract precludes long-lived shells or port forwards.

## Streaming Prototype Results
- Prototype not attempted: the CLI adapter buffers output via `child_process.exec`, which only returns after the process exits and provides no stdin channel (`src/utils/cli-wrapper.ts:1`).
- Without protocol support, a streaming wrapper cannot deliver intermediate data or handle prompts for user input.

## Security Risk Assessment
- Not conducted. Interactive support is blocked at the protocol layer, so a security review would not lead to deployable functionality.

## Security Team Decision
- Not requested; technical infeasibility prevents exposure of interactive commands via MCP.

---

## Executive Summary
Interactive Mittwald CLI commands that require a TTY or bidirectional streaming cannot be surfaced through MCP. The protocol delivers a single JSON response per tool invocation, and our CLI wrapper buffers stdout/stderr until completion. Attempting to expose `exec`, `ssh`, or database shells would produce truncated output and hang on input requests, so these commands remain permanently excluded and are tracked in `config/mw-cli-exclusions.json`.

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
- Tool handlers have no streaming surface area; handlers must return a completed payload (`node_modules/@modelcontextprotocol/sdk/dist/esm/server/index.js:32`).
- `CallToolResult` contains only structured content blocks and optional JSON output—no fields for incremental frames or stdin acknowledgements (`node_modules/@modelcontextprotocol/sdk/dist/esm/types.js:842`).
- Streamable HTTP transport emits SSE events for notifications but still expects each request to produce either a JSON response or an error (`node_modules/@modelcontextprotocol/sdk/dist/esm/server/streamableHttp.js:1`).

### Why Interactive Commands Don't Fit
- MCP clients cannot send follow-up stdin once a tool call starts; commands like `app exec` would hang waiting for user input.
- ANSI escape sequences and terminal control codes emitted by shells would be lossy or rejected when encoded as JSON content blocks.
- Port forwarding requires persistent sockets that extend beyond the request lifetime, which MCP tooling does not provide.
- `invokeCliTool` executes the `mw` binary with `exec`, buffering stdout/stderr and returning only after process exit (`src/tools/cli-adapter.ts:41`). There is no hook to stream data back progressively.

---

## Security Considerations
If MCP eventually supports streaming, a fresh security review must address:
- Command injection safeguards when the LLM crafts shell arguments.
- Audit logging for remote shell or port-forward sessions.
- Policies for credential redaction in interactive output.

For now, security review is deferred because implementation is infeasible.

---

## Alternative Approaches
1. Use the `mw` CLI directly in a local terminal for interactive workflows.
2. Access Mittwald's dashboard to open container shells or database consoles.
3. Run port-forwarding outside the MCP context (e.g., `mw container port-forward`).

---

## Coverage Impact
After updating the exclusion list and regenerating the coverage artifacts (`npm run coverage:generate` on 2025-10-04),
- Total CLI commands: 178
- Covered by MCP tools: 168
- Excluded (interactive): 10
- Missing (action required): 0
- Effective coverage: 100%

---

## Future Reconsideration
- Revisit if MCP introduces bidirectional streaming or WebSocket transports.
- Re-evaluate when the SDK exposes stdin/stdout streaming primitives.
- Coordinate with security once protocol support exists and policy controls are defined.

---

**Approved by**: Pending stakeholder sign-off  
**Review date**: 2026-04-01
