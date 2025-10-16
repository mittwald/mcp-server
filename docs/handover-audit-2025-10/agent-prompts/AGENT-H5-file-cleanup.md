# Agent H5: Dead/Unused File Cleanup Audit

**Agent ID**: H5-File-Cleanup
**Audit Area**: Unused Files & Code Organization
**Priority**: Medium
**Estimated Duration**: 1-2 hours

---

## Mission

Identify all dead, unused, orphaned, temporary, and legacy files in the codebase that should be removed or archived before production handover. Create a safe deletion plan.

---

## Scope

**Directories to Audit**:
- `/Users/robert/Code/mittwald-mcp/src/`
- `/Users/robert/Code/mittwald-mcp/tests/`
- `/Users/robert/Code/mittwald-mcp/scripts/`
- `/Users/robert/Code/mittwald-mcp/config/`
- `/Users/robert/Code/mittwald-mcp/packages/`
- Root directory files

**File Types to Check**:
- TypeScript source files (*.ts)
- JavaScript files (*.js)
- Configuration files (*.json, *.yaml, *.yml)
- Documentation (*.md)
- Scripts (*.sh, *.ts in scripts/)
- Docker files (Dockerfile*, docker-compose*)

---

## Methodology

### 1. Unreferenced Source Files

**Entry Points**:
```bash
# Main entry points:
cat package.json | grep "\"main\"\|\"bin\"\|\"exports\""

# Identify:
- src/index.ts
- src/server/index.ts (OAuth bridge)
- packages/*/src/index.ts
```

**Trace Imports**:
```bash
# For each .ts file in src/, check if it's imported anywhere:
find src/ -name "*.ts" -type f | while read file; do
  basename="${file##*/}"
  name="${basename%.ts}"

  # Search for imports of this file:
  grep -r "from.*$name" src/ packages/ --exclude="$file"

  if [ $? -ne 0 ]; then
    echo "ORPHAN: $file"
  fi
done
```

**Check Test Files**:
```bash
# Find test files without corresponding source:
find tests/ -name "*.test.ts" | while read test; do
  # Extract what it's testing
  # Verify source file exists
done
```

### 2. Legacy/Superseded Code

**Known Legacy Patterns**:

**cli-wrapper.ts (deprecated)**:
```bash
# Verify no longer used:
grep -r "cli-wrapper" src/ packages/
# Should be ZERO matches (migrated to cli-adapter)
```

**oidc-provider (superseded)**:
```bash
# Check for remnants of old OAuth implementation:
grep -r "oidc-provider" src/ packages/
find . -name "*oidc*" -not -path "*/node_modules/*" -not -path "*/docs/archive/*"
```

**Old Pattern Implementations** (pre-migration):
```bash
# Search for old destructive operation patterns (pre-C4):
# (Agent H1 may have found these as well)
```

### 3. Temporary Files Committed to Git

**Common Temp Patterns**:
```bash
git ls-files | grep -E "\\.tmp$|\\.temp$|~$|\\.bak$|\\.swp$"
git ls-files | grep -E "^temp/|^tmp/"
git ls-files | grep -E "test-.*\\.json$" # Test data files
```

**Development Artifacts**:
```bash
git ls-files | grep -E "\\.log$|\\.pid$"
git ls-files | grep -E "debug|TODO\\.txt|notes\\.txt"
```

### 4. Orphaned Test Files

**Tests Without Source**:
```bash
# For each test file, verify source exists:
find tests/ -name "*.test.ts" | while read test; do
  # Extract module being tested
  # Check if source exists in src/
done
```

**Old Test Utilities**:
```bash
# Find test helpers/mocks no longer used:
find tests/ -name "*.mock.ts" -o -name "*-helper.ts" -o -name "*.fixture.ts"
# Verify each is imported by test files
```

### 5. Unused Configuration Files

**Config Files**:
```bash
ls -la *.json *.yaml *.yml *.config.js *.config.ts | grep -v package.json
```

**Check Each**:
- Is it referenced in package.json scripts?
- Is it loaded by the application?
- Is it used by CI/CD?

**Common Unused Configs**:
- Old linter configs (.eslintrc* if using eslint.config.js)
- Old TypeScript configs (tsconfig.old.json, etc.)
- Old Docker compose files (docker-compose.old.yml)

### 6. Build Artifacts in Source Control

**Should NOT Be Committed**:
```bash
git ls-files | grep -E "^build/|^dist/|\\.js$" | grep -v node_modules
```

**Check .gitignore Coverage**:
```bash
cat .gitignore
```

**Verify**:
- build/ ignored ✅
- dist/ ignored ✅
- *.log ignored ✅
- .env ignored (but .env.example committed) ✅

### 7. Duplicate Configuration

**Multiple Similar Configs**:
```bash
# Find multiple Docker files:
ls -la | grep -i dockerfile

# Multiple compose files:
ls -la | grep -i "docker-compose"

# Multiple tsconfig files:
find . -name "tsconfig*.json" -not -path "*/node_modules/*"
```

