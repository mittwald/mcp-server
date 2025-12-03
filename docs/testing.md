# Testing Guide

## Quick Commands
- Lint/typecheck: `npm run lint` • `npm run type-check`
- Unit: `npm run test:unit`
- Bridge-only tests: `npm run test:bridge`
- Session lifecycle: `npm run test:session`
- Integration: `npm run test:integration`
- E2E (scheduled/opt-in): `npm run test:e2e`
- Security: `npm run test:security`
- Smoke (post-deploy OAuth): `npm run test:smoke`

## Environment Notes
- Redis required for session/state tests; compose includes `redis:7-alpine`.
- OAuth tests default to mock OAuth issuer (`mock-oauth` in compose). Set `OAUTH_ISSUER`/`OAUTH_REDIRECT_URI` for real stacks.
- Ensure `MITTWALD_OAUTH_CLIENT_ID` and `OAUTH_BRIDGE_JWT_SECRET` are set for bridge flows.
- CLI buffers are capped (`MCP_CLI_MAX_BUFFER_MB`); large outputs can fail tests if limits are exceeded.

## Test Matrices
- Unit: handlers, utilities, schemas.
- Bridge: OAuth bridge routes, PKCE, DCR paths.
- Session: Redis-backed lifecycle, refresh handling.
- Integration: OAuth flow + tool calls against mock Mittwald.
- Security: credential leak lint + targeted cases.
- E2E: Full OAuth + MCP tool cycle (dockerized).

## References
- `tests/README.md` for detailed setup.
- `docs/coverage.md` for coverage expectations and regeneration.
