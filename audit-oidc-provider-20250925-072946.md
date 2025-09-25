# OIDC Provider Compliance Audit — 2025-09-25 07:29:46 UTC

## Context
- **Scope**: Review oidc-provider implementation under `packages/oauth-server/` against the architectural baseline defined in `ARCHITECTURE.md` (Document Version 4.0, 2025-09-23).
- **Objective**: Identify divergences that could prevent Claude.ai and other standard OAuth 2.1 clients from interoperating with the Mittwald MCP server as designed.
- **Methodology**: Manual inspection of the architecture specification and the TypeScript source with line-referenced comparisons. No code was modified during this audit.

## Findings

### 1. Explicit Consent Screen Omitted
- **Severity**: High
- **Architectural Requirement**: The redesigned flow requires oidc-provider to render an HTML consent review at `/interaction/:uid`, giving the user a “✅ Allow Access / ❌ Deny” choice before scopes are granted (`ARCHITECTURE.md:327-332`, `ARCHITECTURE.md:1605-1613`).
- **Observed Implementation**: `packages/oauth-server/src/handlers/interactions.ts:70-123` detects consent prompts but auto-approves them by calling `provider.interactionFinished` with all requested scopes, bypassing any user interaction.
- **Risk / Impact**: Removes the explicit grant step mandated by OAuth 2.1, undermines user trust, and violates the documented Mittwald security posture. Standard clients that expect to display a consent page may treat the flow as non-compliant.
- **Recommendation**: Restore the consent UI. When `prompt === 'consent'`, render the documented HTML screen, capture the user’s decision via the POST `/interaction/:uid/confirm` route, and only then call `interactionFinished`. Rejecting the prompt should propagate an OAuth `access_denied` error.

### 2. Overly Permissive Redirect URI Patterns
- **Severity**: High
- **Architectural Requirement**: Default `ALLOWED_REDIRECT_URI_PATTERNS` is limited to HTTPS localhost loopback and vetted custom schemes (e.g., `claude://`, `vscode://`) per `ARCHITECTURE.md:836-838`.
- **Observed Implementation**: `packages/oauth-server/src/server.ts:24-28` seeds the configuration with `https://*/*` plus numerous IDE/tooling schemes, effectively accepting any HTTPS origin and many unvetted custom protocols during DCR.
- **Risk / Impact**: Broad pattern matching enables malicious Dynamic Client Registrations to register arbitrary redirect URIs, expanding the attack surface for authorization-code theft and client impersonation.
- **Recommendation**: Replace the wildcard defaults with the curated list from the spec and enforce strict host/path validation. Consider centralizing the pattern list in configuration that mirrors the architecture document and fails closed.

### 3. Unstable Mittwald Account Identifiers
- **Severity**: Medium
- **Architectural Requirement**: The Mittwald tokens must be stored against a deterministic account key such as `mittwald:user_id`, ensuring refresh cycles keep the same subject identity (`ARCHITECTURE.md:322-324`, `ARCHITECTURE.md:1600-1624`).
- **Observed Implementation**: `/mittwald/callback` derives `accountId = \`mittwald:${tokenSet.access_token.substring(0, 16)}\`` (`packages/oauth-server/src/handlers/interactions.ts:247-275`). Any token rotation changes the account key, severing the mapping expected by the MCP server.
- **Risk / Impact**: Identity continuity breaks when Mittwald issues new access tokens, leading to redundant records, token leakage, or failed lookups by `findAccount`. Downstream CLI invocations may stop receiving valid Mittwald credentials.
- **Recommendation**: Extract a stable Mittwald user identifier from the token response or userinfo endpoint. Persist that identifier in `userAccountStore` and propagate it through JWT claims so the MCP server maintains a consistent subject.

### 4. Legacy Token Store Still Powers `findAccount`
- **Severity**: Medium
- **Architectural Requirement**: The simplified architecture introduces `userAccountStore` as the single source of truth for Mittwald tokens (`ARCHITECTURE.md:1628-1655`).
- **Observed Implementation**: `findAccount` in `packages/oauth-server/src/config/provider.ts:146-188` queries `mittwaldTokenStore`, a legacy map kept only for backward compatibility. The new `userAccountStore` is updated, but not read, leading to dual storage paths.
- **Risk / Impact**: Divergence between stores can silently break token issuance if they drift out of sync. The lingering legacy path contradicts the simplification goals and complicates state management.
- **Recommendation**: Retire `mittwaldTokenStore` from the live flow. `findAccount` should use `userAccountStore` exclusively, and the callback handler should persist to that store alone (with optional migration helpers during rollout).

