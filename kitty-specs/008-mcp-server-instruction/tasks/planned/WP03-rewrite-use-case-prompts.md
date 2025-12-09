# WP03: Rewrite All 31 Use Case Prompts to Outcome-Focused

**Work Package ID**: WP03
**Priority**: P1 HIGH
**Complexity**: MEDIUM (32 rewrites, consistency checking)
**Owner**: QA/Product
**Estimated Time**: 4-6 hours
**Depends On**: None (can parallelize with WP1-2)
**Blocks**: WP5 (execution depends on rewritten prompts)

---

## Objective

Convert all 31 use case prompts from prescriptive format (explicitly naming tools) to outcome-focused format (describing desired business outcome). This fixes the test design flaw that invalidates Sprint 007's purpose of measuring LLM tool discovery.

**Current Problem**:
- Prompts explicitly list tool names: "Use the Mittwald MCP tools to first list X, then create Y"
- This prevents testing whether LLMs can discover tools from available tools()
- Test results measure prompt-following, not tool discovery capability

**Expected Outcome**:
- All 31 prompts outcome-focused: "Deploy a Node.js app so I can see it running"
- Zero tool name references (automated scan confirms)
- Prompts retain sufficient context for LLM success
- Ready for valid tool discovery measurement

---

## Context

Current use case example (PRESCRIPTIVE - WRONG):
```
"Deploy a PHP application on Mittwald. Use mcp__mittwald__mittwald_project_list to list projects,
then use mcp__mittwald__mittwald_app_create_php to create the app."
```

Target format (OUTCOME-FOCUSED - CORRECT):
```
"I need to deploy a PHP application on my Mittwald hosting so I can see it live with a working database.
The app should have PHP 8.2 runtime and MySQL 8.0 database. Show me the steps to get it running."
```

---

## Subtasks

### T012: Create Prompt Rewriting Guidelines

**Goal**: Establish consistent standards for outcome-focused prompt rewrites

**Instructions**:

1. **Define outcome-focused style** with examples:
   - **BEFORE (Prescriptive)**: "Use the Mittwald MCP tools to first list my projects using mcp__mittwald__mittwald_project_list, then..."
   - **AFTER (Outcome)**: "I need to review all my Mittwald projects and see which ones have running applications so I can manage them."

2. **Document prohibited terms**:
   - ❌ `mcp__mittwald__*` (any full tool name)
   - ❌ Tool name abbreviations (if they look like tool names)
   - ❌ "Use the tools to", "Call this tool", "Invoke"
   - ❌ "Use the Mittwald MCP tools"

3. **Document required elements**:
   - ✓ Business goal (what needs to be accomplished)
   - ✓ Context (what system, what constraints)
   - ✓ Success indicators (how will you know it worked)
   - ✓ Optional: example questions LLM might ask

4. **Create rewrite template**:
   ```
   Business Goal: [What does the user want to achieve?]
   Context: [What system/constraints apply?]
   Success: [How do we measure success?]

   Prompt: [Outcome-focused description, 2-3 sentences max]
   ```

5. **Example guideline document** (1-2 pages):
   - 3-5 before/after pairs from different domains
   - Explanation of why each rewrite is better
   - Tips for maintaining context while removing tool prescriptions

**Acceptance Criteria**:
- Guidelines document created (1-2 pages)
- At least 5 before/after examples provided
- Rules are clear and unambiguous

---

### T013: Batch 1 - Rewrite Apps & Access Domain Prompts (T013) [PARALLELIZABLE]

**Goal**: Rewrite 8 use cases from apps and access domains

**Use Cases**:
- apps-001: Deploy PHP app
- apps-002: Update Node.js version
- apps-003: Install WordPress
- apps-004: Migrate application
- access-001: Create SFTP user
- access-002: Manage SSH access
- (2 more if needed for 8 total)

**Instructions** (for each use case):
1. Open JSON at `tests/functional/use-case-library/apps/apps-001-deploy-php-app.json`
2. Read current `prompt` field (prescriptive format)
3. Apply guidelines to create outcome-focused version
4. Replace `prompt` value
5. Keep all other fields unchanged (expectedDomains, successCriteria, etc.)
6. Save and commit

**Example Rewrite**:
```json
// BEFORE
"prompt": "I need to deploy a PHP application on my Mittwald hosting. Use the Mittwald MCP tools to
first list my available projects, then create a new PHP app with a MySQL database. Use PHP 8.2."

// AFTER
"prompt": "Deploy a PHP 8.2 web application on my Mittwald hosting with a MySQL database so I can
see it running. I need to be able to access it via the browser and connect to the database from the app."
```

