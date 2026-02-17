# Known Limitations - MCP Tool Scenarios

## SFTP Tools Unavailable (All 4 Tools De-registered)

### Status

All 4 SFTP tools have been de-registered from the MCP server and are NOT available in the current tool inventory (115 tools).

### Affected Tools

- `mcp__mittwald__mittwald_sftp_user_create` (sftp/user/create)
- `mcp__mittwald__mittwald_sftp_user_update` (sftp/user/update)
- `mcp__mittwald__mittwald_sftp_user_delete` (sftp/user/delete)
- `mcp__mittwald__mittwald_sftp_user_list` (sftp/user/list)

### Root Cause

The library functions extracted from `@mittwald/cli` don't have full parameter support for SFTP operations. The CLI-to-library conversion (Feature 012) successfully converted most tools, but SFTP tools require additional work to support all required parameters.

### Impact on Case Study Scenarios

**Developer Onboarding** - Modified to remove SFTP setup

**Original workflow** (from case study):
1. Invite developer to organization
2. Create SSH access
3. **Create SFTP user** ❌ (Step removed)
4. Verify project memberships

**Modified workflow** (scenario implementation):
1. Invite developer to organization
2. Create SSH access
3. ~~Create SFTP user~~ (Removed)
4. Verify project memberships

**File**: `evals/scenarios/case-studies/developer-onboarding-modified.json`

**Changes**:
- Scenario ID: `developer-onboarding` → `developer-onboarding-modified`
- Description updated to mention limitation
- Step 3 (SFTP) removed from prompts
- SFTP reference removed from verification step
- Tag added: `sftp-tools-unavailable`

### Other Case Studies

**Verified**: No other case studies reference SFTP tools
```bash
grep -r "sftp" docs/setup-and-guides/src/content/docs/case-studies/
# Only match: developer-onboarding.md (5 references)
```

### Timeline

- **Feature 012** (CLI-to-Library): SFTP tools de-registered due to incomplete parameter support
- **Feature 013** (Tool Inventory): 115 tools confirmed, SFTP not included
- **Feature 018** (Scenario Generation): Developer Onboarding modified to remove SFTP

### Future Work

When SFTP library functions gain full parameter support:

1. Re-register all 4 SFTP tools in MCP server
2. Update tool inventory: 115 → 119 tools
3. Create `developer-onboarding-full.json` with complete workflow
4. Archive `developer-onboarding-modified.json` or keep as SSH-only variant

### Developer Notes

**When creating new scenarios**:
- Check tool inventory first: `evals/inventory/tools-current.json`
- Validate tools exist: `npm run scenarios:validate-all`
- If tools are missing, either:
  - Modify scenario to remove those tools (like Developer Onboarding)
  - Wait for library support and tool re-registration

**Tool validation**:
```typescript
// Scenario definition (schema format)
"expected_tools": ["mittwald_sftp_user_create"]

// Tool inventory (actual MCP names)
{ "mcpName": "mcp__mittwald__mittwald_sftp_user_create" }

// Validation script maps: mittwald_* → mcp__mittwald__mittwald_*
```

## Other Known Limitations

None at this time. All 115 tools in the current inventory are available and functional.
