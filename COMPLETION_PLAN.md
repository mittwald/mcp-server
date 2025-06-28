# Swarm V2 Completion Plan
**Transform rescued implementations into a fully working MCP server**

## Current Status
✅ **194 tool definitions rescued**  
✅ **178 tool handlers rescued**  
❌ **Import/export naming mismatches preventing compilation**  
❌ **Missing registration for many tools**  

## Phase 1: Fix Import/Export Consistency (2-3 hours)

### 1.1 Standardize Naming Convention
**Decision**: Use `kebab-case` names with underscores for all exports
```typescript
// Standard pattern:
export const mittwald_category_action: Tool = { name: "mittwald_category_action", ... }
```

### 1.2 Fix Category Index Files
For each category in `src/constants/tool/mittwald-cli/*/index.ts`:
```bash
# Automated fix script needed
./scripts/fix-exports.sh app
./scripts/fix-exports.sh database  
./scripts/fix-exports.sh project
./scripts/fix-exports.sh cronjob
# ... etc for all categories
```

### 1.3 Update Main Tools Registry
Fix `src/constants/tools.ts` imports to match actual exports:
- Remove legacy `MITTWALD_*_TOOL` aliases
- Use consistent `mittwald_*` naming
- Ensure all 194 tools are imported and registered

### 1.4 Validation-Driven Fixes
```bash
# Iterative approach:
npm run validate-tools  # Shows next batch of errors
# Fix the next 10-20 import errors
npm run validate-tools  # Repeat until clean
```

## Phase 2: Complete Tool Registration (1-2 hours)

### 2.1 Missing Handler Integration
Many tools have definitions but missing handlers in `tool-handlers.ts`:
- Add missing imports for 178 handler functions
- Add missing switch cases for all tools
- Ensure consistent parameter passing

### 2.2 Missing Zod Schemas
Add missing schemas in `ToolSchemas` object:
- Extract parameter schemas from tool definitions
- Ensure validation consistency
- Add proper TypeScript types

### 2.3 Tool Count Verification
Target: **169 tools fully registered** (original CLI command count)
```bash
# Verification commands:
grep -c "case.*mittwald" src/handlers/tool-handlers.ts  # Should be 169
grep -c "mittwald_.*:" src/handlers/tool-handlers.ts    # Should be 169  
wc -l src/constants/tools.ts | grep mittwald            # Should be 169
```

## Phase 3: Quality Assurance (1-2 hours)

### 3.1 TypeScript Compilation
```bash
npm run typecheck  # Must pass with 0 errors
```

### 3.2 Tool Functionality Testing
Test core tool categories:
```bash
# Test tool listing
mcp list-tools | grep mittwald | wc -l  # Should show 169

# Test sample tools from each category
mcp call mittwald_project_list
mcp call mittwald_app_list  
mcp call mittwald_database_list
mcp call mittwald_org_list
```

### 3.3 Error Handling Verification
- All tools handle missing parameters gracefully
- Authentication flows work correctly
- API client integration functions properly

## Phase 4: Documentation & Polish (1 hour)

### 4.1 Update Documentation
- Update README with complete tool list
- Document authentication setup
- Add usage examples for major workflows

### 4.2 Performance Validation
- Tool listing under 100ms
- Individual tool calls under 2s
- Memory usage reasonable

### 4.3 Final Commit
```bash
git add .
git commit -m "complete: Fully working MCP server with 169 Mittwald CLI tools

- All import/export naming fixed
- 169 tools fully registered and functional  
- TypeScript compilation clean
- All tool categories working
- Complete CLI-to-MCP mapping achieved

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

## Automation Scripts Needed

### `scripts/fix-exports.sh`
```bash
#!/bin/bash
CATEGORY=$1
echo "Fixing exports for category: $CATEGORY"

# Find all tool files in category
find src/constants/tool/mittwald-cli/$CATEGORY -name "*.ts" -not -name "index.ts" | while read file; do
    # Extract tool name and ensure consistent export
    tool_name=$(basename "$file" .ts)
    # Fix export format if needed
    sed -i '' 's/export const [A-Z_]*/export const mittwald_'$CATEGORY'_'$tool_name'/g' "$file"
done

# Regenerate category index
./scripts/generate-category-index.sh $CATEGORY
```

### `scripts/generate-category-index.sh`  
```bash
#!/bin/bash
CATEGORY=$1
INDEX_FILE="src/constants/tool/mittwald-cli/$CATEGORY/index.ts"

echo "/**" > $INDEX_FILE
echo " * @file $CATEGORY-related tool exports" >> $INDEX_FILE  
echo " */" >> $INDEX_FILE
echo "" >> $INDEX_FILE

find src/constants/tool/mittwald-cli/$CATEGORY -name "*.ts" -not -name "index.ts" | sort | while read file; do
    tool_name=$(basename "$file" .ts)
    rel_path=$(realpath --relative-to="$(dirname $INDEX_FILE)" "$file" | sed 's/\.ts$/.js/')
    echo "export { mittwald_${CATEGORY}_${tool_name} } from './$rel_path';" >> $INDEX_FILE
done
```

### `scripts/update-tools-registry.js`
```javascript
// Node.js script to automatically update tools.ts with all discovered tools
const fs = require('fs');
const path = require('path');

function findAllTools() {
    const tools = [];
    const categoriesDir = 'src/constants/tool/mittwald-cli';
    
    // Scan all category directories
    const categories = fs.readdirSync(categoriesDir).filter(item => 
        fs.statSync(path.join(categoriesDir, item)).isDirectory()
    );
    
    categories.forEach(category => {
        const categoryPath = path.join(categoriesDir, category);
        const toolFiles = fs.readdirSync(categoryPath).filter(file => 
            file.endsWith('.ts') && file !== 'index.ts'
        );
        
        toolFiles.forEach(file => {
            const toolName = `mittwald_${category}_${path.basename(file, '.ts')}`;
            tools.push({ category, toolName });
        });
    });
    
    return tools;
}

function generateToolsFile(tools) {
    // Generate the complete tools.ts file with all imports and exports
    // Implementation details...
}

const allTools = findAllTools();
generateToolsFile(allTools);
console.log(`Generated tools.ts with ${allTools.length} tools`);
```

## Success Criteria

### ✅ Compilation Success
- `npm run typecheck` → 0 errors
- `npm run lint` → 0 errors  
- `npm run build` → successful build

### ✅ Functional MCP Server
- All 169 tools listed in `mcp list-tools`
- Sample tools from each category execute successfully
- Authentication flows work with real API tokens
- Error handling graceful for invalid parameters

### ✅ Code Quality
- Consistent naming conventions throughout
- Proper TypeScript types for all tools
- Clean git history with descriptive commits
- Documentation reflects current state

## Timeline Estimate
- **Phase 1**: 2-3 hours (import/export fixes)
- **Phase 2**: 1-2 hours (registration completion)  
- **Phase 3**: 1-2 hours (quality assurance)
- **Phase 4**: 1 hour (documentation)

**Total: 5-8 hours** to complete fully working MCP server

## Post-Completion Verification
```bash
# Final verification commands
npm run validate-tools           # Should show 0 issues
npm run typecheck               # Should pass
npm run build                   # Should succeed  
mcp list-tools | grep mittwald | wc -l  # Should show 169
```

**End Result**: Complete, production-ready MCP server with 1:1 mapping to all Mittwald CLI commands! 🎯