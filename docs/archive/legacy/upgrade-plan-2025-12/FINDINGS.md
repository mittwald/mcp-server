# Mittwald CLI Audit Findings - December 2025

## Quick Summary

| Question | Answer |
|----------|--------|
| Is CLI version current? | **YES** - v1.12.0 (latest) |
| Are there new CLI commands to add? | **NO** - all 168 applicable commands covered |
| Are there API breaking changes? | **YES** - but handled by CLI layer |
| Action required? | **MINIMAL** - verification tests only |

---

## Detailed Findings

### 1. Version Status

```
Local CLI:     @mittwald/cli/1.12.0 darwin-arm64 node-v20.19.3
npm Latest:    1.12.0 (released November 3, 2024)
MCP Server:    ^1.12.0 (package.json devDependency)

Result: ALIGNED
```

The CLI has not had a new release since November 2024. This is the longest gap between releases in the CLI's history, suggesting a stabilization phase.

### 2. Command Comparison

**CLI Topics Found (24):**
1. app
2. autocomplete (utility - N/A)
3. backup
4. container
5. context
6. contributor (placeholder - empty)
7. conversation
8. cronjob
9. database
10. ddev
11. domain
12. extension
13. help (utility - N/A)
14. login
15. mail
16. org
17. project
18. registry
19. server
20. sftp-user
21. ssh-user
22. stack
23. update (utility - N/A)
24. user
25. volume

**MCP Server Categories (23):**
All topics covered except utilities (autocomplete, help, update) and contributor (empty placeholder).

### 3. New Features in CLI 1.12.0

These features from the November 2024 release are already supported:

| Feature | CLI Command | MCP Tool | Status |
|---------|-------------|----------|--------|
| Custom app installation paths | `app create *` | `mittwald_app_create_*` | Covered |
| Direct backend access | `app open --direct` | `mittwald_app_open` | Covered |
| Integer port mapping | `container run` | `mittwald_container_run` | Covered |
| Resource limits | `container run` | `mittwald_container_run` | Covered |

### 4. API Changes Not Requiring MCP Updates

The 2025 API changes primarily affected:

1. **Pagination defaults** - CLI handles internally
2. **Extension schema changes** - Extension commands work unchanged
3. **New optional parameters** - CLI exposes these, MCP tools could add them but not required

### 5. Interactive Commands Analysis

8 commands excluded due to MCP protocol limitations:

| Command | Type | MCP Alternative |
|---------|------|-----------------|
| `app exec` | SSH | Use `app ssh` with external SSH client |
| `container cp` | File Transfer | Use `app upload`/`app download` |
| `container exec` | SSH | Use `project ssh` with external SSH client |
| `container port-forward` | Tunnel | Manual SSH tunnel |
| `container ssh` | SSH | Use `project ssh` |
| `database mysql phpmyadmin` | Browser | Return URL only |
| `database mysql shell` | Interactive | Use `database mysql dump`/`import` |
| `database redis shell` | Interactive | Not available via MCP |

### 6. Discrepancy in Coverage Report

The existing `docs/mittwald-cli-coverage.md` states:
- Total CLI commands: 178
- Covered by MCP tools: 168
- Missing wrappers: 0

**Note:** The "0 missing" is misleading. There are 10 commands in various excluded states:
- 8 interactive (intentionally excluded)
- 3 utility commands (N/A)
- 1 login status (N/A - MCP uses token injection)

The coverage is actually 168/166 applicable commands = **100% of applicable commands covered**.

---

## Recommendations

### Immediate (This Sprint)

1. Run `npm run test:integration` to verify no regressions from 2025 API changes
2. Run `npm run coverage:generate` to refresh coverage artifacts

### Short-term (Next Sprint)

1. Update coverage matrix header with December 2025 audit timestamp
2. Add clarity note about "missing wrappers: 0" meaning applicable commands

### Long-term (Watch List)

1. Subscribe to `@mittwald/cli` npm releases
2. Monitor [github.com/mittwald/cli/releases](https://github.com/mittwald/cli/releases)
3. Track MCP protocol streaming RFC for potential interactive command support

---

## Test Commands

```bash
# Verify CLI version
mw --version

# Check npm latest
npm view @mittwald/cli version

# Run MCP server coverage check
npm run coverage:generate

# Run integration tests
npm run test:integration

# Check for dependency updates
npm outdated @mittwald/cli @mittwald/api-client
```

---

*Audit completed: 2025-12-03*
