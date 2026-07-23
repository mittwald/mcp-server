# Security Risk Register

Status of security risks identified during the December 2025 hardening audit. Update this file
whenever a risk is opened, remediated or accepted.

## Remediated Risks

| ID | Severity | Risk | Remediation | Status |
|----|----------|------|-------------|--------|
| R001 | HIGH | DCR endpoints unprotected - registration_access_token not validated | Added registration token store with SHA-256 hashed tokens, timing-safe comparison | Remediated |
| R002 | MEDIUM | OAuth state replay possible - state can be reused | Implemented delete-on-read semantics in state store | Remediated |
| R003 | MEDIUM | PKCE values can be empty or invalid length | Added non-empty codeChallenge validation; enforced RFC 7636 length (43-128 chars) for code_verifier | Remediated |
| R004 | MEDIUM | Placeholder secrets in production - easy to guess | Added startup validator with placeholder detection | Remediated |
| R005 | MEDIUM | Wildcard CORS in production - allows any origin | Added CORS_ORIGIN validation at startup | Remediated |
| R006 | MEDIUM | Shell injection possible - exec() with string concatenation | Refactored to `spawn()` with argument arrays and no shell (`src/utils/cli-wrapper.ts`) | Remediated |
| R007 | LOW | No automated security scans - vulnerabilities not detected | Added Dependabot, CodeQL, Secret Scanning | Remediated |
| R008 | LOW | Redis data loss on restart - sessions lost | Added AOF persistence with everysec sync | Remediated |

## Accepted Risks

| ID | Severity | Risk | Justification | Owner |
|----|----------|------|---------------|-------|
| A001 | LOW | Some CLI commands have no MCP tool | Intentional - 45 of 161 tool definitions are excluded via `src/utils/tool-scanner.ts`, mostly unmigrated installers and admin-only endpoints | Product |
| A002 | INFO | CLI version pinned to ^1.12.0 | Matches upstream release cycle, Dependabot monitors updates | Engineering |
| A003 | INFO | Development mode allows placeholder secrets | Intentional - dev mode has warning logs | Engineering |

## Open Risks

| ID | Severity | Risk | Mitigation Plan | Target Date |
|----|----------|------|-----------------|-------------|
| O001 | LOW | DCR wrong-client detection uses O(N) Redis SCAN | Consider token hash index if >1000 clients or high wrong-client rate | Backlog |

### O001: DCR Token Ownership Lookup Performance

The `findTokenOwner()` function in `RegistrationTokenStore` performs an O(N) Redis SCAN to determine if a token belongs to a different client (for 403 Forbidden response). This is necessary to distinguish between "invalid token" (401) and "valid token for wrong client" (403) per RFC 7592.

**Current Impact**: Negligible for typical deployments (<100 clients)

**Optimization Options** (if needed):
1. Create secondary index: `token_hash:{hash} -> clientId`
2. Use Redis Bloom filter for fast negative lookup
3. Cache token hashes in memory with TTL

**When to Optimize**: Monitor if wrong-client path is hit frequently (indicates misuse/attack) or client count exceeds 1000.

## Risk Assessment Methodology

### Severity Definitions

- **HIGH**: Exploitable vulnerability with significant impact (data breach, unauthorized access, system compromise)
- **MEDIUM**: Exploitable vulnerability with limited impact or requires specific conditions
- **LOW**: Hardening opportunity, defense in depth measure
- **INFO**: Informational, no immediate action required

### Assessment Criteria

1. **Exploitability**: How easy is it to exploit?
2. **Impact**: What's the worst-case outcome?
3. **Scope**: How many users/systems affected?
4. **Detectability**: Would we know if exploited?

## References

- Security controls overview: `ARCHITECTURE.md` ("Security Architecture")
- Credential handling standard: `docs/CREDENTIAL-SECURITY.md`
- Regression suites: `tests/security/`, `packages/oauth-bridge/tests/unit/`
