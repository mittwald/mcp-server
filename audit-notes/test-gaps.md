# Test Gap Log (Initial)

- [ ] Cross-repo E2E: Auth code + PKCE flow between `mittwald-oauth` and `mittwald-mcp`, including client_secret_post issuance and refresh rotations; mock Mittwald ID and CLI execution.
- [ ] Negative OAuth/DCR cases in `mittwald-oauth`: redirect URI mismatch, missing PKCE, invalid code_verifier lengths, replayed auth codes, token_endpoint_auth_method variations, invalid scope requests.
- [ ] DCR registration access token enforcement: GET/PUT/DELETE with missing/invalid/expired tokens; ensure tokens are bound to client_id and cannot be guessed.
- [ ] Token substitution/validation: JWT audience/issuer/kid mismatches, expired/nbf skew, alg downgrade attempts, tampered Mittwald token payloads.
- [ ] State/CSRF: reuse/expired state tokens, missing state, duplicated redirects; ensure single-use and TTL enforcement.
- [ ] CLI invocation safety: fuzz tool inputs, oversized outputs, timeouts, stdout/stderr redaction; ensure resource caps enforced.
- [ ] Rate limiting/abuse: high-volume DCR requests, token refresh storms, brute-force on admin endpoints; verify limits in logs.
- [ ] Persistence failures: Redis/DB downtime handling during OAuth exchange and CLI session execution; verify retry/backoff behavior.
- [ ] Logging/PII: tests ensuring tokens/secrets not logged on errors; structured logs present for traceability.