**Acceptance Criteria**:
- 8 prompts rewritten
- All follow guidelines consistently
- No tool names in any prompt
- JSON syntax valid

---

### T014: Batch 2 - Rewrite Databases & Automation Domain Prompts [PARALLELIZABLE]

**Goal**: Rewrite 8 use cases from databases and automation domains

**Use Cases**:
- databases-001: Provision MySQL
- databases-002: Create backup
- databases-003: Setup Redis cache
- databases-004: Manage users
- automation-001: Setup cronjob
- automation-002: Manage scheduled tasks
- (2 more if needed)

**Instructions**: Same as T013 (apply guidelines, rewrite, validate)

**Acceptance Criteria**:
- 8 prompts rewritten following established style
- Consistent with Batch 1
- All validate (no tool names, clear outcomes)

---

### T015: Batch 3 - Rewrite Domains-Mail & Backups Domain Prompts [PARALLELIZABLE]

**Goal**: Rewrite 8 use cases from domains-mail and backups domains

**Use Cases**:
- domains-001: Setup email forwarding
- domains-002: Configure DNS
- domains-003: Setup mailbox
- domains-004: SSL certificate
- backups-001: Setup backup schedule
- backups-002: Create manual backup
- backups-003: Restore from backup
- (1 more if needed)

**Instructions**: Same as T013

**Acceptance Criteria**:
- 8 prompts rewritten
- Style consistent across all batches
- Ready for pattern scan

---

### T016: Batch 4 - Rewrite Remaining Domains Prompts [PARALLELIZABLE]

**Goal**: Complete remaining use cases (containers, identity, organization, project domains)

**Use Cases**:
- containers-001: Manage resources
- containers-002: Scale app
- containers-003: Deploy docker stack
- containers-004: Manage volumes
- identity-001: Manage API tokens
- identity-002: SSH key management
- identity-003: Check account settings
- organization-001: Invite team member
- organization-002: Manage memberships
- project-001: Create project
- project-002: Configure SSH
- project-003: Manage environment
- (Plus any additional if total < 31)

**Instructions**: Same as T013

**Total Progress**: 31 prompts rewritten across all 4 batches

**Acceptance Criteria**:
- All 31 prompts rewritten
- Batches 1-4 stylistically consistent
- All JSON files valid

---

### T017: Automated Tool Name Pattern Scan

**Goal**: Verify no tool names remain in any rewritten prompt

**Instructions**:

1. **Create scan script** that checks all 31 use case JSON files:
   ```bash
   #!/bin/bash

   echo "Scanning for tool name patterns in rewritten prompts..."

   TOOL_PATTERN="mcp__mittwald__"
   PROHIBITED_PHRASES=("use the" "call this tool" "invoke the" "use the tools")

   found=0
   for file in tests/functional/use-case-library/*/*.json; do
     prompt=$(jq -r '.prompt' "$file")

     # Check for tool names
     if echo "$prompt" | grep -i "$TOOL_PATTERN" > /dev/null; then
       echo "❌ $file: Contains tool name reference"
       found=$((found + 1))
     fi

     # Check for prohibited phrases
     for phrase in "${PROHIBITED_PHRASES[@]}"; do
       if echo "$prompt" | grep -i "$phrase" > /dev/null; then
         echo "⚠️  $file: Contains prohibited phrase '$phrase'"
       fi
     done
   done

   if [ $found -eq 0 ]; then
     echo "✓ SC-002 VERIFIED: All 31 prompts passed scan (0 tool references found)"
   else
     echo "❌ Found $found prompts with tool references - FAILED"
   fi
   ```

2. **Run scan** on all 31 use case files:
   ```bash
   bash scan-prompts.sh
   ```

3. **Document results**:
   - Number of files scanned: 31
   - Tool name references found: 0 (goal)
   - Prohibited phrases found: 0 (goal)
   - Status: PASS/FAIL

**Acceptance Criteria**:
- **SC-002 verified**: Scan passes with 0 tool name references
- All 31 prompts clear of prohibited patterns

---

### T018: Domain Expert Spot-Check (10-15% Sample)

**Goal**: Manual review to confirm prompts are truly outcome-focused

**Instructions**:

1. **Select 4-5 random prompts** from different batches:
   - Random selection from 31 to avoid bias
   - Include one from each domain if possible