**Verify Each Is Needed**:
- Dockerfile vs stdio.Dockerfile vs openapi.Dockerfile
- docker-compose.yml vs docker-compose.prod.yml
- tsconfig.json (root) vs packages/*/tsconfig.json

### 8. Dead Directories

**Empty or Unused Directories**:
```bash
find . -type d -empty -not -path "*/node_modules/*" -not -path "*/.git/*"
```

**Suspicious Directories**:
```bash
ls -la | grep -E "old|backup|archive|temp|tmp|delete"
```

### 9. Large Files (Shouldn't Be in Repo)

```bash
find . -type f -size +1M -not -path "*/node_modules/*" -not -path "*/.git/*"
```

**Flag**:
- Binary files
- Large JSON files (maybe should be external)
- Images/videos (should be in asset storage)

### 10. Package-Specific Checks

**OAuth Bridge** (`packages/oauth-bridge/`):
```bash
# Check for unused files specific to OAuth bridge
```

**MCP Server** (`packages/mcp-server/`):
```bash
# Check for unused files specific to MCP server
```

---

## File Classification

For each file found, classify:

```markdown
**File**: path/to/file.ts
**Type**: Source | Test | Config | Script | Doc | Other
**Status**:
  - 🗑️ Dead (safe to delete)
  - ⚠️ Orphaned (needs investigation)
  - 🔄 Legacy (superseded, can delete)
  - 📁 Misplaced (should be archived)
  - ✅ Keep (has reason to exist)
**Reason**: [Why it's flagged]
**References**: [Imports/usage if any]
**Recommendation**: Delete | Archive | Keep | Investigate
**Risk**: None | Low | Medium | High (if deleted)
```

---

## Output Format

### 1. Executive Summary
- Total files audited: [count]
- Dead files found: [count]
- Orphaned files: [count]
- Safe to delete: [count]
- Needs investigation: [count]

### 2. Methodology
How audit was conducted.

### 3. Findings by Category

#### 3.1 Unreferenced Source Files
[List with classification]

#### 3.2 Legacy/Superseded Code
[Files using old patterns, deprecated modules]

#### 3.3 Temporary Files in Git
[Temp files that should be gitignored]

#### 3.4 Orphaned Test Files
[Tests without source or source without tests]

#### 3.5 Unused Configuration Files
[Configs not referenced anywhere]

#### 3.6 Build Artifacts in Git
[Files that should be gitignored]

#### 3.7 Duplicate Configurations
[Multiple configs with unclear purpose]

#### 3.8 Empty/Dead Directories
[Directories that can be removed]

#### 3.9 Large Files
[Files > 1MB that may not belong in repo]

### 4. Safe Deletion List

Files confirmed safe to delete:
```bash
# Deletion script (do not execute in audit):
rm src/path/to/dead-file1.ts
rm src/path/to/dead-file2.ts
# etc.
```

### 5. Investigation Required

Files needing human review before decision:
```markdown
**File**: path/to/file.ts
**Concern**: [Why uncertain]
**Questions**: [What needs to be answered]
```

### 6. Archive Recommendations

Files to move to docs/archive/:
[List with rationale]

### 7. .gitignore Improvements

Files currently tracked that should be ignored:
```
# Add to .gitignore:
*.log
*.tmp
build/
dist/
```

### 8. Metrics
- Source files: [total] / [orphaned] / [dead]
- Test files: [total] / [orphaned]
- Config files: [total] / [unused]
- Temp files in git: [count]
- Large files: [count]
- Bytes saved if cleaned: [size]

---

## Success Criteria

- ✅ All source files checked for references
- ✅ Legacy code identified (cli-wrapper, oidc-provider)
- ✅ Temp files in git found
- ✅ Orphaned tests identified
- ✅ Unused configs found
- ✅ Build artifacts in git flagged
- ✅ Safe deletion list created
- ✅ Investigation list provided
- ✅ .gitignore improvements recommended

---

## Key Context

**Known Deprecated Code**:
- `cli-wrapper.ts` - Replaced by cli-adapter pattern (0 imports expected)
- oidc-provider approach - Replaced by stateless OAuth bridge
- Pre-C4 destructive operations - Updated to include confirm parameter

**Entry Points**:
- Main: src/index.ts
- OAuth Bridge: packages/oauth-bridge/src/server.ts (or index.ts)
- MCP Server: packages/mcp-server/src/ (if applicable)

**Package Structure**:
- Monorepo with packages/ (oauth-bridge, mcp-server)
- Tests in tests/ (not src/**/*.test.ts pattern)

---

## Important Notes

- **READ-ONLY audit** - identify files, don't delete them
- Mark files as "investigate" if **any** uncertainty
- Consider impact on git history (files may be dead now but historically relevant)
- Check if files are:
  - Referenced in docs (examples, tutorials)
  - Used in CI/CD (.github/workflows/)
  - Loaded dynamically (runtime imports)
- Priority: **Production-blocking issues only** (temp files, build artifacts in git)

---

## Deliverable

**Document**: `/Users/robert/Code/mittwald-mcp/docs/handover-audit-2025-10/AUDIT-H5-FILE-CLEANUP-REPORT.md`

**Format**: Markdown with file lists, classification table, deletion script

**Due**: End of audit phase

---

**Agent Assignment**: To be assigned
**Status**: Ready for execution
**Dependencies**: H1 (code quality audit may overlap)
