---
work_package_id: WP04
title: Configure BASE_URL and Cross-Site Navigation
lane: "for_review"
dependencies: []
subtasks:
- T004
phase: Phase A - Infrastructure & Setup
assignee: ''
agent: "claude"
shell_pid: "2097"
review_status: ''
reviewed_by: ''
history:
- timestamp: '2025-01-23T00:00:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
---

# Work Package Prompt: WP04 – Configure BASE_URL and Cross-Site Navigation

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

**Goal**: Enable flexible deployment by configuring dynamic BASE_URL support and establishing cross-site navigation links between the two documentation sites.

**Success Criteria**:
- ✅ Both sites build successfully with default BASE_URL (`/`)
- ✅ Both sites build successfully with custom BASE_URLs (`/docs`, `/mcp-docs`, etc.)
- ✅ Links in built output correctly use the specified BASE_URL prefix
- ✅ Cross-site navigation link from Site 1 to Site 2 works
- ✅ Cross-site navigation link from Site 2 to Site 1 works
- ✅ Environment variables documented in both READMEs
- ✅ Build scripts tested with multiple BASE_URL values
- ✅ Cross-site links adapt to different BASE_URL configurations

---

## Context & Constraints

**Prerequisites**: WP01 (Site 1), WP02 (Site 2), and WP03 (Branding) must be complete - both sites must exist and be branded before adding navigation.

**Related Documents**:
- Spec: `/Users/robert/Code/mittwald-mcp/kitty-specs/016-mittwald-mcp-documentation/spec.md` (FR-038: BASE_URL support)
- Plan: `/Users/robert/Code/mittwald-mcp/kitty-specs/016-mittwald-mcp-documentation/plan.md`

**Architectural Context**:
- **Why BASE_URL matters**: Sites may be deployed to different paths depending on hosting:
  - Root deployment: `https://docs.mittwald.de/` (BASE_URL = `/`)
  - Subfolder deployment: `https://mittwald.de/docs/` (BASE_URL = `/docs`)
  - GitHub Pages: `https://mittwald.github.io/mcp-docs/` (BASE_URL = `/mcp-docs`)
  - Multiple environments: staging, production with different paths

- **Cross-site navigation**: The two sites are separate but related:
  - Users should be able to navigate from OAuth guides to tool reference
  - Users should be able to return from reference to guides
  - Links must adapt to deployment configuration

**Constraints**:
- BASE_URL must be configurable at build time (environment variable)
- Cross-site links must work regardless of deployment location
- No hardcoded URLs (everything must be relative or configurable)
- Must work with Astro's static site generation

---

## Subtasks & Detailed Guidance

### Subtask T004 – Configure BASE_URL Support and Cross-Site Navigation

**Purpose**: Enable flexible deployment by adding build-time BASE_URL configuration and cross-site navigation between the two documentation sites.

**Steps**:

#### Part 1: Verify BASE_URL Configuration Exists

1. **Check Site 1 configuration** (should already exist from WP01):

   File: `docs/setup-and-guides/astro.config.mjs`

   Verify this code is present:
   ```javascript
   const baseUrl = process.env.BASE_URL || '/';

   export default defineConfig({
     base: baseUrl,
     // ... rest of config
   });
   ```

   **If not present**, add it at the top of the file before `defineConfig`.

2. **Check Site 2 configuration** (should already exist from WP02):

   File: `docs/reference/astro.config.mjs`

   Verify the same BASE_URL configuration exists.

#### Part 2: Add Cross-Site Navigation Links