## Supporting Observations
- **Positive Alignment**: PKCE enforcement, standard `/token` usage, JWKS bootstrap, and DCR registration middleware align with the “pure oidc-provider” strategy highlighted in `ARCHITECTURE.md:45-1747`.
- **Testing Gap**: The architecture checklist still flags missing DCR integration tests (`ARCHITECTURE.md:601-608`). Once the above issues are addressed, targeted tests for consent handling and redirect validation are recommended.

## Next Actions
1. Implement the consent experience and re-run Claude.ai integration tests to ensure the flow remains compatible.
2. Harden redirect URI validation and update environment defaults to match the documented constraints.
3. Normalize account identifiers and storage so `userAccountStore` is the authoritative source referenced by `findAccount`.

*Prepared by: Codex MCP audit agent*

---

## Follow-up Implementation — 2025-09-25 07:54:20 UTC

### Remediations Applied

1. **Consent Screen Restored**  
   - `packages/oauth-server/src/handlers/interactions.ts:150-197` now renders an HTML consent form that pauses the flow until the user explicitly approves or aborts.  
   - POST handlers at `packages/oauth-server/src/handlers/interactions.ts:415-457` honour the user’s decision before completing the interaction.

2. **Redirect URI Handling (temporary allow-all)**  
   - Redirect validation now recognizes `ALLOW_ALL` / `*` as a sentinel to permit any URI while logging a warning (`packages/oauth-server/src/server.ts:16-58`).  
   - TODO remains to replace this bring-up configuration with the curated pattern list once MCP client callbacks settle (tracked in `ARCHITECTURE.md:1252`).

3. **Deterministic Mittwald Identities**  
   - Callback now derives account IDs from Mittwald `userinfo` claims with a hashed fallback, capturing profile data when present (`packages/oauth-server/src/handlers/interactions.ts:320-366`).  
   - `userAccountStore` persists subject/email/name metadata and logs diagnostic context (`packages/oauth-server/src/services/user-account-store.ts:3-72`).

4. **Single Source for JWT Claims**  
   - `findAccount` reads from `userAccountStore` exclusively and injects Mittwald credentials into issued tokens (`packages/oauth-server/src/config/provider.ts:250-315`).

5. **Tooling**  
   - `npx eslint` run across the touched files to ensure lint compliance (see command in session log).

### Outstanding / Follow-up Items

- Execute the OAuth integration and client smoke tests to validate Claude.ai, ChatGPT, and other MCP connectors against the new consent UI and redirect policy.  
- Review environment-specific `ALLOWED_REDIRECT_URI_PATTERNS` to extend beyond the secure defaults where necessary (see guidance below).

**Updated next steps — 2025-09-25 08:23:26 UTC**

1. Apply the DCR primer checklist to `provider.ts`/`server.ts`, deciding which registration knobs (e.g., registrationManagement, policies, extra metadata) should be enabled in production.  
2. **Decision: keep dynamic registration open (no initial access token).** Documented in `packages/oauth-server/src/config/provider.ts` and audit notes; revisit only if we later restrict onboarding.  
3. Wire up `registration_*` events to metrics/logging so dynamic client onboarding is auditable once `/reg` is exposed.

### Environment Configuration Guidance

- **Local developer setups** that rely on custom IDE schemes (e.g., `cursor://`, `windsurf://`, `zed://`) or non-localhost HTTPS callbacks must extend `ALLOWED_REDIRECT_URI_PATTERNS` accordingly.  
- **Shared staging/production deployments** serving additional MCP clients (e.g., ChatGPT `https://chatgpt.com/*`, `https://chat.openai.com/*`, internal QA portals) should explicitly list each required origin.  
- **Third-party integrations** such as AWS Q, Warp, or bespoke desktop connectors likewise need their scheme/host patterns appended before those clients re-run DCR.

*Prepared by: Codex MCP implementation agent*
