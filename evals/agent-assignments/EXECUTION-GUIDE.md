# Multi-Agent Eval Execution Guide

## 🎯 Goal

Execute all 115 MCP tool evals using 5 specialized agents with balanced workloads to prevent batching/skipping.

## 📊 Agent Distribution

| Agent | Domains | Tools | Phase | Can Parallelize |
|-------|---------|-------|-------|-----------------|
| 1 | identity, organization, context | 22 | Foundation (Tier 0) | No - must run first |
| 2 | project-foundation, misc | 17 | Setup (Tier 1-3) | No - needs Agent 1 |
| 3 | apps, automation, backups | 25 | Execution (Tier 4) | ✅ Yes (with 4, 5) |
| 4 | databases, containers | 24 | Execution (Tier 4) | ✅ Yes (with 3, 5) |
| 5 | domains-mail, access-users, certs | 27 | Execution (Tier 4) | ✅ Yes (with 3, 4) |

**Total**: 115 tools

---

## 🚀 Execution Sequence

### Step 1: Create New Run

```bash
npm run eval:run:create -- \
  --name "baseline-v6" \
  --description "Complete multi-agent baseline run" \
  --tags "baseline,multi-agent,complete" \
  --set-active
```

### Step 2: Execute Phase 1 (Foundation)

**Agent 1 MUST complete before proceeding**

```bash
/spec-kitty.implement evals/agent-assignments/AGENT-1-foundation.md
```

**Expected**: 22/22 tools executed, all results saved to `evals/results/active/`

**Verify before continuing**:
```bash
find evals/results/active/identity -name "*-result.json" | wc -l  # Should be 12
find evals/results/active/organization -name "*-result.json" | wc -l  # Should be 7
find evals/results/active/context -name "*-result.json" | wc -l  # Should be 3
```

### Step 3: Execute Phase 2 (Project Setup)

**Agent 2 MUST complete before Phase 3**

```bash
/spec-kitty.implement evals/agent-assignments/AGENT-2-project-setup.md
```

**Expected**: 17/17 tools executed, project context established

**Verify before continuing**:
```bash
find evals/results/active/project-foundation -name "*-result.json" | wc -l  # Should be 12
find evals/results/active/misc -name "*-result.json" | wc -l  # Should be 5
```

### Step 4: Execute Phase 3 (Parallel - FASTEST!)

**Agents 3, 4, 5 run in parallel**

#### Option A: Sequential (Safe, Slower)
```bash
/spec-kitty.implement evals/agent-assignments/AGENT-3-apps-automation.md
/spec-kitty.implement evals/agent-assignments/AGENT-4-data-containers.md
/spec-kitty.implement evals/agent-assignments/AGENT-5-domains-access.md
```

#### Option B: Parallel (Fast, Recommended)
```bash
# Start all 3 agents in parallel
/spec-kitty.implement evals/agent-assignments/AGENT-3-apps-automation.md &
/spec-kitty.implement evals/agent-assignments/AGENT-4-data-containers.md &
/spec-kitty.implement evals/agent-assignments/AGENT-5-domains-access.md &

# Wait for all to complete
wait
```

**Expected**: 76/76 tools executed (25 + 24 + 27)

**Verify completion**:
```bash
find evals/results/active -name "*-result.json" | wc -l  # Should be 115
```

### Step 5: Generate Report

```bash
npm run eval:report
```

**Expected**: 115/115 tools, success rate ≥ 65%

### Step 6: Compare with v3 (Best Run)

```bash
# Text comparison
npm run eval:run:compare run-20251219-104746 <new-run-id>

# Visual comparison
npm run eval:compare:visual run-20251219-104746 <new-run-id> -- --output html
```

---

## 🔍 Monitoring Progress

### Check Active Run
```bash
npm run eval:run:get-active | jq '{run_id, name, total_evals_executed}'
```

### Count Results Per Domain
```bash
for domain in identity organization context project-foundation misc apps automation backups databases containers domains-mail access-users; do
  count=$(find evals/results/active/$domain -name "*-result.json" 2>/dev/null | wc -l)
  echo "$domain: $count"
done
```

### Expected Final Counts
```
identity: 12
organization: 7
context: 3
project-foundation: 12
misc: 5
apps: 8
automation: 9
backups: 8
databases: 14
containers: 10
domains-mail: 21
access-users: 6
---
Total: 115
```

---

## 🚨 Troubleshooting

### Agent 1 Fails
- **Impact**: Cannot proceed (foundation required)
- **Action**: Debug and re-run Agent 1 only

### Agent 2 Fails
- **Impact**: Agents 3-5 will fail (no project context)
- **Action**: Debug and re-run Agent 2, then proceed to Phase 3

### Agent 3/4/5 Fails
- **Impact**: Other Phase 3 agents can continue
- **Action**: Let others complete, re-run only failed agent

### Incomplete Results
```bash
# Check which domains are missing
npm run eval:report
# Look at "Tools Without Assessment" section
```

### Agent Starts Batching
- **Symptom**: Agent writes scripts or "accelerates through remaining"
- **Action**: STOP immediately, save progress, restart with remaining tools

---

## ✅ Success Criteria

- [ ] Agent 1: 22/22 tools executed
- [ ] Agent 2: 17/17 tools executed
- [ ] Agent 3: 25/25 tools executed
- [ ] Agent 4: 24/24 tools executed
- [ ] Agent 5: 27/27 tools executed
- [ ] **Total: 115/115 tools executed**
- [ ] Success rate ≥ 65%
- [ ] Report generated successfully
- [ ] All results in `evals/results/active/`

---

## 📈 Expected Improvement

**Previous Attempts**:
- v3: 115/115 (100%), 70.4% success ← **Target to match**
- v4: 87/115 (75.7%), 59.8% success ← Incomplete
- v5: 57/115 (49.6%), 61.4% success ← Severely incomplete

**v6 Target** (multi-agent):
- Coverage: **115/115 (100%)** ✅
- Success: **≥ 70%** ✅
- Completion: **All agents finish** ✅

---

## Time Estimate

**Sequential**: ~90-120 minutes
- Agent 1: 20-25 min
- Agent 2: 15-20 min
- Agent 3: 20-25 min
- Agent 4: 20-25 min
- Agent 5: 25-30 min

**Parallel (Phase 3)**: ~60-75 minutes
- Agent 1: 20-25 min (sequential)
- Agent 2: 15-20 min (sequential)
- Agents 3-5: 25-30 min (parallel - same duration!)

**Parallel execution saves ~30-45 minutes!**

---

Ready to start Agent 1?
