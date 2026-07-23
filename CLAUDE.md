# mittwald-mcp Development Guidelines

## Production Infrastructure

Both services run as containers in a single mittwald container stack, provisioned by the Terraform
config in `deploy/`:

- MCP server — https://mcp.mittwald.de (image `mittwald/mcp-server-http`, built from `Dockerfile`)
- OAuth bridge — https://auth.mcp.mittwald.de (image `mittwald/mcp-server-oauth`, built from
  `packages/oauth-bridge/Dockerfile`)

The stack also contains a mittwald-managed Redis, shared by both containers. TLS is terminated by
the mittwald ingress, so both containers run with `ENABLE_HTTPS=false`.

### Add MCP Server to Claude Code
```bash
claude mcp add --transport http mittwald https://mcp.mittwald.de/mcp
```

### Deployment - CRITICAL

**Never run `terraform apply` from a workstation, and never push images by hand.** Deployment is
driven entirely by `.github/workflows/build-and-publish.yml`, which triggers on `v*` tags:

1. Tag a release: `git tag v1.2.3 && git push origin v1.2.3`
2. The workflow builds and pushes both images to Docker Hub
3. It then runs `terraform apply` in `deploy/` with `image_tag` set to the tag's version

Terraform state lives in the HCP Terraform workspace `mittwald/mcp-server`, so a local apply will
fight the workflow for the lock and can deploy an image that was never built.

**To check deployment status:**
```bash
gh run list --limit 5
gh run watch
gh run view --log-failed
```

### Single Instance Only - CRITICAL

Sessions and OAuth state live in Redis, but the MCP transport keeps per-session state in memory.
Keep **one replica of each container**. Running several breaks session lookups, OAuth state
handoff, and authentication.

## Project Structure
```
src/                       MCP server (HTTP transport, auth, tool handlers, tool definitions)
packages/oauth-bridge/     OAuth 2.1 bridge to Mittwald (Koa)
packages/mittwald-cli-core/ Mittwald CLI business logic extracted as an importable library
deploy/                    Terraform config for the production container stack
docs/                      Operator runbooks + two Astro documentation sites
tests/                     Unit, integration, e2e, security, smoke and functional suites
evals/                     Agent-native E2E harness and prompt corpus
```

## Commands
```bash
npm run build:all   # Build workspace packages, then the server
npm run test        # Run the full vitest suite
npm run lint
npm run type-check
```

## Code Style
Follow standard TypeScript conventions.

**No banner-comment subsections.** If a file needs

```typescript
// ============================================================================
// SOME SECTION
// ============================================================================
```

to stay navigable, it is too big — split it into one file per section instead. In
`packages/mittwald-cli-core/src/resources/` that means one file per resource (`backup.ts`,
`domain.ts`, `database-mysql.ts`, …), re-exported from `src/index.ts`. Consumers import from the
package root (`@mittwald-mcp/cli-core`), so splitting a module never changes their imports.

## Tool Annotations - CRITICAL

