# mittwald-mcp Development Guidelines

## Fly.io Infrastructure

There are 2 Fly.io apps for the Mittwald ecosystem:
- `mittwald-oauth-server` - OAuth 2.1 server with DCR support (https://mittwald-oauth-server.fly.dev)
- `mittwald-mcp-fly2` - MCP server for Claude Code integration

### Add MCP Server to Claude Code
```bash
claude mcp add --transport http mittwald https://mittwald-mcp-fly2.fly.dev/mcp
```

## Project Structure
```
src/
tests/
```

## Commands
```bash
npm run build    # Build the project
npm run test     # Run tests
```

## Code Style
Follow standard TypeScript conventions.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
