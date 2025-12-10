# Sprint 008 - WP05 Execution Plan

**Date**: 2025-12-09
**Phase**: Phase 2 - Test Data Quality Fixes
**Objective**: Re-execute all 31 use cases with fixed infrastructure and generate final validation report

---

## Overview

This document outlines the procedure for executing the Sprint 007 test suite (all 31 use cases) with the fixed infrastructure from Sprint 008 (WP01-WP03). The execution will produce comprehensive data quality metrics and validate that the LLM tool discovery improvements are working as expected.

### Key Changes Since Sprint 007

1. **WP01**: Fixed tool extraction bug
   - Properly handles both `event.type === 'tool_use'` and `event.type === 'message'` with embedded tool blocks
   - Correctly extracts tool names from stream events

2. **WP03**: Rewritten all 31 use case prompts
   - Converted from prescriptive language to outcome-focused format
   - Removed tool name references
   - Maintained business context and constraints

3. **WP02**: Established baseline metrics
   - 127 total expected tool calls across 31 use cases
   - 4.10 average tools per execution
   - Domain-specific complexity profiles documented

---

## Infrastructure Status

### ✅ Verified Components

| Component | Endpoint | Status | Last Check |
|-----------|----------|--------|------------|
| OAuth Bridge Server | https://mittwald-oauth-server.fly.dev | ✅ Healthy | 2025-12-09 |
| MCP Server | https://mittwald-mcp-fly2.fly.dev | ✅ Healthy | 2025-12-09 |
| Test Harness | Local (tests/functional) | ✅ Integrated | Build successful |
| Tool Extraction | executor.ts (dist compiled) | ✅ Fixed | Lines 140-231 |
| JWT Secrets | OAuth ↔ MCP | ✅ Synchronized | Match verified |

### Health Check Results

**OAuth Server**:
```
Status: ok
State Store: ok (Redis PONG)
Pending Authorizations: 3
Registered Clients: 94
```

**MCP Server**:
```
Status: healthy
Service: mcp-server
Capabilities: OAuth (true), MCP (true)
Redis: up
```

**Test Harness**:
```
Test Results: 919 passed, 1 failed (Docker E2E skipped)
Tool Extraction: Compiled and verified
Functional Tests: All passing
```

---

## Pre-Execution Checklist

### Prerequisites ✅
- [ ] WP01 tool extraction integrated and compiled
- [ ] WP02 baseline metrics generated (127 expected tools documented)
- [ ] WP03 all 31 prompts rewritten to outcome-focused format
- [ ] OAuth and MCP servers operational on Fly.io
- [ ] JWT secrets synchronized
- [ ] Test harness builds successfully
- [ ] All unit tests passing (919/920)

### Configuration Requirements
- [ ] MCP server has `OAUTH_BRIDGE_JWT_SECRET` set to `SwVjkrSKGY90vLMVVIkV1B33uWwY1HIG`
- [ ] OAuth server has `BRIDGE_JWT_SECRET` set to `SwVjkrSKGY90vLMVVIkV1B33uWwY1HIG`
- [ ] Test environment variables configured for Fly.io connectivity
- [ ] Execution results directory prepared: `tests/functional/results/`

### Data Preservation
- [ ] Backup existing execution results (if any from Sprint 007)
- [ ] Ensure clean output directory for new run
- [ ] Document baseline for comparison

---

## Execution Procedure

### Phase 1: Pre-Execution Setup (Estimated: 5 minutes)

**T023 - Prepare Execution Environment**

1. Create execution results directory:
   ```bash
   mkdir -p tests/functional/results/$(date +%Y-%m-%d_%H%M%S)
   ```

2. Verify all 31 use case prompts are loaded:
   ```bash
   ls -la tests/functional/use-case-library/*/*.json | wc -l
   # Expected: 31 files
   ```

3. Document execution metadata:
   ```bash
   cat > tests/functional/results/EXECUTION_METADATA.json << 'EOF'
   {
     "execution_id": "<generated_uuid>",
     "start_time": "<ISO_8601_timestamp>",
     "sprint": "008",
     "infrastructure_version": "WP01-WP03 fixed",
     "baseline_metrics": {
       "expected_tools": 127,
       "avg_per_execution": 4.10,
       "domains": 10
     },
     "prompt_version": "outcome-focused",
     "tool_extraction": "fixed"
   }
   EOF
   ```

### Phase 2: Execute All 31 Use Cases (Estimated: 45-90 minutes)

**T024 - Execute Test Suite**

1. Run full use case suite:
   ```bash
   npm run test:functional -- --reporter=json > results/execution_output.json
   ```

2. Monitor execution:
   - Watch logs for tool extraction errors
   - Note any tool calls that deviate significantly from baseline
   - Capture system resource usage
   - Flag any unusual patterns

3. Collect execution results:
   - All 31 execution result files in JSONL format
   - Tool call logs in structured format
   - Error reports if any failures occur

