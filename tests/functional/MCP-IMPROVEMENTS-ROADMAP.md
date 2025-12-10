# MCP Improvements Roadmap
# Prioritized Enhancement Plan for Mittwald MCP Server

**Based on:** Sprint 008 Analysis (31 use case executions)
**Created:** 2025-12-10
**Horizon:** Sprints 009-012 (Q1 2026)

---

## Priority 1: Enhanced Tool Descriptions

**Problem:** 29% of tests used wrong tools (Bash/Read instead of MCP tools)

**Evidence from Sprint 008:**
- `identity-001-manage-api-tokens` - tried reading .config files instead of calling `api_token_list`
- `identity-002-ssh-key-management` - attempted Bash operations vs `user_ssh_key_list`
- 9 tests total failed due to wrong tool selection

**Solution:** Enhance all 170 tool descriptions with:
1. **Use case examples** - "Use this tool when you need to list all projects for a user"
2. **Parameter guidance** - "projectId can be obtained from project_list tool"
3. **Common scenarios** - "Typical workflow: list projects → get details → create resource"
4. **Anti-patterns** - "Don't use Bash 'mw' CLI - use this MCP tool instead"

**Implementation Approach:**
```typescript
// Example enhanced description
{
  name: "mcp__mittwald__mittwald_api_token_create",
  description: "Create a new API token for Mittwald authentication. " +
               "Use this when: user needs programmatic API access, " +
               "automation requires authentication, or integrating external tools. " +
               "Typical workflow: 1) Confirm user context, 2) Call this tool with description and roles, " +
               "3) Securely store returned token. " +
               "Don't use: Bash/mw CLI - this MCP tool handles it properly.",
  inputSchema: {
    // ... existing schema ...
    "x-examples": [{
      description: "Generate read-only token",
      roles: ["api_read"]
    }]
  }
}
```

**Effort:** Medium (2-3 weeks)
- Review all 170 tools
- Write enhanced descriptions following template
- Add 2-3 examples per tool
- Test with sample prompts

**Impact:** HIGH
- Estimated improvement: 29% → 10% wrong tool usage (19pp reduction)
- Better tool selection = faster task completion
- Reduces retry loops and exploration time

**Sprint:** 009 (targeting all 170 tools)

---

## Priority 2: MCP Resources for Context Discovery

**Problem:** 33% of tool calls are context discovery (`project_list`, `user_accessible_projects`)

**Evidence from Sprint 008:**
- `project_list` called 12 times (most-used tool)
- `user_accessible_projects` called 6 times
- Every successful test started with context discovery
- Pattern: "What do I have?" before "How do I do this?"

**Solution:** Implement MCP Resources to provide upfront context

**Resource Specifications:**

### Resource 1: Projects List
```typescript
{
  uri: "mittwald://projects",
  name: "Available Projects",
  description: "All Mittwald projects accessible to the authenticated user",
  mimeType: "application/json"
}
```
**Content:**
```json
{
  "projects": [
    {"id": "p-ptwfms", "description": "mStudio MCP server", "readiness": "ready"},
    {"id": "p-ucvxdj", "description": "PHP App Project", "readiness": "ready"}
  ],
  "defaultProject": "p-ptwfms"
}
```

### Resource 2: Session Context
```typescript
{
  uri: "mittwald://context/session",
  name: "Current Session Context",
  description: "Active project, server, and user context for this session"
}
```

### Resource 3: Capabilities Map
```typescript
{
  uri: "mittwald://capabilities",
  name: "Available Capabilities by Project",
  description: "What operations are available for each project (apps, databases, domains, etc.)"
}
```

**Implementation Approach:**
1. Add `listResources()` handler to MCP server
2. Implement 3 core resources (projects, context, capabilities)
3. Cache resource data per session (1-hour TTL)
4. Update when context changes (project switch, etc.)

**Effort:** Large (3-4 weeks)
- Design resource schemas
- Implement caching layer
- Add Resource refresh triggers
- Test with all 31 use cases