3. **Add "Reference" link to Site 1 navigation**:

   File: `docs/setup-and-guides/astro.config.mjs`

   Update the `sidebar` array in the Starlight configuration:

   ```javascript
   const baseUrl = process.env.BASE_URL || '/';
   const referenceUrl = process.env.REFERENCE_SITE_URL || '/reference';

   export default defineConfig({
     base: baseUrl,
     integrations: [
       starlight({
         title: 'Mittwald MCP - Setup & Guides',
         // ... other config
         sidebar: [
           {
             label: 'Home',
             link: '/',
           },
           {
             label: 'Getting Started',
             items: [
               { label: 'Overview', link: '/getting-started/' },
               // ... other items
             ],
           },
           {
             label: 'Learn',
             items: [
               { label: 'Explainers', link: '/explainers/' },
             ],
           },
           {
             label: 'Examples',
             items: [
               { label: 'Case Studies', link: '/case-studies/' },
             ],
           },
           // ADD THIS: Cross-site link to reference
           {
             label: '→ Tool Reference',
             link: referenceUrl,
             badge: { text: 'External', variant: 'note' },
           },
         ],
         // ... rest of config
       }),
     ],
   });
   ```

   **Key points**:
   - `REFERENCE_SITE_URL` environment variable controls reference site URL
   - Default: `/reference` (assumes both sites deployed to same domain)
   - Badge indicates external/separate site
   - Arrow (→) visually indicates navigation to different site

4. **Add "Back to Setup" link to Site 2 navigation**:

   File: `docs/reference/astro.config.mjs`

   Update the `sidebar` array:

   ```javascript
   const baseUrl = process.env.BASE_URL || '/';
   const setupUrl = process.env.SETUP_SITE_URL || '/';

   export default defineConfig({
     base: baseUrl,
     integrations: [
       starlight({
         title: 'Mittwald MCP - Tool Reference',
         // ... other config
         sidebar: [
           {
             label: 'Home',
             link: '/',
           },
           {
             label: 'Tools by Domain',
             autogenerate: { directory: 'tools' },
           },
           // ADD THIS: Cross-site link back to setup
           {
             label: '← Back to Setup & Guides',
             link: setupUrl,
             badge: { text: 'External', variant: 'note' },
           },
         ],
         // ... rest of config
       }),
     ],
   });
   ```

   **Key points**:
   - `SETUP_SITE_URL` environment variable controls setup site URL
   - Default: `/` (root of domain)
   - Arrow (←) visually indicates return navigation

#### Part 3: Test BASE_URL with Multiple Values

5. **Test Site 1 with default BASE_URL**:

   ```bash
   cd docs/setup-and-guides
   npm run build
   ```

   **Verification**:
   - Build succeeds
   - Check `dist/index.html` - links should be relative to `/`

6. **Test Site 1 with `/docs` BASE_URL**:

   ```bash
   cd docs/setup-and-guides
   rm -rf dist/  # Clean previous build
   BASE_URL=/docs npm run build
   ```

   **Verification**:
   - Build succeeds
   - Check `dist/index.html` - links should include `/docs` prefix
   - Example: `` `<a href="/docs/getting-started/">` ``

7. **Test Site 1 with `/mcp-docs` BASE_URL**:

   ```bash
   rm -rf dist/
   BASE_URL=/mcp-docs npm run build
   ```

   **Verification**:
   - Build succeeds
   - Links include `/mcp-docs` prefix

8. **Test Site 2 with default and custom BASE_URLs**:

   Repeat steps 5-7 for `docs/reference`:

   ```bash
   cd docs/reference
   
   # Test 1: Default
   npm run build

   # Test 2: /docs
   rm -rf dist/
   BASE_URL=/docs npm run build

   # Test 3: /mcp-docs
   rm -rf dist/
   BASE_URL=/mcp-docs npm run build
   ```

   **Verification for each**:
   - Build succeeds
   - Links use correct BASE_URL prefix

#### Part 4: Test Cross-Site Navigation

9. **Test cross-site navigation with same BASE_URL**:

   Build both sites with `/docs` BASE_URL:

   ```bash
   cd docs/setup-and-guides
   BASE_URL=/docs REFERENCE_SITE_URL=/docs/reference npm run build

   cd docs/reference
   BASE_URL=/docs/reference SETUP_SITE_URL=/docs npm run build
   ```

   **Manual verification**:
   - Open `setup-and-guides/dist/index.html` in browser
   - Click "→ Tool Reference" link in sidebar
   - Should navigate to `/docs/reference` (Site 2)
   - Click "← Back to Setup & Guides" in Site 2
   - Should return to `/docs` (Site 1)

