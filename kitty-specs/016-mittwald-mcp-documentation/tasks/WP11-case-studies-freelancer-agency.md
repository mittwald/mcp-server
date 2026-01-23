---
work_package_id: WP11
title: Case Studies - Freelancer & Agency Segments
lane: "doing"
dependencies: []
subtasks:
- T024
- T025
- T026
- T027
phase: Phase E - Case Study Tutorials
assignee: ''
agent: "claude"
shell_pid: "33382"
review_status: ''
reviewed_by: ''
history:
- timestamp: '2025-01-23T00:00:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
---

# Work Package Prompt: WP11 – Case Studies - Freelancer & Agency Segments

## ⚠️ IMPORTANT: Review Feedback Status

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_status` field above. If it says `has_feedback`, scroll to the **Review Feedback** section immediately.
- **You must address all feedback** before your work is complete.
- **Mark as acknowledged**: When you understand the feedback, update `review_status: acknowledged` in the frontmatter.

---

## Review Feedback

*[This section is empty initially. Reviewers will populate it if work is returned from review.]*

---

## Markdown Formatting

Wrap HTML/XML tags in backticks: `` `<div>` ``, `` `<script>` ``
Use language identifiers in code blocks: ````python`, ````bash`

---

## Objectives & Success Criteria

**Goal**: Convert 4 case studies (Freelancer and Agency segments) from 015 research format to Divio tutorial format with tool references.

**Success Criteria**:
- ✅ CS-001 (Freelancer Client Onboarding) converted to tutorial format
- ✅ CS-002 (Agency Multi-Project Management) converted to tutorial format
- ✅ CS-006 (Automated Backup Monitoring - Freelancer) converted to tutorial format
- ✅ CS-007 (Developer Onboarding - Agency) converted to tutorial format
- ✅ All tutorials follow Divio Tutorial format (learning-oriented)
- ✅ All tutorials include tool references with links to Site 2
- ✅ All tutorials include step-by-step implementation
- ✅ All tutorials include outcomes with quantified results
- ✅ All tutorials include troubleshooting sections
- ✅ Freelancer segment has 2 complete case studies
- ✅ Agency segment has 2 complete case studies

---

## Context & Constraints

**Prerequisites**: WP10 (auto-generation must be complete - case studies need to link to tool reference pages)

**Related Documents**:
- Spec: `/Users/robert/Code/mittwald-mcp/kitty-specs/016-mittwald-mcp-documentation/spec.md` (User Scenario 4, FR-026 to FR-035)
- Case Study Source Data:
  - `/Users/robert/Code/mittwald-mcp/kitty-specs/015-mittwald-mcp-use-case-research/findings/CS-001-freelancer-client-onboarding.md`
  - `/Users/robert/Code/mittwald-mcp/kitty-specs/015-mittwald-mcp-use-case-research/findings/CS-002-agency-multi-project-management.md`
  - `/Users/robert/Code/mittwald-mcp/kitty-specs/015-mittwald-mcp-use-case-research/findings/CS-006-automated-backup-monitoring.md`
  - `/Users/robert/Code/mittwald-mcp/kitty-specs/015-mittwald-mcp-use-case-research/findings/CS-007-developer-onboarding.md`
- Divio Tutorial Template: `/Users/robert/Code/mittwald-mcp/.kittify/missions/documentation/templates/divio/tutorial-template.md`

**Customer Segments**:
- **Freelancer (SEG-001)**: Independent developers managing multiple client projects
- **Agency (SEG-002)**: Team-based development shops with multiple simultaneous projects

**Why these segments together**: Both focus on multi-client/multi-project workflows with emphasis on efficiency and client management.

**Constraints**:
- Must preserve persona details from 015 research
- Must reference actual MCP tools (and link to reference docs)
- Must include quantified outcomes (time savings, error reduction)
- Must be independently followable (no dependencies between tutorials)

---

## Subtasks & Detailed Guidance

### Subtask T024 – Convert CS-001 (Freelancer Client Onboarding)

**Purpose**: Convert the freelancer client onboarding case study into a Divio tutorial format that teaches developers how to use MCP for client setup automation.

**Source Data**: `/Users/robert/Code/mittwald-mcp/kitty-specs/015-mittwald-mcp-use-case-research/findings/CS-001-freelancer-client-onboarding.md`

**Steps**:

1. **Read the source case study**:

   ```bash
   cat kitty-specs/015-mittwald-mcp-use-case-research/findings/CS-001-freelancer-client-onboarding.md
   ```

   Extract:
   - Persona details (name, role, pain points)
   - Problem statement (what challenge they face)
   - Solution overview (how MCP helps)
   - Tools used (specific MCP tools)
   - Outcomes (time savings, benefits)

2. **Create tutorial file**:

   File: `docs/setup-and-guides/src/content/docs/case-studies/CS-001-freelancer-client-onboarding.md`

   **Tutorial structure** (Divio Tutorial format):

   ```markdown
   ---
   title: "Case Study: Freelancer Client Onboarding"
   description: How a freelance developer uses Mittwald MCP to automate new client setup
   sidebar:
     badge:
       text: Freelancer
       variant: tip
     order: 1
   ---

   # Case Study: Freelancer Client Onboarding

   > **Segment**: Freelance Web Developer
   > **Time to Complete**: ~30 minutes
   > **Tools Used**: 10 MCP tools across 4 domains

   ## Who This Is For

   **Persona**: Sarah, Freelance WordPress Developer

   **Background**:
   - Manages 15-20 active client websites
   - Onboards 2-3 new clients per month
   - Uses Mittwald for hosting all client sites
   - Works solo - no team to delegate to

   **Pain Point**: Client onboarding is repetitive and time-consuming
   - Manual setup takes 45-60 minutes per client
   - Prone to configuration errors (forgotten backups, wrong PHP version)
   - Context switching between terminal, MStudio, and documentation
   - Delays project start (client waits for infrastructure)

   ## The Problem

   Every new client requires the same setup workflow:
   1. Create project in Mittwald
   2. Configure server (PHP version, resources)
   3. Set up SSH access
   4. Create MySQL database
   5. Configure domain and DNS
   6. Install WordPress
   7. Set up daily backups
   8. Configure email for the domain
   9. Test everything works
   10. Document credentials for client

   **Time**: 45-60 minutes per client (manual process)
   **Error rate**: ~20% (forgotten backup, wrong PHP version, etc.)
   **Frustration**: High - Sarah wants to focus on development, not infrastructure

   ## The Solution with Mittwald MCP

   Sarah now uses Claude Code with Mittwald MCP to automate client onboarding with a single natural language request.

   **Sarah's workflow**:

   ```
   Sarah: "Set up a new WordPress site for client 'Acme Corp' with domain acme-corp.com,
          MySQL database, daily backups, and email configured"

   Claude (via MCP):
   • Creating project 'Acme Corp'... ✓
   • Installing WordPress (latest version)... ✓
   • Creating MySQL database 'acme_wp'... ✓
   • Registering domain acme-corp.com... ✓
   • Configuring DNS records... ✓
   • Setting up daily backups (2 AM)... ✓
   • Creating email address admin@acme-corp.com... ✓

   Done! WordPress is live at https://acme-corp.com
   Database: acme_wp (credentials sent to your email)
   SSH access: ssh sarah@acme-corp-server.mittwald.io
   ```

   **Time**: 3-5 minutes (automated via MCP)
   **Error rate**: <1% (automated tasks don't forget steps)
   **Sarah's reaction**: "This is magic. I can onboard 5 clients in the time it used to take for one."

   ## Step-by-Step: How Sarah Uses MCP

   ### Prerequisites

   Before following this tutorial:
   - ✅ Sarah has OAuth set up for Claude Code ([Getting Started Guide](/getting-started/claude-code/))
   - ✅ She has a Mittwald account with appropriate permissions
   - ✅ She has the client's domain information ready

   ### Step 1: Create the Project

   **Sarah's command** (natural language):
   ```
   "Create a new project called 'Acme Corp' in my organization"
   ```

   **Behind the scenes** (MCP tools):
   - Claude calls [`project/create`](/tools/project-foundation/project-create/)
   - Parameters: name="Acme Corp", organizationId=[Sarah's org]

   **Result**:
   ```
   ✓ Project created: Acme Corp (ID: proj-abc123)
   ```

   ### Step 2: Install WordPress

   **Sarah's command**:
   ```
   "Install WordPress latest version in project Acme Corp"
   ```

   **MCP tools used**:
   - [`app/install`](/tools/apps/app-install/)
   - Parameters: projectId="proj-abc123", appType="wordpress", version="latest"

   **Result**:
   ```
   ✓ WordPress installed successfully
     URL: https://proj-abc123.mittwald.space (temporary)
     Admin: /wp-admin
   ```

   ### Step 3: Create MySQL Database

   **Sarah's command**:
   ```
   "Create a MySQL database called 'acme_wp' with 1GB storage for this project"
   ```

   **MCP tools used**:
   - [`database/create`](/tools/databases/database-create/)
   - Parameters: projectId="proj-abc123", name="acme_wp", type="mysql", storage="1GB"

   **Result**:
   ```
   ✓ Database created: acme_wp
     Connection: acme_wp.db.mittwald.io:3306
     Credentials sent to sarah@example.com
   ```

   ### Step 4: Register and Configure Domain

   **Sarah's command**:
   ```
   "Add domain acme-corp.com to this project and point it to WordPress"
   ```

   **MCP tools used**:
   - [`domain/add`](/tools/domains-mail/domain-add/)
   - [`virtualhost/create`](/tools/domains-mail/virtualhost-create/)
   - Parameters: projectId, domain="acme-corp.com", targetApp=[WordPress ID]

   **Result**:
   ```
   ✓ Domain registered: acme-corp.com
   ✓ DNS configured (propagation may take 5-15 minutes)
   ✓ Virtual host created: acme-corp.com → WordPress
   ```

   ### Step 5: Configure Daily Backups

   **Sarah's command**:
   ```
   "Set up daily backups at 2 AM for this project, keep 7 days"
   ```

   **MCP tools used**:
   - [`backup/schedule-create`](/tools/backups/backup-schedule-create/)
   - Parameters: projectId, frequency="daily", time="02:00", retention="7 days"

   **Result**:
   ```
   ✓ Backup schedule created: Daily at 2 AM (UTC)
     Retention: 7 days
   ```

   ### Step 6: Set Up Email

   **Sarah's command**:
   ```
   "Create email address admin@acme-corp.com with 5GB mailbox"
   ```

   **MCP tools used**:
   - [`email/address-create`](/tools/domains-mail/email-address-create/)
   - Parameters: domain="acme-corp.com", localPart="admin", quotaGB=5

   **Result**:
   ```
   ✓ Email created: admin@acme-corp.com
     Mailbox: 5GB quota
     Access: IMAP/SMTP configured
   ```

   ### Step 7: Test and Verify

   **Sarah's command**:
   ```
   "Show me the status of everything we just set up"
   ```

   **MCP tools used**:
   - [`project/get`](/tools/project-foundation/project-get/)
   - [`app/list`](/tools/apps/app-list/)
   - [`database/list`](/tools/databases/database-list/)
   - [`domain/list`](/tools/domains-mail/domain-list/)
   - [`backup/schedule-list`](/tools/backups/backup-schedule-list/)

   **Result** (consolidated summary):
   ```
   Project: Acme Corp ✓
   WordPress: acme-corp.com (live) ✓
   Database: acme_wp (connected) ✓
   Backups: Daily at 2 AM ✓
   Email: admin@acme-corp.com ✓

   Everything is ready for client handoff!
   ```

   **Total time**: 3-5 minutes
   **Manual equivalent**: 45-60 minutes

   ## Outcomes Achieved

   ### Time Savings
   - **Before MCP**: 45-60 minutes per client (manual setup)
   - **After MCP**: 3-5 minutes (automated via Claude Code)
   - **Savings**: ~90% time reduction

   ### Error Reduction
   - **Before MCP**: 20% error rate (forgotten backups, misconfigurations)
   - **After MCP**: <1% error rate (automated tasks are consistent)
   - **Improvement**: 95% fewer errors

   ### Business Impact
   - **More clients**: Sarah can onboard 5 clients in the time it used to take for 1
   - **Faster delivery**: Clients receive infrastructure within hours, not days
   - **Less stress**: No context switching; stays in development flow
   - **Better quality**: Automated setup means no forgotten steps

   ### Sarah's Feedback

   > "MCP changed my business. I used to dread onboarding - now it's the easiest part. I can take on more clients because setup isn't a bottleneck anymore."

   ## Troubleshooting

   ### Issue: Domain DNS not propagating

   **Symptoms**: Domain registered but site not accessible

   **Cause**: DNS propagation takes 5-15 minutes (sometimes longer)

   **Solution**:
   - Wait 15-30 minutes
   - Check DNS: `dig acme-corp.com` or `nslookup acme-corp.com`
   - Verify DNS records via [`domain/get`](/tools/domains-mail/domain-get/)

   ### Issue: WordPress installation fails

   **Symptoms**: `app/install` returns error

   **Possible causes**:
   - Insufficient project resources
   - PHP version incompatibility

   **Solution**:
   - Check project status: `project/get`
   - Verify resources (disk space, memory)
   - Ensure compatible PHP version for WordPress

   ### Issue: Database connection fails

   **Symptoms**: WordPress can't connect to database

   **Cause**: Database credentials not configured in WordPress

   **Solution**:
   - Get database credentials: `database/get`
   - Update wp-config.php with correct credentials (manual or via SSH)

   ## What You Learned

   In this tutorial, you learned how to:
   - ✅ Automate complete client onboarding with MCP
   - ✅ Chain multiple MCP tools together for complex workflows
   - ✅ Use natural language to orchestrate infrastructure tasks
   - ✅ Reduce setup time by 90% while improving quality

   ## Next Steps

   **Try it yourself**:
   - [Set up OAuth for Claude Code](/getting-started/claude-code/)
   - Use this workflow for your next client

   **Explore more**:
   - [Agency Multi-Project Management](/case-studies/CS-002/) - Team collaboration with MCP
   - [Tool Reference](/reference/tools/) - Explore all 115 tools

   ---

   **MCP Tools Used in This Tutorial** (10 tools):
   1. [`project/create`](/tools/project-foundation/project-create/)
   2. [`app/install`](/tools/apps/app-install/)
   3. [`database/create`](/tools/databases/database-create/)
   4. [`domain/add`](/tools/domains-mail/domain-add/)
   5. [`virtualhost/create`](/tools/domains-mail/virtualhost-create/)
   6. [`backup/schedule-create`](/tools/backups/backup-schedule-create/)
   7. [`email/address-create`](/tools/domains-mail/email-address-create/)
   8. [`project/get`](/tools/project-foundation/project-get/)
   9. [`app/list`](/tools/apps/app-list/)
   10. [`database/list`](/tools/databases/database-list/)
   ```

   **Tutorial requirements**:
   - Persona with realistic background
   - Quantified problem (45-60 minutes, 20% error rate)
   - Step-by-step solution with actual MCP tool calls
   - Links to every MCP tool referenced
   - Outcomes with before/after metrics
   - Troubleshooting for common issues
   - "What you learned" summary
   - Estimated completion time (30 minutes)

3. **Test the tutorial**:

   ```bash
   cd docs/setup-and-guides
   npm run dev
   ```

   - Visit http://localhost:4321/case-studies/CS-001/
   - ✅ Persona section clear
   - ✅ Problem quantified
   - ✅ Steps are followable
   - ✅ Tool links work (link to Site 2)
   - ✅ Outcomes are realistic
   - ✅ Troubleshooting helpful

**Duration**: 4-6 hours (comprehensive tutorial with research reference and link integration)

**Files Created**:
- `docs/setup-and-guides/src/content/docs/case-studies/CS-001-freelancer-client-onboarding.md` (new)

**Parallel?**: Yes - can be done in parallel with T025, T026, T027 (other case studies)

---

### Subtask T025 – Convert CS-002 (Agency Multi-Project Management)

**Purpose**: Convert the agency multi-project management case study to tutorial format.

**Source**: `/Users/robert/Code/mittwald-mcp/kitty-specs/015-mittwald-mcp-use-case-research/findings/CS-002-agency-multi-project-management.md`

**Follow same structure as T024**:
- Read source case study
- Extract persona (agency team lead or project manager)
- Extract problem (managing multiple projects, team coordination)
- Convert to tutorial format with steps
- Add tool references (link to Site 2)
- Include outcomes and troubleshooting

**Key tools for agency case** (based on 015 research):
- [`project/list`](/tools/project-foundation/project-list/) - Overview all projects
- [`organization/member-list`](/tools/organization/organization-member-list/) - Team management
- [`backup/list`](/tools/backups/backup-list/) - Backup monitoring across projects
- Others as identified in source

**Duration**: 4-6 hours

**Files Created**:
- `docs/setup-and-guides/src/content/docs/case-studies/CS-002-agency-multi-project-management.md` (new)

---

### Subtask T026 – Convert CS-006 (Automated Backup Monitoring - Freelancer)

**Purpose**: Convert the freelancer backup monitoring case study to tutorial format.

**Source**: `/Users/robert/Code/mittwald-mcp/kitty-specs/015-mittwald-mcp-use-case-research/findings/CS-006-automated-backup-monitoring.md`

**Follow same structure as T024**:
- Persona: Freelance developer (same segment as CS-001)
- Problem: Manually checking backups across all client sites
- Solution: Automated backup health monitoring via MCP
- Steps with tool references
- Outcomes

**Key tools** (backup domain focus):
- [`backup/list`](/tools/backups/backup-list/)
- [`backup/get`](/tools/backups/backup-get/)
- [`backup/schedule-list`](/tools/backups/backup-schedule-list/)
- [`project/list`](/tools/project-foundation/project-list/)

**Duration**: 4-6 hours

**Files Created**:
- `docs/setup-and-guides/src/content/docs/case-studies/CS-006-automated-backup-monitoring.md` (new)

---

### Subtask T027 – Convert CS-007 (Developer Onboarding - Agency)

**Purpose**: Convert the agency developer onboarding case study to tutorial format.

**Source**: `/Users/robert/Code/mittwald-mcp/kitty-specs/015-mittwald-mcp-use-case-research/findings/CS-007-developer-onboarding.md`

**Follow same structure as T024**:
- Persona: Agency team lead
- Problem: Onboarding new developers to team projects (access management)
- Solution: Automate SSH access, API tokens, project permissions via MCP
- Steps with tool references

**Key tools** (identity domain focus):
- [`ssh-user/create`](/tools/ssh/ssh-user-create/)
- [`api-token/create`](/tools/identity/api-token-create/)
- [`project/member-add`](/tools/project-foundation/project-member-add/)
- [`organization/member-invite`](/tools/organization/organization-member-invite/)

**Duration**: 4-6 hours

**Files Created**:
- `docs/setup-and-guides/src/content/docs/case-studies/CS-007-developer-onboarding.md` (new)

---

## Test Strategy

**Content Validation**:

1. **Persona authenticity**:
   - Does persona match the segment (Freelancer or Agency)?
   - Are pain points realistic and relatable?
   - Is background credible?

2. **Problem quantification**:
   - Are time estimates realistic (cross-reference with 015 research)?
   - Are error rates realistic?
   - Is frustration/impact clear?

3. **Solution accuracy**:
   - Do MCP tools referenced actually exist?
   - Do tool links point to correct reference pages?
   - Are tool parameters realistic?
   - Is the workflow feasible?

4. **Tutorial format compliance**:
   - Follows Divio Tutorial structure
   - Learning-oriented (teaches by doing)
   - Steps are concrete and actionable
   - Outcomes are quantified

**Link Validation**:

```bash
# Check all MCP tool links in case studies
cd docs/setup-and-guides
grep -r "](/tools/" src/content/docs/case-studies/ | wc -l
# Should be many (each tutorial references 5-10 tools)

# Verify links point to existing pages
# (Full link validation happens in WP13)
```

**Build Testing**:

```bash
cd docs/setup-and-guides
npm run build

# Check case studies present in output
ls dist/case-studies/
# Expected: CS-001, CS-002, CS-006, CS-007 directories
```

**Manual Testing**:

1. **Read each tutorial**:
   - Can you follow the steps?
   - Are instructions clear?
   - Do outcomes seem realistic?

2. **Check segment coverage**:
   - Freelancer: CS-001, CS-006 (2 tutorials) ✓
   - Agency: CS-002, CS-007 (2 tutorials) ✓

---

## Risks & Mitigations

**Risk 1: Source case studies may lack detail**
- **Cause**: 015 research may be high-level overviews
- **Mitigation**: Enhance with realistic details during conversion
- **Validation**: Cross-reference with actual MCP tools to ensure feasibility

**Risk 2: Tool references may be broken**
- **Cause**: Tool reference pages may not exist yet (if WP10 not complete)
- **Mitigation**: Ensure WP10 dependency is met before starting
- **Testing**: Click every tool link during manual review

**Risk 3: Outcomes may not be realistic**
- **Cause**: 90% time savings sounds too good to be true
- **Mitigation**: Base on 015 research findings; provide ranges rather than exact numbers
- **Credibility**: Include caveats ("results may vary based on project complexity")

**Risk 4: Tutorials may be too long**
- **Cause**: Trying to cover too much detail
- **Mitigation**: Focus on main workflow; mention advanced options briefly
- **Target**: Tutorials should be readable in 10-15 minutes

---

## Review Guidance

**Key Acceptance Criteria**:

1. **All 4 tutorials complete**:
   - CS-001 (Freelancer Client Onboarding)
   - CS-002 (Agency Multi-Project Management)
   - CS-006 (Backup Monitoring - Freelancer)
   - CS-007 (Developer Onboarding - Agency)

2. **Tutorials follow Divio Tutorial format**:
   - Learning-oriented
   - Persona + problem + solution + steps + outcomes
   - Include "What you learned" summary
   - Include "Next steps" links

3. **Tool references are complete**:
   - Every MCP tool mentioned is linked
   - Links point to correct reference pages (Site 2)
   - Tool usage is realistic (parameters make sense)

4. **Segment coverage correct**:
   - Freelancer segment: 2 tutorials (CS-001, CS-006)
   - Agency segment: 2 tutorials (CS-002, CS-007)

5. **Outcomes are quantified**:
   - Time savings (before/after)
   - Error reduction
   - Business impact
   - Based on 015 research findings

**Verification Commands**:

```bash
# Check files exist
ls docs/setup-and-guides/src/content/docs/case-studies/
# Expected: CS-001, CS-002, CS-006, CS-007 markdown files

# Count tool references
grep -r "](/tools/" docs/setup-and-guides/src/content/docs/case-studies/ | wc -l
# Should be 20-40 (multiple tools per tutorial)

# Build and preview
cd docs/setup-and-guides
npm run build
npm run dev
# Navigate to each case study
```

**Review Checklist**:
- [ ] CS-001 complete (Freelancer Client Onboarding)
- [ ] CS-002 complete (Agency Multi-Project)
- [ ] CS-006 complete (Backup Monitoring)
- [ ] CS-007 complete (Developer Onboarding)
- [ ] All follow Divio Tutorial format
- [ ] All include realistic personas
- [ ] All include quantified problems
- [ ] All include step-by-step solutions
- [ ] All include MCP tool references (linked)
- [ ] All include quantified outcomes
- [ ] All include troubleshooting sections
- [ ] Freelancer segment has 2 tutorials
- [ ] Agency segment has 2 tutorials
- [ ] All tutorials build successfully
- [ ] All tool links work

---

## Implementation Command

To implement this work package:

```bash
spec-kitty implement WP11 --base WP10
```

*(Depends on WP10; tool reference pages must exist for linking)*

---

## Activity Log

> Entries MUST be in chronological order (oldest first, newest last).

*[Activity log will be populated during implementation and review]*
- 2026-01-23T11:10:44Z – claude – shell_pid=33382 – lane=doing – Started implementation via workflow command