**Impact:** HIGH
- Estimated reduction: 33% → 10% context discovery calls (23pp improvement)
- Faster task initiation (skip discovery phase)
- Clearer LLM understanding of available resources

**Sprint:** 010 (after tool descriptions)

---

## Priority 3: MCP Prompts for Tool Selection Guidance

**Problem:** LLMs don't know WHEN to prefer MCP tools over built-in Bash/Read

**Evidence from Sprint 008:**
- Tests with MCP tools available still used Bash for tasks
- identity domain: 0% MCP tool usage despite tools being available
- Suggests: LLMs need guidance on tool prioritization

**Solution:** Implement MCP Prompts at two levels

### System-Level Prompt
```typescript
{
  prompt: "When working with Mittwald hosting infrastructure, ALWAYS prefer " +
          "`mcp__mittwald__*` tools over Bash commands or the `mw` CLI. " +
          "MCP tools provide structured, validated access to the Mittwald API " +
          "with better error handling and authentication management."
}
```

### Per-Tool Prompts
```typescript
{
  name: "mcp__mittwald__mittwald_project_list",
  prompt: "Use this tool FIRST when you need to discover what Mittwald projects " +
          "are available. Don't try 'mw project list' via Bash - this MCP tool " +
          "handles authentication and formatting automatically."
}
```

**Implementation Approach:**
1. Add `getPrompt()` handler to MCP server
2. Define system prompt for Mittwald context
3. Add situational prompts for top 20 most-used tools
4. Test prompt effectiveness with A/B comparison

**Effort:** Small (1-2 weeks)
- Write system prompt
- Create 20 per-tool prompts
- Add to MCP server responses
- Validate with test subset

**Impact:** MEDIUM
- Estimated improvement: Wrong tool usage 29% → 15% (14pp reduction)
- Complements enhanced descriptions (P1)
- Low effort, moderate impact

**Sprint:** 011 (after Resources)

---

## Priority 4: MCP Completion for Intelligent Suggestions

**Problem:** LLMs make parameter errors or miss optional parameters

**Evidence from Sprint 008:**
- `sftp_user_create` - forgot password parameter, had to retry
- `database_mysql_create` - missing character set, used defaults
- Tool retry patterns often due to incomplete parameters

**Solution:** Implement MCP Completion for parameter assistance

**Completion Specifications:**

### For Enums (e.g., database version)
```typescript
{
  ref: "mcp://mittwald/database/mysql/versions",
  values: ["5.7.44", "8.0.35", "8.4.0"],
  descriptions: {
    "8.4.0": "Latest stable (recommended)",
    "8.0.35": "LTS version",
    "5.7.44": "Legacy support only"
  }
}
```

### For Dynamic Values (e.g., project IDs)
```typescript
{
  ref: "mcp://mittwald/projects",
  values: async () => await getProjectList(),
  context: "Current user's accessible projects"
}
```

**Implementation Approach:**
1. Add `completion/complete` handler
2. Define completion refs for common parameters
3. Implement dynamic value fetchers
4. Cache completion data per session

**Effort:** Medium (2-3 weeks)
- Design completion protocol
- Implement for top 30 tools
- Add caching layer
- Test with parameter-heavy tools

**Impact:** MEDIUM
- Estimated improvement: Reduce parameter-related retries by 40%
- Faster completion with better parameter choices
- Enables more complex multi-parameter tools

**Sprint:** 012 (after Prompts)

---

## Critical Path: OAuth Scope Expansion

**Problem:** 58% of failures due to 403 permission errors despite correct tool usage

**Evidence:** 18 tests called correct MCP tools but hit API errors

**Solution:** Expand OAuth bridge default scopes

**Current Scopes:**
```typescript
const DEFAULT_SCOPES = "user:read customer:read project:read app:read";
```