**Every new tool MUST declare a title and behavioural hints.** This is a hard requirement of the
[Claude connector review criteria](https://claude.com/docs/connectors/building/review-criteria#provide-tool-annotations)
— a tool without them fails review.

Each tool definition in `src/constants/tool/**` needs a top-level `title` plus an `annotations` block:

```typescript
const tool: Tool = {
  name: 'mittwald_app_list',
  title: 'List Apps',
  annotations: {
    title: 'List Apps',        // mirrors the top-level title (legacy clients read this one)
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  },
  description: '...',
  inputSchema: { /* ... */ },
};
```

**Choosing the hints:**
- Read-only (`list`, `get`, `versions`, `logs`, `dump`, `download`): `readOnlyHint: true, destructiveHint: false`
- Overwrites/removes/disrupts existing state (`delete`, `update`, `revoke`, `uninstall`, `stop`,
  `restart`, `deploy`, interactive shells, arbitrary command execution): `readOnlyHint: false, destructiveHint: true`
- Creates new resources only (`create`, `install`, `invite`, `execute`): `readOnlyHint: false, destructiveHint: false`

Never set both `readOnlyHint` and `destructiveHint` to `true`.

**`openWorldHint` (required by the OpenAI integration):** for write tools, `true` if the tool can
change publicly visible internet state — publishing content, changing what a public site or mail
domain serves, pushing code, sending messages to third parties. `false` only if the tool operates
entirely within closed or private systems. Read-only tools change nothing, so they are always
`false`.

In this codebase that means `openWorldHint: true` for app installs/updates/uninstalls, certificate
requests, container/stack deployments, DNS zone and virtualhost changes, mail address changes,
organisation invitations (they send email) and project deletion. Everything else — databases,
backups, volumes, registries, SSH/SFTP users, API tokens, memberships, delivery boxes, cronjobs and
container lifecycle operations (start/stop/restart) — stays `false`.

`tests/unit/tools/tool-annotations.test.ts` enforces this across the whole registry — it will fail
if a new tool is missing a title or any of the three hints.

## Return Connection Data, Don't Execute - CRITICAL

The MCP server is stateless and must never open interactive sessions, tunnels, browsers or
file transfers on the server host. Tools that cover such operations resolve the **connection data**
via the Mittwald API and return a ready-to-run command for the agent to execute locally:

| Tool | Returns |
| --- | --- |
| `mittwald_app_ssh` / `mittwald_project_ssh` | SSH host, user, directory + `ssh` command |
| `mittwald_database_mysql_port_forward` | `ssh -N -L <port>:<host>:3306` command |
| `mittwald_database_mysql_dump` / `_import` | `ssh … mysqldump/mysql` command piped to/from a local file |
| `mittwald_database_mysql_phpmyadmin` | phpMyAdmin URL (no browser is opened) |
| `mittwald_backup_download` | Backup export download URL (no file is transferred) |

Helpers live in `src/utils/ssh-command.ts` and `src/utils/mysql-ssh-command.ts`. The API lookups
live with their resource, not in a shared "connectivity" module: `getProjectSshConnection` in
`resources/project-ssh.ts`, `getAppSshConnection` in `resources/app-ssh.ts`, `getMysqlConnection`
and `getPhpMyAdminUrl` in `resources/database-mysql-connection.ts`, `getBackupDownloadUrl` in
`resources/backup.ts` (all under `packages/mittwald-cli-core/src/`). Never shell out to `ssh`,
`mysqldump`, `curl` or `open` from a handler — build the command and hand it back instead.
MySQL passwords go into the command via `MYSQL_PWD`, never `-p<password>` (which leaks into the
remote process list).

## Mittwald OAuth Scopes - CRITICAL

**Mittwald accepts scopes in `resource:action` format ONLY:**
- `app:read`, `app:write`, `app:delete`
- `user:read`, `user:write`
- `project:read`, `project:write`, `project:delete`
- etc. (see https://api.mittwald.de/v2/scopes for full list)

**What Mittwald does NOT accept:**
- `mittwald:api` - There is NO passthrough scope!
- Any scope not in the /v2/scopes list

`openid`, `offline_access` and `profile` are a special case: clients may request them (MCP clients
routinely do), so they are in `supportedScopes`, but they are **not** in `upstreamScopes` and are
therefore stripped before the request reaches Mittwald.

**The oauth-bridge flow:**
1. Clients request scopes (e.g., `user:read customer:read app:read`)
2. Bridge validates these against `config/mittwald-scopes.json`
3. When redirecting to Mittwald: Send actual scopes from the `upstreamScopes` list
4. Default scopes: `user:read customer:read project:read app:read`

**Location:** `config/mittwald-scopes.json` holds the catalogue (override the path with
`MITTWALD_SCOPE_CONFIG_PATH`); `packages/oauth-bridge/src/config/mittwald-scopes.ts` loads it and
exports `MITTWALD_SCOPE_STRING`.

## OAuth Bridge DCR Architecture - CRITICAL

**Mittwald's OAuth redirect list is STRICTLY IMMUTABLE.** This drives the entire OAuth bridge design.

### Why DCR (Dynamic Client Registration) is Required
- Mittwald pre-registers allowed redirect URIs - we CANNOT add arbitrary ones
- The bridge has ONE fixed redirect_uri with Mittwald: `{BRIDGE_BASE_URL}/mittwald/callback`
- Clients (Claude.ai, ChatGPT, etc.) register their redirect_uri via DCR with our bridge
- The bridge proxies the OAuth flow, using its own redirect_uri with Mittwald

### Flow
1. Client calls `POST /register` with their `redirect_uri` (DCR)
2. Client calls `/authorize` - bridge validates against DCR-registered URIs
3. Bridge redirects to Mittwald using the bridge's fixed redirect_uri
4. Mittwald authenticates and redirects back to bridge
5. Bridge redirects to the client's DCR-registered redirect_uri

### Error: "redirect_uri is not registered"
This means the client did NOT use DCR first. They must call `POST /register` before `/authorize`.

**DO NOT:**
- Try to add client redirect URIs to a static config list
- Bypass DCR validation in the authorize route
- Assume redirect_uri validation happens elsewhere

**Location:** `packages/oauth-bridge/src/routes/authorize.ts` - DCR lookup via `stateStore.getClientRegistration()`


## Operations Checklist

### JWT Secret Synchronization - CRITICAL
The OAuth bridge and MCP server must share the same JWT signing secret:
- **OAuth bridge**: `BRIDGE_JWT_SECRET`
- **MCP server**: `OAUTH_BRIDGE_JWT_SECRET`

These MUST be identical. If they differ, JWT signature verification fails and the MCP server falls
back to validating the token against Mittwald on every request, which is slow and has caused OOM
kills in the past.

Terraform guarantees this: both containers in `deploy/main.tf` get their value from the single
`random_string.jwt_secret` resource. Do not set either variable by hand — change it in Terraform or
the two will drift.

### Health Check URLs
- OAuth bridge: https://auth.mcp.mittwald.de/health
- MCP server: https://mcp.mittwald.de/health

Both return `{"status":"healthy",...}` including a `checks.redis` field.

### Logs
Container logs are read through the mittwald CLI against the MCP project:

```bash
mw container list --project-id <project-id>
mw container logs <container-id>
```

## Execution Model - CRITICAL

Tool handlers reach Mittwald in one of two ways, and new handlers should use the first:

1. **Library calls (preferred, ~120 handlers)** — import from `@mittwald-mcp/cli-core`, a package
   containing the business logic extracted from `@mittwald/cli`'s `src/lib/`. No process is
   spawned.

   ```typescript
   import { listApps } from '@mittwald-mcp/cli-core';

   const result = await listApps({ projectId, apiToken: session.mittwaldAccessToken });
   ```

2. **`mw` subprocess (legacy, 41 handlers)** — via `invokeCliTool` in `src/tools/cli-adapter.ts`.
   Spawning is slow and does not survive concurrency well, which is why the migration exists. Most
   of these handlers back tools listed in `EXCLUDED_TOOLS_WITH_REASONS` in
   `src/utils/tool-scanner.ts` and are therefore never reachable. Five registered tools still spawn
   `mw`: `mittwald_container_start`, `_stop`, `_restart`, `_delete` and `mittwald_volume_create`.
   Migrating one means porting the logic into `packages/mittwald-cli-core/src/resources/` and, for
   an excluded tool, removing its exclusion.

Why not import `@mittwald/cli` directly? It exports no library interface (`main: null`,
`exports: null`) — only the `bin/mw` binary. Why not `@mittwald/api-client` alone? One CLI command
is often several API calls plus validation and orchestration.

## Tool Registry

`src/constants/tool/mittwald-cli/**` holds 161 tool definitions; 45 of them are excluded by
`src/utils/tool-scanner.ts`, leaving **116 tools registered** across 16 domains. The exclusion map
is the single source of truth for what clients can call — the reference docs site and its coverage
check both read it.

## Documentation

Two Astro/Starlight sites are the end-user documentation:

- `docs/setup-and-guides/` — getting connected, how-to, tutorials, runbooks, explainers
- `docs/reference/` — one page per tool, **generated** from the tool registry; never hand-edit
  `docs/reference/src/content/docs/tools/` (see `docs/reference/README.md` for the regeneration
  commands)

`npm run docs:guardrails` validates internal links, Codex CLI flags against captured `--help`
snapshots, and tutorial→use-case mappings. Run it after touching either site.
