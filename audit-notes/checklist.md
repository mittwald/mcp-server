# Audit Execution Checklist (Initial)

Legend: `[ ]` todo, `[~]` in progress, `[x]` done.

## Cross-Repo Foundations
- [ ] Capture high-level architecture and dataflow diagrams (auth chains, trust boundaries, storage).
- [ ] Enumerate assets, identities, and threat actors; define abuse cases.
- [x] Inventory secrets/config sources (.env, compose, Dockerfile args, CI vars) and persistence.
- [ ] Map dependencies and supply chain (npm, system packages, docker base images).
- [ ] Note assumptions/gaps in docs vs code behavior.

## mittwald-mcp
- [ ] Review OAuth bridge flows (PKCE, redirect allowlist, state/nonce usage, token TTLs, JWT signing/verification).
- [ ] Inspect MCP server JWT mint/verify path (alg selection, issuer/audience, clock skew, expiry, key size).
- [ ] Analyze CLI invocation path for injection, sandboxing, resource caps, and output redaction.
- [ ] Validate scope handling against config/mittwald-scopes.json and Mittwald discovery; check default scopes and overrides.
- [ ] Review Redis usage (state/session TTLs, key prefixing, single-use semantics, cleanup).
- [ ] Check logging/error handling for secret leakage and observability coverage.
- [ ] Assess tests: unit/integration/e2e coverage for OAuth + CLI flows; identify missing cases/fuzz targets.
- [ ] Static checks: lint/typecheck/test suite; SAST/secret scan/dependency scan; container scan (Dockerfile, openapi.Dockerfile, stdio.Dockerfile).
- [ ] CI review: workflow permissions, cache scope, secret exposure, required checks.

## mittwald-oauth
- [ ] Review DCR implementation: client metadata validation, redirect URI rules, auth method support, PKCE requirements.
- [ ] Evaluate Mittwald token handling: storage encryption, key rotation via KEY_ID, refresh safety window/backoff.
- [ ] Inspect JWT issuance/validation (HS256 default, rotation strategy, audience/issuer claims).
- [ ] Assess session/cookie settings (secure/HTTP-only, same-site, trust proxy) and CSRF protections.
- [ ] Examine rate limiting and abuse controls for auth, token, DCR endpoints.
- [ ] Review middleware ordering (helmet/cors/body parsers/error handlers), input validation schemas, error messages.
- [ ] Database schema/migrations: token/client tables, indexes, cascade rules, audit columns.
- [ ] Tests: unit/integration/Playwright coverage for OAuth/DCR; add missing negative/abuse cases.
- [ ] Static/dependency/secret scans; container hardening (Dockerfile, fly.toml).

## Integration & DAST
- [ ] End-to-end auth code + PKCE between repos with mocked Mittwald ID; verify scope propagation and client_secret_post flows.
- [ ] Attempt replay/downgrade/open-redirect/parameter tampering; test state/CSRF handling.
- [ ] Token substitution/impersonation tests; JWT kid/alg confusions; audience misuse.
- [ ] Performance/availability: rate-limit/burst tests, Redis/DB failure simulation, CLI resource exhaustion.

## Reporting
- [ ] Threat model document + diagrams.
- [ ] Risk register with severity/likelihood and owners.
- [ ] Test gap log with proposed cases.
- [ ] Scan reports with triage notes.
- [ ] Exploit/POC notes and verification steps for fixes.
