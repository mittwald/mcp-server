# WP04: Prepare Test Infrastructure for Re-execution

**Work Package ID**: WP04
**Priority**: P1 HIGH
**Complexity**: LOW (infrastructure checks)
**Owner**: Test Infrastructure
**Estimated Time**: 1-2 hours
**Depends On**: WP1 (extraction must be integrated)
**Blocks**: WP5 (can't execute without this)

---

## Objective

Verify that test harness is ready for clean 007 re-execution with fixed extraction code and outcome-focused prompts. Establish health check, execution plan, and logging configuration.

---

## Subtasks

### T020: Verify Test Harness Integration

**Goal**: Confirm executor.ts changes compiled and working

**Instructions**:

1. **Verify compilation**:
   ```bash
   cd tests/functional
   npm run build
   ```
   - Should complete without errors
   - Check `dist/use-cases/executor.js` updated

2. **Test single execution**:
   ```bash
   npm run test -- --use-case apps-001-deploy-php-app --single
   ```
   - Should run one use case against live MCP server
   - Check execution result is created

3. **Verify tool data captured**:
   - Open generated execution result JSON
   - Check `toolsInvoked[]` is non-empty
   - Verify tool names look correct (e.g., start with `mcp__mittwald__`)

4. **Example validation**:
   ```json
   {
     "id": "apps-001-...",
     "useCaseId": "apps-001-deploy-php-app",
     "status": "success",
     "toolsInvoked": [
       "mcp__mittwald__mittwald_project_list",
       "mcp__mittwald__mittwald_app_create_php",
       ...
     ]
   }
   ```

**Acceptance Criteria**:
- Compilation succeeds
- Single test execution completes
- `toolsInvoked[]` is populated

---

### T021: Health Check MCP and OAuth Servers

**Goal**: Verify Fly.io infrastructure is operational

**Instructions**:

1. **Check MCP server health**:
   ```bash
   curl -s https://mittwald-mcp-fly2.fly.dev/health | jq .
   ```
   - Should return `{ "status": "ok" }` or similar
   - If down or slow, note for investigation

2. **Check OAuth server health**:
   ```bash
   curl -s https://mittwald-oauth-server.fly.dev/health | jq .
   ```
   - Should return healthy status

3. **Verify JWT secret synchronization** (critical):
   ```bash
   # Get OAuth secret
   flyctl ssh console -a mittwald-oauth-server -C "printenv BRIDGE_JWT_SECRET" 2>/dev/null | tail -1

   # Get MCP secret
   flyctl ssh console -a mittwald-mcp-fly2 -C "printenv OAUTH_BRIDGE_JWT_SECRET" 2>/dev/null | tail -1

   # Compare: should be identical
   ```
   - If different, they must be synchronized using:
     ```bash
     SECRET=$(flyctl ssh console -a mittwald-oauth-server -C "printenv BRIDGE_JWT_SECRET" 2>/dev/null | tail -1)
     flyctl secrets set OAUTH_BRIDGE_JWT_SECRET="$SECRET" -a mittwald-mcp-fly2
     ```

4. **Create health check log**:
   ```
   MCP Server: ✓ Healthy (response time: XXms)
   OAuth Server: ✓ Healthy (response time: XXms)
   JWT Secrets: ✓ Synchronized
   Status: Ready
   ```

**Acceptance Criteria**:
- Both servers responsive and healthy
- JWT secrets synchronized
- Health check log created

---

### T022: Create Execution Plan and Configuration

**Goal**: Document procedures for full 007 re-execution

**Instructions**:

1. **Create execution plan** document:
   ```markdown
   # 007 Re-execution Plan

   ## Pre-execution Checklist
   - [ ] WP1 tool extraction fix completed and integrated
   - [ ] WP3 prompt rewrites completed and verified
   - [ ] WP4 infrastructure ready (this WP)
   - [ ] Backup existing execution results
   - [ ] Free disk space checked (at least 5GB)

   ## Execution Steps
   1. Run: npm run test -- --suite 007 --use-cases all
   2. Expected runtime: 4-5 hours
   3. Monitor for errors/timeouts
   4. Save session logs and execution results

   ## Monitoring
   - Watch console output for errors
   - Set up background logging if needed
   - Note any timeouts or failures
   - Record start and end times

   ## Post-execution
   - Verify all 31 results created
   - Check toolsInvoked[] populated
   - Compare to old baseline
   - Document findings
   ```

2. **Create cleanup protocol**:
   - How to backup old execution results
   - How to recover if execution fails mid-way
   - How to clean up temporary test data

3. **Create monitoring configuration**:
   - Log file path for full test output
   - Error capture configuration
   - Optional: Prometheus metrics if applicable

4. **Establish rollback plan**:
   - How to revert if issues discovered
   - Which files/commits to restore

**Acceptance Criteria**:
- Execution plan documented (2-3 pages)
- Pre-execution checklist created
- Cleanup and rollback procedures documented
- Monitoring configuration in place

---

## Implementation Sketch

**Sequential**:
1. T020: Verify test harness (~30 min)
2. T021: Health check servers (~20 min)
3. T022: Create execution plan (~30 min)
- **Total**: 1.5-2 hours

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Servers down during check | Have fallback (manual verification or delay) |
| JWT secrets out of sync | Explicitly verify and resync if needed |
| Disk space insufficient | Check and free up before execution |
| Network connectivity issues | Verify from same network test will run from |

---

## Definition of Done

- [ ] Compilation succeeds
- [ ] Single test execution works with tool data captured
- [ ] Both servers healthy and responsive
- [ ] JWT secrets verified synchronized
- [ ] Execution plan created and documented
- [ ] Pre-execution checklist ready
- [ ] Cleanup and rollback procedures documented
- [ ] Ready for WP5 execution

---

## Next Steps

Once WP04 complete:
- Proceed to WP05: Execute 007 test suite
- Run full 31 use cases with fixed infrastructure and rewritten prompts

**Infrastructure Ready - Can Execute WP05**
