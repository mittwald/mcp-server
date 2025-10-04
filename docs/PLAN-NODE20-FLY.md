# Fly.io Node 20 Upgrade Plan

**Date**: 2025-10-03  
**Owner**: Mittwald MCP Platform Team  
**Status**: Draft – Awaiting approval

---

## Objective

Run all Fly.io deployments of the Mittwald MCP server family (primary app, stdio bridge, OpenAPI runner) on Node.js 20 LTS. All builds and deployments MUST continue to flow through GitHub Actions; no direct `fly deploy` commands from developer machines. Ensure deployment artifacts, pipelines, and runtime configuration consistently target Node 20, with rollback options if regressions appear.

## Current State

- Dockerfiles in the repo already reference `node:20-alpine`, but production images may still be pinned to older tags in Fly deployments.  
- `package.json` currently allows Node 18+. CI pipelines do not explicitly enforce Node 20.  
- Fly configuration (`fly.toml`, GitHub Actions deploy job) is not version-pinned within the repo; we must confirm what the Fly builder currently uses.

## Deliverables

1. Verified Fly deployment(s) running images built on Node 20 LTS.  
2. CI/CD pipeline (build + deploy) executes with Node 20.  
3. All documentation, tooling, and `engines` metadata reflect Node 20 as the minimum.  
4. Rollback playbook and monitoring plan documented.

## Work Breakdown & Timeline

### Phase 0 – Discovery (0.5 day)
- Inventory Fly apps (primary, stdio, OpenAPI) and record current image digests + Node runtime.  
- Export current `fly.toml`/deployment config from Fly (`flyctl config save`) and add sanitized copies to the repo so GitHub Actions can consume them.  
- Confirm CI/CD pipelines' Node versions; update any local developer tooling notes.

### Phase 1 – Repository Updates (0.5 day)
- Pin Dockerfiles to explicit Node 20.x LTS tags (e.g., `node:20.11-alpine`) for reproducibility.  
- Document that Fly startup still runs `npm install -g @mittwald/cli`; add a checklist item to open a fresh Fly machine after deploy and verify `node --version` plus the CLI install both report Node 20.
- Update `package.json` engines to `"node": ">=20.0.0"` and refresh README/docs.  
- Add or adjust developer tooling files (`.nvmrc`, Volta) if they exist.  
- Document Fly environment configuration (ports, secrets, scaling) in repo.

### Phase 2 – CI/CD Alignment (0.5 day)
- Update GitHub Actions workflows to use Node 20 for build/test/lint and for the Fly deploy job (`actions/setup-node@v4`, `node-version: 20.x`).  
- Ensure docker build steps in workflows pull the updated Node 20 base image.  
- Add a CI guard step in the deploy workflow that prints `node --version` before invoking Fly.  
- Verify the deploy workflow passes the Fly API token/`flyctl` version explicitly to avoid implicit upgrades.

### Phase 3 – Staging Deployment & Verification (1 day)
- Trigger the staging GitHub Actions workflow (or create a temporary workflow) that builds with Node 20 and deploys to a staging Fly app.  
- Run regression suite (unit, integration, smoke tests) against staging.  
- Monitor logs/metrics for at least one business day; validate CLI behaviour.  
- Re-run the original reproduction command on staging (`DEBUG=* node --trace-warnings "$(which mw)" org invite list-own …`) to confirm the regex warnings are resolved before promoting to production.

### Phase 4 – Production Rollout (0.5 day)
- Promote via the production GitHub Actions workflow (same pipeline as staging with environment protection rules).  
- Post-deploy checks: `fly logs`, `/health` endpoint, `node --version` inside a new machine, and confirm the workflow artifacts captured the image digest.  
- Announce change in release notes/internal channel.

### Phase 5 – Post-Rollout Cleanup (0.25 day)
- Remove temporary feature flags or staging resources created for validation.  
- Review GitHub Actions workflow history for both staging and production runs; ensure success states are documented.  
- Archive this plan with final status and lessons learned.

## Testing & Validation

- `npm run lint`, `npm run type-check`, `npm test`, `npm run test:integration`.  
- Smoke tests against Fly staging and production (health checks, tool invocation).  
- Optional load/perf comparison between Node 18 and Node 20 builds.

## Monitoring & Rollback

- Ensure Fly dashboards/alerts track 5xx rates, CPU, memory, and boot errors during rollout.  
- Rollback path: redeploy previous image via `fly deploy --image <registry.fly.io/...:previous>` (keep reference of last-good digest).  
- Maintain a short-term staging instance running previous version until rollout confirmed stable.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Node 20 introduces breaking change in dependency | Medium | Run full test suite, review release notes of key dependencies |
| CI still uses Node 18 | Medium | Update actions/setup-node to `20.x`; add guard script |
| Fly build cache conflicts | Low | Use `fly deploy --build-arg BUILDKIT_INLINE_CACHE=1`, clear cache if needed |
| Runtime stats regress | Low | Compare metrics before/after rollout, keep rollback ready |

## Approvals & Stakeholders

- **Approvers**: Platform lead, DevOps lead.  
- **Stakeholders**: Backend engineers, Support, DevRel.  
- **Target window**: Week of 2025-10-06 (staging mid-week, production at end of week).
