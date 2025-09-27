# ChatGPT OAuth Flow Regression – 2025-09-27

- **Git hash:** `0847dfbc49e3fcce1e739d4f41c13aba14048177`
- **Client:** ChatGPT connector platform (`https://chatgpt.com/connector_platform_oauth_redirect`)
- **Environment:** `mittwald-oauth-server.fly.dev`
- **Reported by:** manual ChatGPT OAuth test (2025-09-27 07:35 UTC)

## Timeline & Evidence

### Dynamic Client Registration
```
2025-09-27T07:35:32Z app[2873247b045548] fra [info]{"event":"registration_create.success","clientId":"Qi7fH18Y470tL0mPhj8F_T2v_g7opZqnLaVbS-m9d1J", ... ,"redirect_uris":["https://chatgpt.com/connector_platform_oauth_redirect"],"scope":"user:read customer:read project:read app:read"}
```
The proxy generated a public client for ChatGPT with `token_endpoint_auth_method":"none"`, demonstrating `/reg` remains functional.

### Authorization Loop
```
2025-09-27T07:35:37Z app[2873247b045548] fra [info]{"requestId":"Napv0U7Yoc","method":"GET","url":"/auth?...","status":303,"duration":"6ms"}
2025-09-27T07:35:37Z app[2873247b045548] fra [info]{"requestId":"iw4NOyWN5B","method":"GET","url":"/interaction/Uv3alSMtKk4Mo9x0md63tb2wnCKsdOGCwmEntb4wb3k","status":303}
...
2025-09-27T07:35:44Z app[2873247b045548] fra [info]{"level":50,"event":"authorization.error","error":"invalid_request","error_description":"authorization request has expired","path":"/auth/r1YTSqZfWEF2_Q22fzTF3CJc34EqJgEyPINazJa4RKS"}
```
ChatGPT repeatedly cycled between `/auth/:uid` and `/interaction/:uid` until the interaction expired.

### HAR Findings (`/Users/robert/Downloads/chatgpt-2.har`)
```
GET https://mittwald-oauth-server.fly.dev/auth?...  → 303
access-control-allow-origin: *
location: /interaction/Uv3alSMtKk4Mo9x0md63tb2wnCKsdOGCwmEntb4wb3k
(no Set-Cookie header)

GET https://mittwald-oauth-server.fly.dev/interaction/...  (request headers contain no Cookie)

GET https://mittwald-oauth-server.fly.dev/auth/r1YTSqZfWEF2_Q22fzTF3CJc34EqJgEyPINazJa4RKS  → 400
{"error":"invalid_request","error_description":"authorization request has expired"}
```
The browser never stored `_interaction` / `_session` cookies, so oidc-provider treated every visit as a fresh interaction.

## Root Cause

At git `0847dfbc49e3fcce1e739d4f41c13aba14048177`, the global CORS middleware in `packages/oauth-server/src/server.ts` still returns `Access-Control-Allow-Origin: *` with `credentials: false`. Browsers refuse to store cookies on such responses, stripping `Set-Cookie` headers and omitting cookies on subsequent requests. Without the interaction cookies, oidc-provider cannot resume the flow and ultimately emits `authorization request has expired`.

```ts
// packages/oauth-server/src/server.ts (current deploy)
app.use(cors({
  origin: '*',
  credentials: false,
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'mcp-protocol-version']
}));
```

## Remediation Plan

1. Update the provider-level CORS policy to echo the caller's origin and enable credentials so browsers accept the `Set-Cookie` headers, e.g.:
   ```ts
   app.use(cors({
     origin: (ctx) => ctx.headers.origin ?? '*',
     credentials: Boolean(ctx.headers.origin),
     allowMethods: ['GET', 'POST', 'OPTIONS'],
     allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'mcp-protocol-version'],
   }));
   ```
2. Redeploy the OAuth proxy and re-test the ChatGPT OAuth flow, confirming `/auth` responses now include `_interaction` / `_session` cookies and `/token` is invoked.
3. Capture an updated HAR and Fly log bundle for regression tracking.

## Status

- **Open.** ChatGPT integrations remain blocked at `0847dfbc49e3fcce1e739d4f41c13aba14048177` until the CORS change is deployed.
