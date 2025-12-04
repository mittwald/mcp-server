# Quickstart: MCP Functional Test Suite

## Prerequisites

1. **Claude Code** installed and authenticated
2. **Node.js 20+** installed
3. **MCP Server** accessible at `https://mittwald-mcp-fly2.fly.dev/mcp`
4. **Mittwald API Token** configured (for harness resource setup)

## Installation

```bash
cd tests/functional
npm install
```

## Configuration

### 1. Claude Code Log Retention

Extend log retention to preserve session data:

```bash
# Edit ~/.claude/settings.json
{
  "cleanupPeriodDays": 99999
}
```

### 2. MCP Server Configuration

Create `tests/functional/config/mcp-server.json`:

```json
{
  "mcpServers": {
    "mittwald": {
      "transport": "http",
      "url": "https://mittwald-mcp-fly2.fly.dev/mcp"
    }
  }
}
```

### 3. Mittwald Authentication (for Harness)

Set environment variable for harness resource management:

```bash
export MITTWALD_API_TOKEN="your-token-here"
```

## Running Tests

### Full Test Suite

```bash
# Run all 174 tools across all domains
npm run test:all

# With specific concurrency
npm run test:all -- --concurrency 3
```

### Single Domain

```bash
# Test only project-related tools
npm run test:domain -- --domain project-foundation

# Available domains:
# identity, organization, project-foundation, apps, containers,
# databases, domains-mail, access-users, automation, backups
```

### Single Tool

```bash
# Test a specific tool in clean-room mode
npm run test:tool -- --tool mittwald_project_create --clean-room

# Test with harness setup
npm run test:tool -- --tool mittwald_app_list
```

### Coverage Report

```bash
# View current coverage
npm run coverage

# Output:
# Total Tools: 174
# Tested: 45 (25.9%)
# Passed: 42
# Failed: 3
# Untested: 129
```

## Test Output

### Manifest File

Results are appended to `tests/functional/output/manifest.jsonl`:

```jsonl
{"toolName":"mittwald_project_list","sessionId":"abc123","status":"passed","durationMs":4521,...}
{"toolName":"mittwald_app_create_node","sessionId":"def456","status":"passed","durationMs":12340,...}
```

### Session Logs

Claude Code session logs preserved at `~/.claude/projects/`

Session mapping stored at `tests/functional/output/sessions/`

### Resource Tracking

Created resources tracked at `tests/functional/output/resources.json`

## Cleanup

### Manual Cleanup

```bash
# Cleanup specific domain
npm run cleanup -- --domain apps

# Cleanup all test resources
npm run cleanup -- --all
```

### Automatic Cleanup

Cleanup runs automatically after each domain completes unless `--skip-cleanup` is specified.

## Monitoring

### Real-time Status

The Haiku coordinator monitors all active sessions. View status:

```bash
npm run status
```

### Coordinator Logs

Coordinator decisions logged to `tests/functional/output/coordinator.log`

## Troubleshooting

### Test Stuck

The coordinator will automatically detect stuck patterns and intervene. If manual intervention needed:

```bash
npm run stop
```

### Resource Leak

If cleanup fails, check orphaned resources:

```bash
npm run list-resources -- --orphaned
```

Then manually cleanup via `mw` CLI.

### MCP Server Issues

Check server health:

```bash
curl https://mittwald-mcp-fly2.fly.dev/health
```

Check server logs:

```bash
flyctl logs -a mittwald-mcp-fly2 --no-tail | tail -50
```

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        Test Harness                          │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Session  │  │ Session  │  │ Session  │  │ Session  │     │
│  │ Runner   │  │ Runner   │  │ Runner   │  │ Runner   │     │
│  │ (claude) │  │ (claude) │  │ (claude) │  │ (claude) │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
│       │             │             │             │            │
│       └─────────────┴─────────────┴─────────────┘            │
│                           │                                   │
│                    ┌──────┴──────┐                           │
│                    │ Coordinator │ (Haiku)                   │
│                    │  (monitor)  │                           │
│                    └──────┬──────┘                           │
│                           │                                   │
│  ┌──────────┐  ┌──────────┴──────────┐  ┌──────────────┐    │
│  │ Manifest │  │  Resource Tracker   │  │ Session Logs │    │
│  │ (JSONL)  │  │     (cleanup)       │  │ (preserved)  │    │
│  └──────────┘  └─────────────────────┘  └──────────────┘    │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │     MCP Server         │
              │ mittwald-mcp-fly2      │
              └────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │    Mittwald API        │
              │  api.mittwald.de/v2    │
              └────────────────────────┘
```

## Next Steps

After running tests:

1. **Review Coverage**: Ensure all 174 tools have at least one test
2. **Analyze Failures**: Check failed tests in manifest
3. **Preserve Logs**: Session logs available for future struggle analysis sprint
4. **Cleanup Resources**: Verify no orphaned test resources remain