10. **Test cross-site navigation with different domains**:

    Simulate production deployment where sites are on different URLs:

    ```bash
    cd docs/setup-and-guides
    BASE_URL=/ REFERENCE_SITE_URL=https://reference.mittwald.mcp npm run build

    cd docs/reference
    BASE_URL=/ SETUP_SITE_URL=https://setup.mittwald.mcp npm run build
    ```

    **Verification**:
    - Links point to full URLs (different domains)
    - This would work if sites are hosted separately

#### Part 5: Update Documentation

11. **Update Site 1 README** with BASE_URL instructions:

    File: `docs/setup-and-guides/README.md`

    Add section on BASE_URL and cross-site navigation:

    ```markdown
    ## Build Configuration

    ### BASE_URL

    The site can be deployed to any base path using the `BASE_URL` environment variable.

    **Root deployment** (default):
    ```bash
    npm run build
    # Deployed to: https://example.com/
    ```

    **Subfolder deployment**:
    ```bash
    BASE_URL=/docs npm run build
    # Deployed to: https://example.com/docs/
    ```

    **GitHub Pages**:
    ```bash
    BASE_URL=/mcp-docs npm run build
    # Deployed to: https://username.github.io/mcp-docs/
    ```

    ### Cross-Site Navigation

    Link to the reference site using the `REFERENCE_SITE_URL` variable.

    **Same domain (default)**:
    ```bash
    REFERENCE_SITE_URL=/reference npm run build
    # Reference link points to: /reference
    ```

    **Different domain**:
    ```bash
    REFERENCE_SITE_URL=https://reference.mittwald.mcp npm run build
    # Reference link points to: https://reference.mittwald.mcp
    ```

    **Complete example** (both sites on same domain):
    ```bash
    BASE_URL=/docs REFERENCE_SITE_URL=/docs/reference npm run build
    ```

    ## Deployment Scenarios

    ### Scenario 1: Same Domain, Different Paths
    - Setup & Guides: `https://docs.mittwald.de/setup/`
    - Reference: `https://docs.mittwald.de/reference/`

    ```bash
    # Site 1
    cd docs/setup-and-guides
    BASE_URL=/setup REFERENCE_SITE_URL=/reference npm run build

    # Site 2
    cd docs/reference
    BASE_URL=/reference SETUP_SITE_URL=/setup npm run build
    ```

    ### Scenario 2: Different Subdomains
    - Setup & Guides: `https://setup.mittwald.mcp/`
    - Reference: `https://reference.mittwald.mcp/`

    ```bash
    # Site 1
    cd docs/setup-and-guides
    BASE_URL=/ REFERENCE_SITE_URL=https://reference.mittwald.mcp npm run build

    # Site 2
    cd docs/reference
    BASE_URL=/ SETUP_SITE_URL=https://setup.mittwald.mcp npm run build
    ```

    ### Scenario 3: GitHub Pages
    - Setup & Guides: `https://mittwald.github.io/mcp-setup/`
    - Reference: `https://mittwald.github.io/mcp-reference/`

    ```bash
    # Site 1
    cd docs/setup-and-guides
    BASE_URL=/mcp-setup REFERENCE_SITE_URL=/mcp-reference npm run build

    # Site 2
    cd docs/reference
    BASE_URL=/mcp-reference SETUP_SITE_URL=/mcp-setup npm run build
    ```
    ```

12. **Update Site 2 README** with similar documentation:

    File: `docs/reference/README.md`

    Add the same BASE_URL and cross-site navigation sections (adapted for Site 2 context).

13. **Create deployment examples script**:

    File: `docs/build-all.sh`

    ```bash
    #!/bin/bash
    # Build both documentation sites with configurable BASE_URLs
    # Usage: ./build-all.sh [scenario]
    # Scenarios: local, production, github-pages

    set -e  # Exit on error

    SCENARIO=${1:-local}

    case $SCENARIO in
      local)
        echo "Building for local development..."
        BASE_URL_SETUP="/"
        BASE_URL_REF="/"
        REF_SITE_URL="/reference"
        SETUP_SITE_URL="/"
        ;;
      production)
        echo "Building for production (same domain)..."
        BASE_URL_SETUP="/setup"
        BASE_URL_REF="/reference"
        REF_SITE_URL="/reference"
        SETUP_SITE_URL="/setup"
        ;;
      github-pages)
        echo "Building for GitHub Pages..."
        BASE_URL_SETUP="/mcp-setup"
        BASE_URL_REF="/mcp-reference"
        REF_SITE_URL="/mcp-reference"
        SETUP_SITE_URL="/mcp-setup"
        ;;
      *)
        echo "Unknown scenario: $SCENARIO"
        echo "Usage: $0 [local|production|github-pages]"
        exit 1
        ;;
    esac

    # Build Site 1 (Setup & Guides)
    echo "Building Setup & Guides site..."
    cd setup-and-guides
    BASE_URL=$BASE_URL_SETUP REFERENCE_SITE_URL=$REF_SITE_URL npm run build
    cd ..

    # Build Site 2 (Reference)
    echo "Building Reference site..."
    cd reference
    BASE_URL=$BASE_URL_REF SETUP_SITE_URL=$SETUP_SITE_URL npm run build
    cd ..

    echo "Build complete!"
    echo "Setup & Guides: docs/setup-and-guides/dist/"
    echo "Reference: docs/reference/dist/"
    ```

    Make it executable:
    ```bash
    chmod +x docs/build-all.sh
    ```

#### Part 6: Comprehensive Testing

14. **Test all deployment scenarios**:

    ```bash
    cd docs

    # Test 1: Local development
    ./build-all.sh local

    # Test 2: Production (same domain)
    ./build-all.sh production

    # Test 3: GitHub Pages
    ./build-all.sh github-pages
    ```

    **Verification for each scenario**:
    - ✅ Both builds succeed
    - ✅ No broken links
    - ✅ Cross-site navigation links are correct

15. **Manual link verification**:

    Open built files and inspect links:

    ```bash
    # Check Site 1 links
    grep -r "href=" docs/setup-and-guides/dist/ | head -20

    # Check Site 2 links
    grep -r "href=" docs/reference/dist/ | head -20
    ```

    **Expected**:
    - Links include correct BASE_URL prefix
    - Cross-site links point to correct location

16. **Serve built sites locally** for manual testing:

    ```bash
    # Option 1: Python HTTP server
    cd docs/setup-and-guides/dist
    python3 -m http.server 8000
    # Visit http://localhost:8000

    # Option 2: npx serve
    npx serve docs/setup-and-guides/dist -p 8000
    ```

    **Manual testing**:
    - Click through all navigation links
    - Verify cross-site link works (may need to adjust for local paths)
    - Test on different browsers

**Files Created/Modified**:
- `docs/setup-and-guides/astro.config.mjs` (modified - cross-site link added)
- `docs/reference/astro.config.mjs` (modified - cross-site link added)
- `docs/setup-and-guides/README.md` (modified - BASE_URL docs added)
- `docs/reference/README.md` (modified - BASE_URL docs added)
- `docs/build-all.sh` (new - deployment script)

**Parallel?**: No - depends on WP01, WP02, WP03 (sites must exist and be branded)

**Notes**:
- BASE_URL configuration enables deployment to any path
- Cross-site links adapt to deployment scenario
- Build script simplifies deployment to different environments
- Manual testing is important - automated link checking will come in WP13

---

## Test Strategy

**Automated Testing**:

1. **Build test matrix**:
   ```bash
   # Test all BASE_URL scenarios for both sites
   for BASE_URL in "/" "/docs" "/mcp-docs" "/documentation/mittwald"; do
     echo "Testing BASE_URL=$BASE_URL"
     cd docs/setup-and-guides
     rm -rf dist/
     BASE_URL=$BASE_URL npm run build || exit 1
     cd ../reference
     rm -rf dist/
     BASE_URL=$BASE_URL npm run build || exit 1
     cd ../..
   done
   ```

   **Expected**: All builds succeed

2. **Cross-site link verification**:
   ```bash
   cd docs
   ./build-all.sh production
   
   # Verify cross-site link in Site 1
   grep -q "Tool Reference" setup-and-guides/dist/index.html
   echo "Site 1 cross-site link: OK"

   # Verify cross-site link in Site 2
   grep -q "Back to Setup" reference/dist/index.html
   echo "Site 2 cross-site link: OK"
   ```

**Manual Testing**:

1. **Visual navigation testing**:
   - Build both sites with production config
   - Serve locally
   - Click "→ Tool Reference" in Site 1
   - Click "← Back to Setup & Guides" in Site 2
   - Verify navigation works

2. **Link inspection**:
   - Open DevTools
   - Inspect cross-site navigation links
   - Verify `href` attribute is correct

3. **Different deployment scenarios**:
   - Test with local paths
   - Test with absolute URLs
   - Test with subfolders

---

## Risks & Mitigations

**Risk 1: Cross-site links may break if sites are deployed separately**
- **Cause**: Relative links don't work across different domains
- **Mitigation**: Use environment variables for cross-site URLs
- **Testing**: Test with absolute URLs in build script

**Risk 2: BASE_URL may not apply to all links**
- **Cause**: Astro/Starlight may miss some link types
- **Mitigation**: Comprehensive link inspection after build
- **Fallback**: Manual link fixes if needed (report as bug to Starlight)

**Risk 3: Build script may fail on different operating systems**
- **Cause**: Bash script uses Unix-specific commands
- **Mitigation**: Use portable commands (avoid GNU-specific flags)
- **Fallback**: Document manual build steps as alternative

**Risk 4: Users may not understand deployment configuration**
- **Cause**: Environment variables can be confusing
- **Mitigation**: Clear README documentation with examples
- **Support**: Provide build script with common scenarios

---

## Review Guidance

**Key Acceptance Criteria**:

1. **BASE_URL configuration works**:
   - Both sites build with default BASE_URL (`/`)
   - Both sites build with custom BASE_URLs (`/docs`, `/mcp-docs`)
   - Links in built output use correct BASE_URL prefix

2. **Cross-site navigation exists**:
   - Site 1 has link to Site 2 ("→ Tool Reference")
   - Site 2 has link to Site 1 ("← Back to Setup & Guides")
   - Links are configurable via environment variables

3. **Documentation is comprehensive**:
   - READMEs explain BASE_URL usage
   - Deployment scenarios documented
   - Build script provided with examples

4. **Testing is thorough**:
   - Multiple BASE_URL values tested
   - Cross-site navigation tested
   - Build script tested with all scenarios

**Verification Commands**:

```bash
# Test default BASE_URL
cd docs/setup-and-guides && npm run build
cd docs/reference && npm run build

