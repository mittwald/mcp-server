# OAuth Implementation Analysis

## Key Findings

- The Mittwald callback handler never calls provider.interactionFinished, instead it fabricates a random auth code and
redirects back to the Mittwald callback URI (packages/oauth-server/src/handlers/interactions.ts:244-287). OAuth 2.1
requires the authorization server to finish the interaction and issue the authorization code itself; bypassing that
guarantees every client exchange fails.
- That fabricated code is neither persisted nor registered with oidc-provider, so the follow-up call to /token can
never succeed. The second browser hit immediately receives a 204 because the interaction was already consumed, matching
the "flow completed successfully" log yet the client stalls.
- The redirect after Mittwald login points to config.redirectUri, which is the Mittwald → AS callback (packages/
oauth-server/src/handlers/interactions.ts:272-282). Users are therefore bounced back into the Mittwald callback route
instead of being sent to the client's redirect_uri, explaining the observed dashboard loop.
- The scope/DCR middleware forces a compressed, hard-coded scope set and rewrites every /auth request (packages/
oauth-server/src/middleware/custom-scope-validation.ts:15-198, packages/oauth-server/src/server.ts:200-287). That
contradicts the documentation (advertised 40+ scopes) and masks the real issue, but it is not the root cause of the
breakage.
- RFC 7591 (OAuth 2.0 DCR) and the OAuth 2.1 draft both assume the AS issues codes/tokens; nothing in those specs
supports the manual code generation approach taken here (see curl pulls of draft-ietf-oauth-v2-1-10.txt and RFC7591).
Mittwald's developer portal confirms they expose a standards-compliant OAuth 2 flow—our AS is the component diverging
from spec.

## Evidence Collected

- fly status -a mittwald-oauth-server and fly status -a mittwald-mcp-fly2 show the latest deployments (2025-09-21),
aligning with the regression window.
- gh auth status / gh repo view confirm we're analysing robertDouglass/mittwald-mcp on branch main.
- Public docs at https://developer.mittwald.de (fetched via curl) describe the Mittwald OAuth endpoints and expect
standards behaviour.

## Recommended Fixes

- Replace the manual redirect/code block with a proper provider.interactionFinished(ctx.req, ctx.res, { login:
{ accountId }, consent: {} }, { mergeWithLastSubmission: false }), then let oidc-provider return its own 302 to the
registered client redirect_uri. Persist Mittwald tokens (e.g., via adapter) and map them to the resulting grant rather
than embedding them in ad-hoc objects.
- Use interactionDetails data to recover the pending request's params.redirect_uri and rely on oidc-provider
to validate origins; remove the hard-coded https://mittwald-oauth-server.fly.dev/mittwald/callback from
client.authorizationUrl.
- Store interaction state in durable storage (Redis/SQLite) before going live; the current in-memory InteractionStore
will fail as soon as the Fly app scales.
- Roll back the scope-rewriting middleware and DCR overrides unless a real incompatibility is demonstrated—first verify
flows with oidc-provider's built-in validation against the scope set defined in config/provider.ts.
- After the fixes, run end-to-end tests (e.g., Postman collection, JAM Inspector, Claude) and ensure /token exchanges
succeed without manual intervention.

## Next Steps

1. Implement the interaction fix locally, validate with a single OAuth client, and add regression tests covering /auth
→ Mittwald → /token.
2. Re-deploy the corrected OAuth server, monitor Fly logs during a live authorization, and confirm the client receives
a valid code + tokens.