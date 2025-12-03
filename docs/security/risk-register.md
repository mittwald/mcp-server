# Security Risk Register

**Last Updated**: 2025-12-03
**Audit Reference**: December 2025 Security & Quality Hardening

## Remediated Risks

| ID | Severity | Risk | Remediation | WP | Status |
|----|----------|------|-------------|-------|--------|
| R001 | HIGH | DCR endpoints unprotected - registration_access_token not validated | Added registration token store with SHA-256 hashed tokens, timing-safe comparison | WP01 | Remediated |
| R002 | MEDIUM | OAuth state replay possible - state can be reused | Implemented delete-on-read semantics in state store | WP02 | Remediated |
| R003 | MEDIUM | PKCE values can be empty or invalid length | Added non-empty codeChallenge validation; enforced RFC 7636 length (43-128 chars) for code_verifier | WP02 | Remediated |
| R004 | MEDIUM | Placeholder secrets in production - easy to guess | Added startup validator with placeholder detection | WP03 | Remediated |
| R005 | MEDIUM | Wildcard CORS in production - allows any origin | Added CORS_ORIGIN validation at startup | WP03 | Remediated |
| R006 | MEDIUM | Shell injection possible - exec() with string concatenation | Refactored to execFile() with argument arrays | WP04 | Remediated |
| R007 | LOW | No automated security scans - vulnerabilities not detected | Added Dependabot, CodeQL, Secret Scanning | WP05 | Remediated |
| R008 | LOW | Redis data loss on restart - sessions lost | Added AOF persistence with everysec sync | WP06 | Remediated |

## Accepted Risks

| ID | Severity | Risk | Justification | Owner |
|----|----------|------|---------------|-------|
| A001 | LOW | Interactive CLI commands not exposed | Intentional - MCP is non-interactive, 8 commands excluded | Product |
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

- Feature Spec: `kitty-specs/003-december-2025-security/spec.md`
- Implementation Plan: `kitty-specs/003-december-2025-security/plan.md`
- Work Packages: `kitty-specs/003-december-2025-security/tasks.md`
