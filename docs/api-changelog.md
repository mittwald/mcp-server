# Mittwald API Changelog (MCP Server Impact)

This document tracks Mittwald API and CLI changes that affect the MCP server.

## 2025 Changes

### December 2025 - Security Hardening Sprint

**Audit Date:** 2025-12-03
**Scope:** Security hardening per spec `kitty-specs/003-december-2025-security/spec.md`

#### Internal Security Changes (No External API Impact)

| Component | Change | Impact | Work Package |
|-----------|--------|--------|--------------|
| DCR Endpoint | Added `registration_access_token` protection | Clients receive token at registration; required for GET/DELETE | WP01 |
| DCR Auth | Wrong-client token returns 403 (not 401) | Per RFC 7592, valid token for wrong client is access denied | WP01 |
| OAuth Token | PKCE `code_verifier` length validation (43-128 chars) | Rejects non-RFC-7636 compliant verifiers | WP02 |
| OAuth State | Single-use authorization code enforcement | Replay attacks return `invalid_grant` | WP02 |
| Startup | Placeholder secret detection | Production startup blocked with placeholder values | WP03 |
| Startup | CORS wildcard rejection | Production startup blocked with `CORS_ORIGIN='*'` | WP03 |
| CLI Wrapper | `execFile` instead of `exec` | Shell metacharacters treated as literals | WP04 |
| CI Pipeline | npm audit on all PRs | Blocks PRs with high/critical vulnerabilities | WP05 |
| Redis | Persistence enabled (AOF + RDB) | State survives container restarts | WP06 |

#### Security Tests Added

- 58 shell injection fuzzing tests (`tests/security/shell-injection.test.ts`)
- 9 E2E security validation tests (`tests/e2e/security-validation.e2e.test.ts`)
- 107 startup validator tests (`tests/unit/startup-validator.test.ts`, `packages/oauth-bridge/tests/unit/startup-validator.test.ts`)
- 7 PKCE length validation tests (`packages/oauth-bridge/tests/unit/pkce-validation.test.ts`)

#### Risk Register

See `docs/security/risk-register.md` for full remediation status of identified risks R001-R008.

### Q1-Q3 2025

#### CLI 1.12.0 (November 2024 - Current)
- No breaking changes since 1.12.0
- Version aligned between CLI and MCP server dependency

### API Changes Absorbed by CLI

The following API changes were absorbed by the CLI layer and do not require MCP server changes:

| Date | Change | Impact |
|------|--------|--------|
| 2025-01 | Project API v2 pagination | CLI handles internally |
| 2025-02 | App deployment status enum expansion | CLI maps to string output |
| 2025-03 | Database connection string format update | CLI formats output |

## Historical Changes

### 2024 Q4

#### CLI 1.12.0 (November 2024)
- Added: `mw app dependency` commands (list, update, check)
- Added: `mw project filesystem usage` command
- Fixed: JSON output formatting for nested objects
- Improved: Error message clarity for auth failures

#### CLI 1.11.x
- Added: Conversation/messaging commands
- Added: Backup schedule management
- Fixed: SSL certificate command timeouts

## Compatibility Matrix

| MCP Server Version | CLI Version | Node.js | Status |
|--------------------|-------------|---------|--------|
| 1.x.x | ^1.12.0 | 20.x | Current |
| 0.9.x | ^1.11.0 | 18.x | Deprecated |
| 0.8.x | ^1.10.0 | 18.x | EOL |

## Monitoring API Changes

### Subscribe to Updates

- Mittwald Developer Changelog: https://developer.mittwald.de/changelog/
- CLI GitHub Releases: https://github.com/mittwald/cli/releases

### Check for CLI Updates

```bash
# Check latest CLI version
npm view @mittwald/cli version

# Check installed version
npx mw --version

# Update CLI
npm update @mittwald/cli
```

## Breaking Change Policy

The MCP server follows semantic versioning:
- **Major**: Breaking changes to MCP tool interface
- **Minor**: New tools or non-breaking changes
- **Patch**: Bug fixes and security updates

CLI updates that don't change tool interface are absorbed as patch releases.
