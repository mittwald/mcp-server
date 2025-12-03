# Findings Snapshot (current)

- mittwald-oauth DCR: registration access token validation is a stub (`ClientValidator.validateRegistrationAccessToken` always true for token length ≥20). GET/PUT/DELETE `/register/:client_id` can be executed with any bearer token, no client binding or expiry. Needs persistent token issuance/verification.
- mittwald-oauth defaults: HS256 secrets and placeholder values in `fly.toml` and `.env.example`; CORS_ORIGIN defaults to `*`; risk if deployed without override.
- mittwald-mcp OAuth state manager: states are readable multiple times and not cleared on get; PKCE fields default to empty strings. Replay risk unless callers delete manually.
- OAuth bridge refresh: issues refresh tokens but no refresh grant endpoint, so refresh tokens are dead; misleads clients.
- Image surface: MCP Dockerfiles install `openssh-client` and global `@mittwald/cli`; verify necessity and consider slimming.
- CI gaps: mittwald-oauth has deploy-only workflow; lacks PR lint/test/SAST/dep/secret scans. mittwald-mcp lacks secret/dependency scans in CI.
- Supply chain: base images pinned to floating tags (node:20-alpine/20.12.2-alpine) without digests; consider digest pinning and periodic bumping.
