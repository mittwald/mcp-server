# Instructions for Agents: Saving Eval Results

## ⚠️ CRITICAL: Save to Active Run Directory

When executing evals from WP files, **DO NOT** save to the flat structure. Save to the **active run directory**.

## The Right Way to Save

### Option 1: Use the Active Run Symlink (Simplest)

Save directly to `evals/results/active/{domain}/{tool-name}-result.json`

The `active` symlink always points to the current run directory.

**Example:**
```bash
# Save app-list result
cat > evals/results/active/apps/app-list-result.json <<'EOF'
{
  "success": true,
  "tool_executed": "mcp__mittwald__mittwald_app_list",
  "timestamp": "2025-12-19T12:00:00Z",
  "confidence": "high",
  "problems_encountered": [],
  "resources_created": [],
  "tool_response_summary": "Listed 3 apps successfully",
  "execution_notes": "Tool responded in <100ms"
}
EOF
```

### Option 2: Use the Helper Script

Use `npm run eval:save-result` to save programmatically:

```bash
# From JSON file
npm run eval:save-result -- \
  --tool app-list \
  --domain apps \
  --result /path/to/result.json

# Inline JSON
npm run eval:save-result -- \
  --tool app-list \
  --domain apps \
  --json '{"success": true, "tool_executed": "mcp__mittwald__mittwald_app_list", ...}'
```

## ❌ DO NOT Save to These Locations

**WRONG:**
```bash
evals/results/apps/app-list-result.json          # Flat structure (OLD)
evals/results/identity/user-get-result.json      # Flat structure (OLD)
```

**RIGHT:**
```bash
evals/results/active/apps/app-list-result.json           # Via symlink ✅
evals/results/active/identity/user-get-result.json       # Via symlink ✅
```

## Self-Assessment Format (Required Fields)

```json
{
  "success": true,
  "confidence": "high",
  "tool_executed": "mcp__mittwald__mittwald_app_list",
  "timestamp": "2025-12-19T12:00:00Z",
  "problems_encountered": [],
  "resources_created": [],
  "tool_response_summary": "Brief summary of tool output",
  "execution_notes": "Any observations"
}
```

## Verification

After saving, verify your result is in the right place:

```bash
# Check active run
ls -la evals/results/active/apps/

# Should show your result file
# app-list-result.json
```

## Migration for Old Results

If you accidentally saved to the flat structure, migrate them:

```bash
# Dry run (see what would be migrated)
npm run eval:migrate -- --dry-run

# Actually migrate
npm run eval:migrate

# Force overwrite existing
npm run eval:migrate -- --force
```

---

**Remember**: Always save to `evals/results/active/{domain}/` or use the helper script!
