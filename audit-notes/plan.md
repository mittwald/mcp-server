# Security & Quality Audit Plan

## Scope & Goals
- Repos: `mittwald-mcp` (MCP server + OAuth bridge package) and `../mittwald-oauth/mittwald-oauth` (Mittwald OAuth 2.1 + DCR server).
- Objectives: identify security flaws, correctness gaps, quality risks, and resilience issues across code, configs, build, and runtime; validate OAuth 2.1 + DCR flows and MCP command execution safety.
- Deliverables: threat model, risk register with severities/owners, remediation backlog, test gaps, and verification evidence.

## Phased Approach
1) Architecture + dataflow mapping: inventory services, trust boundaries, secrets, token lifetimes, Redis/session use, CLI invocation path; map cross-repo call graph and auth chains.
2) Automated baselines: lint/typecheck/unit/integration/e2e matrices; dependency scans (npm audit/njsscan/oss-review), secret scans, Semgrep/SAST rules, container image scan (Trivy), lockfile/pin audit.
3) Manual code review: auth, crypto, storage, input validation, error handling, logging, privilege separation, command execution surfaces, and cross-repo integration points.
4) Adversarial testing: targeted DAST for OAuth/DCR endpoints, replay/PKCE/binding checks, token substitution, downgrade/parameter tampering, CSRF, SSRF, DoS/resource exhaustion, fuzzing where feasible.
5) Validation: add/extend tests, run exploitation POCs in controlled env, verify fixes, and document evidence.

## Investigation Vectors
- OAuth 2.1 / DCR correctness: PKCE enforcement, redirect URI validation, dynamic registration policy, client auth methods, scope handling (Mittwald authority vs bridge), consent assumptions, rotation/expiry of secrets returned to clients.
- Token lifecycle: JWT issuance/validation, signing/verification keys, alg selection, audience/issuer/nonce/binding, clock skew, revocation/blacklist, refresh handling, Mittwald token pass-through rules.
- Secret management: env var usage, `.env`/compose defaults, key length/entropy, rotation procedures, storage at rest (encryption for Mittwald tokens), secret leakage in logs/errors.
- Session/state: Redis-backed state, CSRF/state tokens for OAuth, replay protections, single-use codes, anti-forgery checks, TTLs/cleanup, concurrency controls.
- Command execution (MCP server): CLI invocation safety, argument construction, path traversal, shell injection, sandboxing, timeout/rlimit, output redaction, file system access policy, multi-tenant isolation.
- Input validation & parsing: request payload validation (Zod/TS types), open redirect checks, URL/domain allowlists, JSON schema adherence, untrusted data flows to HTTP clients.
- Authorization & scope enforcement: mapping Mittwald scopes to MCP actions, default scope config vs discovery, privilege escalation paths, role/tenant boundaries, per-command checks.
- Error handling & logging: info leaks, structured logging hygiene, correlation IDs, PII minimization, log retention and rotation.
- Rate limiting & abuse controls: per-client and per-user throttles, token introspection frequency, protection against credential stuffing or device-code abuse (if present).
- Availability & resilience: Redis/DB failure handling, circuit breakers/retries, graceful shutdown, back-pressure on CLI commands, health/readiness endpoints.
- Supply chain: dependency age/maintainer risk, typosquat checks, integrity of package-locks, registry provenance, build reproducibility.
- Container/infra: Dockerfile hardening, user privileges, exposed ports, compose defaults, prod config differences, TLS/HTTP settings, HSTS/cookies, proxy headers.
- CI/CD: workflow permissions, secret scope in CI, caching of artifacts, coverage thresholds, lint/typecheck gates, release process and tag signing.
- Tests & quality: TS strictness, lint rule coverage, mutation/fuzz/prop tests opportunities, mocking fidelity for Mittwald APIs, cross-repo contract tests.
- Documentation & runbooks: accuracy of README/ARCHITECTURE, onboarding risks, missing operational mitigations (key rotation, incident response, backup/restore), metrics/alerts coverage.

## Repository-Specific Focus
- `mittwald-mcp`: packages/oauth-bridge stateless proxy correctness, config/mittwald-scopes.json governance, JWT minting for MCP clients, CLI wrapper security, Redis state store flows, coverage automation scripts.
- `mittwald-oauth`: DCR implementation, token encryption at rest (key id/rotation), knex migrations/schema, middleware ordering, session/cookie settings, Playwright flows, Mittwald API interactions.
- Integration tests: ensure end-to-end flows between both repos (auth code + PKCE, secret_post clients, token exchange, scope propagation) with mocked Mittwald ID and CLI execution.

## Outputs & Checkpoints
- Threat model diagrams and dataflows (store as markdown/mermaid in this folder).
- Risk register with severity/likelihood, owners, and remediation proposals.
- Test gap log (unit/integration/e2e/fuzz) with proposed cases.
- Tooling reports summaries (SAST/DAST/dependency/container/secret scans) with false-positive triage notes.
- Exploit/POC notes for confirmed issues and verification steps for fixes.

## Next Execution Steps
- Inventory configs/env defaults and secret handling across both repos.
- Run static checks (lint/typecheck/tests) and baseline scans; record outputs here.
- Begin manual review on auth/token/CLI surfaces; populate risk register and test gap log.
