# Supply Chain & Dependency Notes (Initial)

## Base Images
- mittwald-mcp: node:20.12.2-alpine across Dockerfile/openapi.Dockerfile/stdio.Dockerfile; installs openssh-client and global @mittwald/cli@1.12.0.
- packages/oauth-bridge: built on node:20.12.2-alpine.
- mittwald-oauth: node:20-alpine (all stages).

Risks/todos:
- [ ] Track Node base image CVEs and ensure timely updates; prefer digest pins.
- [ ] Verify need for openssh-client in prod images; drop if unnecessary to shrink attack surface.
- [ ] Global @mittwald/cli injects external supply chain; ensure pinned version and integrity.

## mittwald-mcp Dependencies (package.json)
- Runtime: express 5.1.0 (RC), cors, cookie-parser, ioredis, jose 6.0.11, openid-client 6.6.2, jsonwebtoken 9.0.2, zod, @mittwald/api-client.
- Dev: vitest 3.2, eslint 9, @mittwald/cli 1.12.0, axios, supertest, tsc-alias/tsx/typescript 5.8.
Notes:
- [ ] Assess Express 5 RC stability and middleware compatibility (error handling changes).
- [ ] Jose/jwt/oidc overlap—ensure single verification path to avoid confusion.
- [ ] npm ci fallback to npm install in Dockerfile may allow drift if package-lock missing; check lock hygiene.

## mittwald-oauth Dependencies
- Runtime: express 4.18, @jmondi/oauth2-server 3.4, joi validation, express-rate-limit 7.5, bcrypt, knex/pg, helmet, morgan/winston.
- Dev: jest/ts-jest, playwright 1.40, eslint 8.52, typescript 5.3.
Notes:
- [ ] Check oauth2-server library security posture and PKCE/support for OAuth 2.1 edge cases.
- [ ] Ensure bcrypt rounds configurable per env; watch for blocking risk under load.

## Actions & External Services
- GitHub Actions: checkout/setup-node/docker/buildx/flyctl/newman. Fly deploys require secrets.FLY_API_TOKEN.
- External registries: npmjs, ghcr (mock-oauth image), Fly registry.

Follow-ups:
- [ ] Run dependency vulnerability scan (npm audit/trivy/npm-dependency-check) and triage.
- [ ] Consider locking npm registry via npmrc and integrity checks; evaluate package signing/SLSA provenance.
- [ ] Verify package-lock.json freshness and absence of git sources or http registries.