**Recommended Scopes:**
```typescript
const DEFAULT_SCOPES =
  "user:read user:write " +           // User management
  "customer:read " +                   // Organization access
  "project:read project:write " +      // Project operations
  "app:read app:write " +              // App deployment
  "database:read database:write " +    // Database management
  "domain:read domain:write " +        // Domain configuration
  "cronjob:read cronjob:write " +      // Automation
  "backup:read backup:write " +        // Backup operations
  "container:read container:write " +  // Container management
  "ssh-user:read ssh-user:write " +    // SSH access
  "sftp-user:read sftp-user:write";    // SFTP access
```

**Implementation:**
- Update `packages/oauth-bridge/src/config/mittwald-scopes.ts`
- Test with all 31 use cases
- Verify no security regressions

**Effort:** Small (1-2 days)

**Impact:** CRITICAL
- Could improve pass rate from 19.4% to 45-50%
- Unblocks 18 tests currently failing on permissions
- **Should be done BEFORE Sprint 009**

---

## Implementation Timeline

### Immediate (Before Sprint 009)
- [ ] **OAuth Scope Expansion** (1-2 days) - Unblocks testing

### Sprint 009 (Weeks 1-3)
- [ ] **P1: Enhanced Tool Descriptions** (2-3 weeks)
  - Week 1: Template design, tool audit
  - Week 2: Write descriptions for all 170 tools
  - Week 3: Testing and refinement

### Sprint 010 (Weeks 4-7)
- [ ] **P2: MCP Resources** (3-4 weeks)
  - Week 4: Design resource schemas
  - Week 5: Implement core resources (projects, context, capabilities)
  - Week 6: Caching and refresh logic
  - Week 7: Integration testing

### Sprint 011 (Weeks 8-9)
- [ ] **P3: MCP Prompts** (1-2 weeks)
  - Week 8: Write system and per-tool prompts
  - Week 9: A/B testing and refinement

### Sprint 012 (Weeks 10-12)
- [ ] **P4: MCP Completion** (2-3 weeks)
  - Week 10: Protocol design
  - Week 11: Implement for top 30 tools
  - Week 12: Testing and caching

---

## Success Metrics

**Sprint 009 Targets (After P1: Tool Descriptions):**
- Tool capture rate: 64.5% → 80%+ (wrong tool usage reduced)
- Pass rate: 19.4% → 30%+ (with OAuth scopes expanded)
- Wrong tool usage: 29% → 10%

**Sprint 010 Targets (After P2: MCP Resources):**
- Context discovery calls: 33% → 15% of total
- Average tools per test: 2.1 → 1.5 (more efficient)
- Time to first productive tool call: Reduce by 30%

**Sprint 011 Targets (After P3: MCP Prompts):**
- MCP tool preference: 71% → 90% (when applicable)
- Discovery retry pattern: 51.6% → 35% (less trial-and-error)

**Sprint 012 Targets (After P4: MCP Completion):**
- Parameter-related retries: Reduce by 40%
- Complex tool usage: Improve success rate 15pp

**Overall Sprint 012 Goal:**
- **Pass rate: 60-70%** (from 19.4% baseline)
- **Tool capture: 85%+** (from 64.5% baseline)
- **Efficient patterns: 25%+** (from 6.4% baseline)

---

## Appendix: Priority Matrix

| Initiative | Effort | Impact | Dependencies | Sprint |
|------------|--------|--------|--------------|--------|
| OAuth Scopes | S | CRITICAL | None | Immediate |
| Tool Descriptions | M | HIGH | None | 009 |
| MCP Resources | L | HIGH | Tool Descriptions | 010 |
| MCP Prompts | S | MEDIUM | Resources | 011 |
| MCP Completion | M | MEDIUM | Prompts | 012 |

**Legend:**
- Effort: S=1-2w, M=2-3w, L=3-4w
- Impact: CRITICAL=blocking, HIGH=2x improvement, MEDIUM=1.5x improvement

---

**Roadmap Status:** Ready for stakeholder review and sprint planning
**Next Action:** Present to team, prioritize based on business goals
**Owner:** MCP Platform Team
