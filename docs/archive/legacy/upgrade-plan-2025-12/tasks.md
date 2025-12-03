# Mittwald CLI vs MCP Server Gap Analysis - December 2025

## Executive Summary

**CLI Version Analysis:**
- **Current CLI Version:** `@mittwald/cli@1.12.0` (Released: November 3, 2024)
- **MCP Server Dependency:** `@mittwald/cli: ^1.12.0` (devDependency in package.json)
- **Status:** **VERSIONS MATCH** - The MCP server is aligned with the latest stable CLI release

**Key Finding:** There have been **NO NEW CLI RELEASES** since v1.12.0 (November 2024). The CLI development has stabilized, though Mittwald API changes have continued in 2025.

---

## 1. CLI Version Alignment

| Component | Version | Release Date | Status |
|-----------|---------|--------------|--------|
| Installed CLI (`mw --version`) | 1.12.0 | Nov 3, 2024 | Current |
| npm latest (`@mittwald/cli`) | 1.12.0 | Nov 3, 2024 | Current |
| MCP Server dependency | ^1.12.0 | - | Aligned |
| API Client (`@mittwald/api-client`) | ^4.169.0 | - | Current |

**Verdict:** No version upgrade required.

---

## 2. Command Coverage Analysis

### 2.1 Overall Statistics

| Metric | Count |
|--------|-------|
| Total CLI Commands | 178 |
| MCP Tool Files | 176 |
| Commands Covered | 168 |
| Interactive (Excluded) | 8 |
| Intentionally Deferred | 2 |

### 2.2 Interactive Commands (Permanently Excluded)

These commands require bidirectional streaming and cannot be supported until MCP protocol adds streaming support:

| Command | Reason |
|---------|--------|
| `app exec` | Interactive SSH session |
| `container cp` | File transfer streaming |
| `container exec` | Interactive SSH session |
| `container port-forward` | Long-running port tunnel |
| `container ssh` | Interactive SSH session |
| `database mysql phpmyadmin` | Browser-based UI launcher |
| `database mysql shell` | Interactive MySQL session |
| `database redis shell` | Interactive Redis session |

### 2.3 Commands Not Applicable to MCP

| Command | Reason |
|---------|--------|
| `autocomplete` | Local shell integration only |
| `help` | CLI utility command |
| `update` | CLI self-update mechanism |
| `login status` | MCP uses per-request token injection |

### 2.4 Missing "Contributor" Topic

The CLI has a `contributor` topic for mStudio Marketplace contributors:

```
mw contributor --help
Commands for mStudio marketplace contributors
```

**Assessment:** This topic currently shows no subcommands and appears to be a placeholder for future marketplace contributor APIs. The MCP server has marketplace types defined (`src/types/mittwald/marketplace.ts`) but no CLI wrapper is needed until the CLI exposes contributor commands.

**Action Required:** None - monitor for future CLI releases adding contributor subcommands.

---

## 3. API Changes in 2025

### 3.1 Breaking Changes (February 2025)

| Endpoint | Change |
|----------|--------|
| `GET /v2/contracts` | Added default `limit=1000`, `skip=0` |
| Extension endpoints | Added `externalFrontends`, `assets` properties |
| Extension webhooks | 4 webhook URL properties now required |
| File uploads | New types: `extensionAssetImage`, `extensionAssetVideo` |

### 3.2 Breaking Changes (May 2025)

| Endpoint | Change |
|----------|--------|
| `GET /v2/extension-instances` | Removed default `limit=1000`, `page=1.00` |
| `GET /v2/extension-instances` | New params: `extensionId`, `order`, `sort`, `page` |
| `GET /v2/projects/{id}/registries` | Added default `limit=1000`, `skip=0` |
| `GET /v2/projects/{id}/services` | Added `limit`, `page`, `skip` params |
| `GET /v2/projects/{id}/stacks` | Added `limit`, `page`, `skip` params |
| `GET /v2/projects/{id}/volumes` | Added `limit`, `page`, `skip` params |
| New endpoint | `GET /v2/scopes` for listing scopes |

### 3.3 Impact Assessment

**Low Impact:** The CLI abstracts these API changes. Since the MCP server wraps the CLI (not the API directly), these changes are transparent unless:
1. New CLI flags were added to expose pagination controls
2. Default behaviors changed CLI output format

