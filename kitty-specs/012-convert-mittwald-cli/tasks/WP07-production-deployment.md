---
work_package_id: "WP07"
subtasks:
  - "T042"
  - "T043"
  - "T044"
  - "T045"
  - "T046"
  - "T047"
  - "T048"
title: "Production Deployment & Validation"
phase: "Polish"
lane: "done"
assignee: "Claude"
agent: "claude"
shell_pid: "81510"
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-12-18T06:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-18T15:45:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "81510"
    action: "Started implementation - Production deployment and validation"
  - timestamp: "2025-12-18T16:02:00Z"
    lane: "done"
    agent: "claude"
    shell_pid: "81510"
    action: "Completed WP07 - Production deployed successfully, all validation tests passed"
---

# Work Package Prompt: WP07 – Production Deployment & Validation

## Objectives

Deploy to production, validate concurrency and performance.

**Success Criteria (Gate 7):**
- [ ] Deployed to mittwald-mcp-fly2
- [ ] 10 concurrent users, zero failures
- [ ] <50ms median response time
- [ ] 1000 req/sec throughput
- [ ] Zero process spawning
- [ ] Auth unchanged

**User Stories:** US1 (Concurrent Users), US5 (Performance)

## Context

**Dependencies:** WP06 (CLI removed)

**Strategy:** Commit → GitHub Actions deploy → monitor → test concurrency + performance.

**Critical:** Per CLAUDE.md, NEVER run `fly deploy` directly. Use GitHub Actions only.

---

## Subtasks

### T042 – Update workspace dependencies
Add `packages/mittwald-cli-core` to root package.json workspaces. Run `npm install`.

### T043 – Build library for production
`cd packages/mittwald-cli-core && npm run build`. Verify dist/ ready.

### T044 – Commit to main branch
Commit changes, push to main. Triggers `.github/workflows/deploy-fly.yml`.

### T045 – Monitor deployment
`gh run watch`. Monitor GitHub Actions deploy to mittwald-mcp-fly2. Check `flyctl logs`.

### T046 – Run concurrency test
Script: spawn 10 parallel MCP requests (mix of tools). Verify all complete, zero failures.

### T047 – Measure response time
Run 100 requests to mittwald_project_list. Calculate median. Target: <50ms (vs 200-400ms baseline).

### T048 – Verify zero spawning
Check logs for `mw` process spawning. Should be zero. Verify metrics show no child processes.

---

## Parallel Opportunities

T046-T048 (testing) can run concurrently.

---

## Test Strategy

Production validation:
- Concurrency: 10 users, different tools
- Performance: 100 requests, median <50ms
- Process monitoring: zero `mw` spawns

**Pre-Production Testing:**
- Real Mittwald access token available in `/Users/robert/Code/mittwald-mcp/.env`
- Use for local concurrency/performance testing BEFORE production deploy
- Test script example:
  ```typescript
  import 'dotenv/config';
  const apiToken = process.env.MITTWALD_API_TOKEN!;

  // Test concurrency locally
  const requests = Array(10).fill(null).map(() =>
    listApps({ projectId: 'p-real-id', apiToken })
  );
  const results = await Promise.all(requests);
  console.log(`Success: ${results.filter(r => r.status === 200).length}/10`);
  ```
- Validates library behavior before Fly.io deployment

---

## Risks

**Risk:** Production concurrency issues
- **Mitigation:** Staging validation recommended, rollback plan ready

**Risk:** Deployment fails
- **Mitigation:** Monitor GitHub Actions, check logs immediately

---

## Definition of Done

- [ ] All T042-T048 completed
- [ ] Deployed to production
- [ ] Concurrency test passed (10 users)
- [ ] Performance test passed (<50ms)
- [ ] Zero spawning verified
- [ ] Auth flows unchanged
- [ ] Gate 7 criteria met
- [ ] Feature complete!

---

## Activity Log

- 2025-12-18T06:00:00Z – system – lane=planned – Prompt created