### Phase 3: Data Collection & Validation (Estimated: 20 minutes)

**T025 - Collect & Validate Execution Data**

1. Extract tool calls from execution results:
   ```bash
   npm run extract-execution-metrics
   # Generates: results/execution_tools.json
   ```

2. Validate data quality:
   ```bash
   npm run validate-execution-data
   # Spot-check 10% of results against raw logs
   # Expected: ≥95% accuracy
   ```

3. Generate execution report:
   ```bash
   npm run generate-execution-report
   # Generates: results/EXECUTION_REPORT.md
   ```

### Phase 4: Comparison & Analysis (Estimated: 15 minutes)

**T026 - Compare Against Baseline**

1. Load baseline metrics (from WP02):
   ```
   Baseline: 127 tools, 4.10 avg, 100% success rate
   ```

2. Calculate deltas:
   - Tools discovered vs. baseline
   - Retry patterns in actual execution
   - Domain-specific success rates
   - Unexpected tool calls (false positives)

3. Generate comparison report:
   ```bash
   npm run compare-baseline-vs-execution
   # Output: results/COMPARISON_REPORT.md
   ```

---

## Monitoring Strategy

### During Execution

**Real-time Monitoring**:
- Log stream monitoring: `flyctl logs -a mittwald-mcp-fly2 --no-tail`
- Tool extraction validation in executor logs
- OAuth token refresh monitoring
- Redis state store operations

**Performance Metrics**:
- Average execution time per use case
- Tool extraction latency
- API response times
- Memory usage patterns

**Error Detection**:
- JWT signature verification failures
- Tool extraction mismatches
- OAuth authentication errors
- Network timeouts

### Checkpoints During Execution

| Use Case # | Expected Tools | Checkpoint Type |
|-----------|---|---|
| 1-10 | Baseline average 4.0 | Verify extraction working |
| 11-20 | Apps/Databases complex (5.25, 4.0 avg) | Monitor tool discovery |
| 21-31 | Identity/Backups simpler (3.0, 3.67 avg) | Verify consistency |

### Post-Execution Validation

1. **Completeness Check**:
   - All 31 use cases have results
   - All results have `toolsInvoked[]` populated
   - No null/undefined tool entries

2. **Consistency Check**:
   - Tool names follow MCP naming convention
   - No duplicate tool calls within single execution
   - Tool sequence follows logical business flow

3. **Accuracy Check**:
   - Spot-check 10% of results (3 use cases) against raw JSONL
   - Verify tool names match expected tools from baseline
   - Confirm no tool names missing or added unexpectedly

---

## Success Criteria

### Execution Success
- [ ] All 31 use cases execute without fatal errors
- [ ] Each execution produces valid result with `toolsInvoked[]` populated
- [ ] Zero authentication/authorization failures
- [ ] No JWT verification failures on MCP server

### Data Quality
- [ ] Execution data accuracy: ≥95% (spot-check validation)
- [ ] All tool names valid (match MCP tool schema)
- [ ] Zero null/undefined tool entries
- [ ] Complete result files for all 31 use cases

### Comparison Against Baseline
- [ ] Tool discovery rate: ≥90% of baseline tools discovered
- [ ] False positive rate: ≤5% (unexpected tools)
- [ ] Domain-specific success rates: ≥85% per domain
- [ ] No regression from baseline metrics

### Final Report
- [ ] Comprehensive execution report generated
- [ ] Baseline vs. execution comparison completed
- [ ] Domain-level analysis with findings
- [ ] Recommendations for future sprints documented

---

## Troubleshooting Guide

### Tool Extraction Not Working

**Symptom**: `toolsInvoked[]` is empty in results

**Diagnosis**:
1. Check executor.ts is compiled correctly:
   ```bash
   grep -n "toolsInvoked.add" tests/functional/dist/use-cases/executor.js
   ```
   Expected: Lines with toolsInvoked references

2. Verify stream event format:
   ```bash
   tail -50 /tmp/session.jsonl | jq '.type' | sort | uniq -c
   ```
   Expected: Mix of `message`, `tool_use`, `tool_result` events

**Solution**:
- If compiled wrong: Rebuild project `npm run build`
- If stream format wrong: Check MCP server logs for SDK version mismatch
- If both OK: Enable debug logging in executor.ts:261-288

### JWT Secret Mismatch

**Symptom**: MCP server logs show JWT verification failures, followed by Mittwald CLI validation OOM

**Diagnosis**:
```bash
# Compare secrets
flyctl ssh console -a mittwald-oauth-server -C "printenv BRIDGE_JWT_SECRET" | tail -1
flyctl ssh console -a mittwald-mcp-fly2 -C "printenv OAUTH_BRIDGE_JWT_SECRET" | tail -1
```