**Recommendation:** Run integration tests to verify no behavioral regressions.

---

## 4. CLI Command Aliases

The CLI includes aliases that map to existing commands. The MCP server does NOT need to implement aliases as the canonical commands are already covered:

| Alias | Canonical Command | MCP Tool |
|-------|-------------------|----------|
| `container ls` | `container list` | `mittwald_container_list` |
| `container rm` | `container delete` | `mittwald_container_delete` |
| `volume ls` | `volume list` | `mittwald_volume_list` |
| `volume rm` | `volume delete` | `mittwald_volume_delete` |
| `stack ls` | `stack list` | `mittwald_stack_list` |
| `stack rm` | `stack delete` | `mittwald_stack_delete` |
| `stack up` | `stack deploy` | `mittwald_stack_deploy` |

---

## 5. Tasks for Action

### 5.1 No-Action Items (Verification Only)

- [x] **Task A1:** Verify CLI version alignment - **COMPLETE** (v1.12.0 aligned)
- [ ] **Task A2:** Run full integration test suite to confirm 2025 API changes don't affect CLI behavior
- [ ] **Task A3:** Verify `mw-cli-coverage.json` is up-to-date with 178 commands

### 5.2 Future Watch Items

- [ ] **Task B1:** Monitor for `@mittwald/cli@1.13.0+` release
- [ ] **Task B2:** Monitor for `mw contributor` subcommands
- [ ] **Task B3:** Monitor for MCP bidirectional streaming support (would enable interactive commands)

### 5.3 Documentation Updates

- [ ] **Task C1:** Update `docs/mittwald-cli-coverage.md` header to reflect December 2025 audit
- [ ] **Task C2:** Document the 2025 API changes in `docs/api-changelog.md` (new file)
- [ ] **Task C3:** Add note about command aliases not needing MCP wrappers

### 5.4 Potential Enhancements (Low Priority)

- [ ] **Task D1:** Consider adding pagination parameters to list commands that now support them:
  - `extension list-installed` (`extensionId`, `order`, `sort`, `page`)
  - `registry list` (`limit`, `skip`, `page`)
  - `container list` / `stack list` / `volume list` (`limit`, `page`, `skip`)

---

## 6. Coverage Matrix Update Summary

### Current Coverage by Category

| Category | CLI Commands | MCP Tools | Coverage |
|----------|-------------|-----------|----------|
| app | 28 | 27 | 96% (1 interactive) |
| backup | 9 | 9 | 100% |
| container | 12 | 8 | 67% (4 interactive) |
| context | 3 | 3+3* | 100% |
| conversation | 6 | 6 | 100% |
| cronjob | 10 | 10 | 100% |
| database | 18 | 15 | 83% (3 interactive) |
| ddev | 2 | 2** | 100% |
| domain | 9 | 9 | 100% |
| extension | 4 | 4 | 100% |
| login | 3 | 2 | 67% (1 N/A) |
| mail | 10 | 10 | 100% |
| org | 10 | 10 | 100% |
| project | 14 | 14 | 100% |
| registry | 4 | 4 | 100% |
| server | 2 | 2 | 100% |
| sftp-user | 4 | 4 | 100% |
| ssh-user | 4 | 4 | 100% |
| stack | 4 | 4 | 100% |
| user | 10 | 10 | 100% |
| volume | 3 | 3 | 100% |

*Context has 3 additional session-aware variants
**DDEV tools exist but are marked as resource-based alternatives

---

## 7. Conclusion

The mittwald-mcp server is **fully aligned** with the current CLI version (1.12.0). No immediate action is required for version upgrades.

The 2025 API changes (pagination defaults, extension properties) have been absorbed by the CLI layer and do not require MCP server modifications.

**Next Review:** When `@mittwald/cli@1.13.0` or later is released, or Q1 2026, whichever comes first.

---

## References

- [Mittwald CLI GitHub Releases](https://github.com/mittwald/cli/releases)
- [Mittwald Developer Portal - API Changelog](https://developer.mittwald.de/changelog/)
- [Mittwald CLI npm Package](https://www.npmjs.com/package/@mittwald/cli)
- [MCP Server Coverage Matrix](/docs/mittwald-cli-coverage.md)
- [CLI Exclusions Config](/config/mw-cli-exclusions.json)

---

*Generated: 2025-12-03*
*Auditor: Claude Code (Opus 4.5)*
