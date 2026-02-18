# Documentation Sites Operator Runbook

This runbook is the canonical way to build, verify, and serve the two documentation sites in this repository.

Customer handover entrypoint:
- `docs/OPERATIONS-START-HERE.md`

If you need deployed functional MCP testing instructions, use:
- `docs/FUNCTIONAL-TESTING-OPERATIONS.md`

## Sites

| Site | Source Directory | Build Output |
|---|---|---|
| Setup & Guides | `docs/setup-and-guides/` | `docs/setup-and-guides/dist/` |
| Tool Reference | `docs/reference/` | `docs/reference/dist/` |

## Prerequisites

- Node.js and npm installed (version compatible with this repository; see `.nvmrc`).
- Dependencies installed for each docs site (`npm ci` inside each site directory).
- Run commands from repository root unless stated otherwise.

## Build Both Sites (Preferred)

```bash
cd docs
./build-all.sh local
```

The script builds both sites in a consistent order and prints output directories.

### Build Scenarios

```bash
./build-all.sh local
./build-all.sh production
./build-all.sh github-pages
BASE_URL=/docs SETUP_SITE_URL=/docs REFERENCE_SITE_URL=/docs/reference ./build-all.sh custom
```

## Build a Single Site

```bash
cd docs/setup-and-guides
npm ci
npm run build
```

```bash
cd docs/reference
npm ci
npm run build
```

## Spot Check Built Output

### Setup & Guides

```bash
python3 -m http.server 4401 --directory docs/setup-and-guides/dist
```

In another shell:

```bash
curl -I http://127.0.0.1:4401/
curl -I http://127.0.0.1:4401/getting-connected/codex-cli/
curl -I http://127.0.0.1:4401/tutorials/agency-multi-project-management/
```

### Tool Reference

```bash
python3 -m http.server 4402 --directory docs/reference/dist
```

In another shell:

```bash
curl -I http://127.0.0.1:4402/
curl -I http://127.0.0.1:4402/tools/
curl -I http://127.0.0.1:4402/tools/project/project-create/
```

Expected result: `HTTP/1.0 200 OK` on each route.

## Local Authoring (Hot Reload)

```bash
cd docs/setup-and-guides
npm run dev
```

```bash
cd docs/reference
npm run dev
```

## Deployment Notes

- Use `DEPLOY.md` for infrastructure-level deployment details.
- Keep this file focused on operator tasks for building and validating docs artifacts.