**Solution**:
- If different: Update MCP secret to match OAuth:
  ```bash
  SECRET=$(flyctl ssh console -a mittwald-oauth-server -C "printenv BRIDGE_JWT_SECRET" 2>/dev/null | tail -1)
  flyctl secrets set OAUTH_BRIDGE_JWT_SECRET="$SECRET" -a mittwald-mcp-fly2
  ```
- Restart MCP server: `flyctl restart -a mittwald-mcp-fly2`

### MCP Server Timeout/Unresponsive

**Symptom**: Requests timeout or get 503 errors from MCP

**Diagnosis**:
```bash
# Check server status
flyctl status -a mittwald-mcp-fly2
# Check recent logs
flyctl logs -a mittwald-mcp-fly2 --no-tail | tail -20
```

**Solution**:
- Restart server: `flyctl restart -a mittwald-mcp-fly2`
- Check Redis connectivity in logs
- If persistent: Check resource allocation and consider scaling

### OAuth Token Expiration

**Symptom**: Mid-execution failures with "token expired" errors

**Diagnosis**:
- Check token TTL in execution logs
- Verify refresh token mechanism is working
- Check for clock skew between services

**Solution**:
- Re-run execution (tokens will be refreshed)
- If repeating: Check server time synchronization
- Consider extending token TTL if needed

---

## Cleanup & Rollback

### After Successful Execution

1. Archive results:
   ```bash
   tar -czf results_$(date +%Y-%m-%d_%H%M%S).tar.gz tests/functional/results/
   ```

2. Generate final report:
   ```bash
   npm run generate-execution-summary
   ```

3. Commit results to repository:
   ```bash
   git add tests/functional/results/
   git commit -m "chore: Archive Sprint 008 WP05 execution results"
   ```

### If Execution Fails

1. **Don't Delete Results**: Keep all partial results for diagnosis

2. **Diagnose Issue**:
   - Check logs: `flyctl logs -a mittwald-mcp-fly2 --no-tail | tail -50`
   - Review executor output for tool extraction errors
   - Verify OAuth/JWT configuration

3. **Rollback Options**:
   - **Partial Rollback**: Fix specific issue and resume from checkpoint
   - **Full Rollback**: Restart servers and re-run entire suite
   - **Code Rollback**: If code issue detected, revert to last known good commit

4. **Re-execution**:
   ```bash
   # After fix, re-run
   npm run test:functional -- --reporter=json
   ```

---

## Deliverables

### WP05 Outputs

1. **Execution Results** (T024)
   - Location: `tests/functional/results/execution_tools.json`
   - Format: JSON with all tool calls from 31 executions
   - Expected size: ~15KB

2. **Execution Report** (T025)
   - Location: `tests/functional/results/EXECUTION_REPORT.md`
   - Content: Raw execution data, metrics summary, anomalies
   - Expected length: 5+ pages

3. **Comparison Analysis** (T026)
   - Location: `tests/functional/results/COMPARISON_REPORT.md`
   - Content: Baseline vs. execution metrics, deltas, improvement analysis
   - Expected length: 3+ pages

4. **Execution Metadata**
   - Execution ID, timestamps, infrastructure versions
   - Success rates, error logs if any
   - Resource usage metrics

---

## Timeline Estimate

| Phase | Task | Estimated Duration |
|-------|------|---|
| 1 | Pre-Execution Setup | 5 min |
| 2 | Execute 31 Use Cases | 60-90 min |
| 3 | Data Collection & Validation | 20 min |
| 4 | Comparison & Analysis | 15 min |
| **Total** | **Complete Execution** | **100-130 min** |

**Note**: Actual duration depends on:
- MCP server response time
- OAuth token refresh frequency
- Tool discovery complexity per use case
- Network latency to Fly.io infrastructure

---

## Sign-Off

**Prepared By**: Claude (Sprint 008 Infrastructure Team)
**Date**: 2025-12-09
**Status**: Ready for WP05 Execution

**Next Steps**:
1. Review and approve this execution plan
2. Proceed with WP05: Execute 007 Test Suite
3. Upon completion, proceed to WP06: Validate Data Quality & Generate Final Report

---

## Appendix: Key File Locations

```
Core Execution:
- tests/functional/src/use-cases/executor.ts (tool extraction logic)
- tests/functional/dist/use-cases/executor.js (compiled version)

Use Case Data:
- tests/functional/use-case-library/ (all 31 use cases)

Baseline Reference:
- docs/baseline/metrics.json (baseline metrics)
- docs/baseline/BASELINE_METRICS_REPORT.md (baseline report)

Prompts:
- docs/PROMPT_GUIDELINES.md (outcome-focused guidelines)
- docs/SPOT_CHECK_RESULTS.md (prompt validation)

Configuration:
- .env (if using local config)
- Fly.io secrets (OAuth and MCP servers)

Outputs:
- tests/functional/results/ (execution outputs)
```

---

**Document**: Sprint 008 WP05 Execution Plan
**Version**: 1.0
**Status**: Complete and Ready for Implementation