2. **For each spot-check prompt**, verify:
   - ✓ Clear business goal stated
   - ✓ No tool prescriptions or tool names
   - ✓ LLM can infer correct domain from context
   - ✓ Sufficient context to achieve goal
   - ✓ Success is measurable

3. **Example review** (for apps-001 rewritten):
   ```
   Prompt: "Deploy a PHP 8.2 web application on my Mittwald hosting with a MySQL
   database so I can see it running."

   ✓ Goal: Clear (deploy PHP app with MySQL)
   ✓ Outcome: Clear (see it running)
   ✓ Context: Clear (PHP 8.2, MySQL, Mittwald)
   ✓ No tools named: Correct
   ✓ Testable: Yes

   Status: APPROVED
   ```

4. **Create domain expert review report**:
   - Document each spot-check
   - Note any concerns or feedback
   - Recommend changes if needed
   - Sign off on quality

**Acceptance Criteria**:
- 4-5 spot-checks completed
- All approved or issues documented
- Domain expert confirms non-prescriptive format

---

### T019: Update All 31 Use Case JSON Definition Files

**Goal**: Replace prescriptive prompts with rewritten versions in actual use case files

**Instructions**:

1. **For each of 31 use cases**:
   - Open `tests/functional/use-case-library/{domain}/{use-case-id}.json`
   - Replace `prompt` field with rewritten version (from T013-T016)
   - Verify no other fields changed (expectedDomains, successCriteria, etc.)
   - Validate JSON syntax: `jq . file.json > /dev/null`

2. **Batch update** (to save time):
   - Could write a script to update all 31 at once if rewrites are in a CSV/JSON

3. **Verify all 31 updated**:
   ```bash
   # Count how many have rewritten prompts (should be 31)
   find tests/functional/use-case-library -name "*.json" \
     -exec jq -r '.prompt' {} \; | grep -v "mcp__mittwald__" | wc -l
   # Should output: 31
   ```

4. **Commit changes** with clear message:
   ```
   docs(008): Rewrite all 31 use case prompts to outcome-focused

   - All prompts now describe business outcomes without prescribing tools
   - Updated: tests/functional/use-case-library/*/
   - Verified: 0 tool name references via automated scan
   ```

**Acceptance Criteria**:
- All 31 files updated with outcome-focused prompts
- JSON syntax valid for all 31
- Zero tool name references remaining

---

## Implementation Sketch

**Sequential with Parallelization**:
1. T012: Create guidelines (~30 min) - blocks rest but is fast
2. T013-T016: Rewrite all 31 prompts in parallel batches (~2-3 hours total with team)
   - If solo: ~4 hours
3. T017: Automated scan (~15 min)
4. T018: Domain expert review (~45 min)
5. T019: Update JSON files (~45 min)
- **Total**: 4-6 hours depending on parallelization

**Parallel Opportunities**:
- Batches 1-4 (T013-T016) can be assigned to different team members
- Work on different domains in parallel
- Pattern scan can start once batches complete

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Rewritten prompts too vague | Domain expert review catches, feedback loop |
| Prompts become harder, tests fail | Expected learning curve, documented as expected |
| Inconsistent rewrites across batches | Guidelines + shared templates ensure consistency |
| Automated scan has false positives | Manual review of flagged items |

---

## Definition of Done

- [ ] Guidelines document created with 5+ examples
- [ ] All 31 prompts rewritten to outcome-focused format
- [ ] Automated pattern scan passes (0 tool names found)
- [ ] Domain expert spot-check approves (4-5 samples)
- [ ] All 31 JSON files updated and valid
- [ ] Changes committed with clear message
- [ ] **SC-002 VERIFIED**: All success criteria met

---

## Resources

- **Use Case Definitions**: `tests/functional/use-case-library/*/`
- **Guidelines Template**: `kitty-specs/008-mcp-server-instruction/`
- **Analysis**: `SPRINT-008-BUG-ANALYSIS.md` (context on why this was needed)

---

## Reviewer Guidance

**What to Verify**:
1. ✓ All 31 prompts rewritten (no prescriptive language remains)
2. ✓ Automated scan passes (0 tool name references)
3. ✓ Domain expert approval documented
4. ✓ JSON files valid and updated
5. ✓ Guidelines applied consistently across batches

**Blockers**:
- Automated scan finds any tool name references
- Domain expert rejects spot-checks
- JSON files invalid after update

---

## Next Steps

After WP03 completion:
- WP4: Prepare test infrastructure
- WP5: Re-execute 007 tests with rewritten prompts
- Measure if outcome-focused prompts improve tool discovery measurement

**Prompts Ready for Valid Testing**