# Test custom BASE_URL
cd docs/setup-and-guides && BASE_URL=/docs npm run build
cd docs/reference && BASE_URL=/docs npm run build

# Test build script
cd docs
./build-all.sh local
./build-all.sh production
./build-all.sh github-pages

# Verify cross-site links
grep "Tool Reference" setup-and-guides/dist/index.html
grep "Back to Setup" reference/dist/index.html
```

**Review Checklist**:
- [ ] BASE_URL configuration works for both sites
- [ ] Both sites build with multiple BASE_URL values
- [ ] Cross-site navigation link added to Site 1
- [ ] Cross-site navigation link added to Site 2
- [ ] Environment variables documented in READMEs
- [ ] Deployment scenarios documented
- [ ] Build script created and tested
- [ ] All scenarios (local, production, GitHub Pages) work
- [ ] Links inspected and verified correct

---

## Implementation Command

To implement this work package:

```bash
spec-kitty implement WP04 --base WP03
```

*(Depends on WP01, WP02, WP03; use WP03 as base since it was implemented last)*

---

## Activity Log

> Entries MUST be in chronological order (oldest first, newest last).

*[Activity log will be populated during implementation and review]*
- 2026-01-23T10:37:52Z – claude – shell_pid=2097 – lane=doing – Started implementation via workflow command
- 2026-01-23T11:06:14Z – claude – shell_pid=2097 – lane=for_review – Completed BASE_URL configuration and cross-site navigation: both sites build successfully with default and custom BASE_URLs, environment variables documented in READMEs, build script tested with all scenarios (local, production, github-pages), cross-site links verified in built output
