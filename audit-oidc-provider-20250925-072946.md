# OIDC Provider Architecture Alignment Audit — 2025-09-25 15:40 UTC

## Context
- **Objective**: Confirm the oauth-server implementation matches the proxy architecture: Mittwald controls scopes and consent, the proxy short-circuits interactions.
- **Result**: Core code paths now defer scope management to Mittwald, eliminate the HTML consent screen, and embed Mittwald-issued scopes into persisted accounts and JWT claims.

## Verified Changes
- ✅ `mittwald-metadata` helper performs discovery, caches endpoints, and resolves fallback scopes only when necessary.
- ✅ Dynamic Client Registration no longer rewrites the `scope` field—registrations are persisted as received (aside from redirect URI sanitation).
- ✅ Login/consent interactions auto-complete without presenting local HTML; Mittwald’s callback seeds `mittwaldInteractionState` and grants use the returned scope string.
- ✅ `userAccountStore` records `mittwaldScope`, and `findAccount` exposes `mittwald_scope`, `mittwald_scope_source`, and `mittwald_requested_scope` claims.
- ✅ Legacy scope configuration files (`src/config/oauth-scopes.ts`, `packages/oauth-server/src/config/oauth-scopes.ts`) and dependent middleware/tests were removed or updated.

## Follow-up Recommendations
1. **Integration tests**: Add coverage for the new scope passthrough (e.g., verify JWT claims contain Mittwald scopes after a simulated callback).
2. **Metadata resilience**: Ensure fallback logging is monitored; consider surfacing a health check that reports discovery vs. manual mode.
3. **Client communication**: Update MCP client onboarding docs to clarify that `scopes_supported` is intentionally omitted so clients compute scopes themselves.

*Prepared by: Codex MCP architecture team*
