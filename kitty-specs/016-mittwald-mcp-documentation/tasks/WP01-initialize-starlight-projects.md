---
work_package_id: "WP01"
subtasks:
  - "T001"
  - "T002"
  - "T003"
  - "T004"
title: "Initialize Astro Starlight Projects"
phase: "Phase A - Infrastructure & Setup"
lane: "doing"
dependencies: []
assignee: ""
agent: "claude-code"
shell_pid: "8585"
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-01-23T00:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP01 – Initialize Astro Starlight Projects

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

**Goal**: Set up two independent Astro Starlight projects with Mittwald branding and configurable BASE_URL support.

**Success Criteria**:
- ✅ Site 1 (`docs/setup-and-guides/`) initializes successfully with Starlight
- ✅ Site 2 (`docs/reference/`) initializes successfully with Starlight
- ✅ Mittwald branding (logo, colors) applied consistently to both sites
- ✅ BASE_URL environment variable support configured for both sites
- ✅ Cross-site navigation links functional
- ✅ Both sites build successfully: `npm run build` succeeds for both
- ✅ Both sites display Mittwald blue primary color, logo in header

---

## Context & Constraints

**Prerequisites**: None (foundational work package)

**Related Documents**:
- Spec: `/Users/robert/Code/mittwald-mcp/kitty-specs/016-mittwald-mcp-documentation/spec.md`
- Plan: `/Users/robert/Code/mittwald-mcp/kitty-specs/016-mittwald-mcp-documentation/plan.md`
- Research: `/Users/robert/Code/mittwald-mcp/kitty-specs/016-mittwald-mcp-documentation/research.md`

**Architectural Decisions**:
- **Two independent Starlight projects** (not a monorepo with shared config)
- **Starlight framework**: Astro's official documentation theme (research confirmed as optimal choice)
- **Mittwald branding**: Blue primary color, modern sans-serif typography, logo from mittwald.de
- **BASE_URL support**: Sites must be deployable at any base path (/docs, /mcp-docs, etc.)

**Constraints**:
- Use Starlight defaults where possible (don't over-customize)
- CSS custom properties for branding (don't fork Starlight theme)
- Must support build-time BASE_URL configuration

---

## Subtasks & Detailed Guidance

### Subtask T001 – Initialize Site 1 (Setup + Guides)

**Purpose**: Create the first Starlight project for OAuth guides, explainers, and case studies.

**Steps**:

1. **Navigate to repository root**:
   ```bash
   cd /Users/robert/Code/mittwald-mcp
   ```

2. **Create docs directory** (if it doesn't exist):
   ```bash
   mkdir -p docs
   ```

3. **Initialize Starlight project** for Site 1:
   ```bash
   cd docs
   npm create astro@latest setup-and-guides -- --template starlight --yes
   ```

   This creates:
   - `docs/setup-and-guides/package.json`
   - `docs/setup-and-guides/astro.config.mjs`
   - `docs/setup-and-guides/src/content/docs/` (content directory)
   - `docs/setup-and-guides/tsconfig.json`

4. **Install dependencies**:
   ```bash
   cd setup-and-guides
   npm install
   ```

5. **Create folder structure**:
   ```bash
   mkdir -p src/content/docs/getting-started
   mkdir -p src/content/docs/explainers
   mkdir -p src/content/docs/case-studies
   mkdir -p src/assets
   ```

6. **Update `astro.config.mjs`** to configure Starlight:
   ```javascript
   import { defineConfig } from 'astro/config';
   import starlight from '@astrojs/starlight';

   const baseUrl = process.env.BASE_URL || '/';

   export default defineConfig({
     base: baseUrl,
     integrations: [
       starlight({
         title: 'Mittwald MCP - Setup & Guides',
         description: 'Getting started with Mittwald MCP and agentic coding',
         social: {
           github: 'https://github.com/mittwald/mittwald-mcp',
         },
         sidebar: [
           {
             label: 'Home',
             link: '/',
           },
           {
             label: 'Getting Started',
             items: [
               { label: 'Overview', link: '/getting-started/' },
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
         ],
       }),
     ],
   });
   ```

7. **Create home page** (`src/content/docs/index.md`):
   ```markdown
   ---
   title: Welcome to Mittwald MCP
   description: Documentation for Mittwald Model Context Protocol
   ---

   # Welcome to Mittwald MCP Documentation

   This documentation helps you integrate Mittwald MCP with your agentic coding tools.

   ## Quick Links

   - [Getting Started](/getting-started/) - OAuth setup for your tool
   - [Learn](/explainers/) - Understand MCP and agentic coding
   - [Examples](/case-studies/) - Real-world use cases
   - [Reference](https://reference-site-url) - Complete tool documentation

   ## What is Mittwald MCP?

   Mittwald MCP enables developers to use AI assistants (like Claude Code, Cursor, and GitHub Copilot) to manage Mittwald hosting infrastructure through natural language.
   ```

8. **Test the site**:
   ```bash
   npm run dev
   ```

   - Visit http://localhost:4321
   - Verify: Site loads, navigation works, home page displays

**Files**:
- `docs/setup-and-guides/package.json` (new)
- `docs/setup-and-guides/astro.config.mjs` (new)
- `docs/setup-and-guides/src/content/docs/index.md` (new)
- `docs/setup-and-guides/tsconfig.json` (new)

**Parallel?**: No (foundational work)

**Notes**:
- Starlight creates a basic setup; we'll enhance it in later subtasks
- BASE_URL support is configured but not yet tested (happens in T004)

---

### Subtask T002 – Initialize Site 2 (Reference)

**Purpose**: Create the second Starlight project for auto-generated tool reference documentation.

**Steps**:

1. **Navigate to docs directory**:
   ```bash
   cd /Users/robert/Code/mittwald-mcp/docs
   ```

2. **Initialize Starlight project** for Site 2:
   ```bash
   npm create astro@latest reference -- --template starlight --yes
   ```

3. **Install dependencies**:
   ```bash
   cd reference
   npm install
   ```

4. **Create folder structure**:
   ```bash
   mkdir -p src/content/docs/tools
   mkdir -p src/assets
   mkdir -p scripts
   ```

   The `scripts/` folder will hold auto-generation scripts (WP07-WP08).

5. **Update `astro.config.mjs`** to configure Starlight:
   ```javascript
   import { defineConfig } from 'astro/config';
   import starlight from '@astrojs/starlight';

   const baseUrl = process.env.BASE_URL || '/';

   export default defineConfig({
     base: baseUrl,
     integrations: [
       starlight({
         title: 'Mittwald MCP - Tool Reference',
         description: 'Complete reference for all 115 Mittwald MCP tools',
         social: {
           github: 'https://github.com/mittwald/mittwald-mcp',
         },
         sidebar: [
           {
             label: 'Home',
             link: '/',
           },
           {
             label: 'Tools by Domain',
             autogenerate: { directory: 'tools' },
           },
         ],
       }),
     ],
   });
   ```

   **Note**: `autogenerate` will automatically create navigation from the `tools/` folder structure (created in WP07-WP08).

6. **Create home page** (`src/content/docs/index.md`):
   ```markdown
   ---
   title: Mittwald MCP Tool Reference
   description: Complete reference documentation for all 115 Mittwald MCP tools
   ---

   # Mittwald MCP Tool Reference

   This reference documents all 115 tools available in the Mittwald MCP server, organized by domain.

   ## Tools by Domain

   - [Apps](/tools/apps/) - Application management (8 tools)
   - [Backups](/tools/backups/) - Backup operations (8 tools)
   - [Certificates](/tools/certificates/) - SSL certificates (1 tool)
   - [Containers](/tools/containers/) - Docker stacks (10 tools)
   - [Context](/tools/context/) - Session context (3 tools)
   - [Databases](/tools/databases/) - MySQL and Redis (14 tools)
   - [Domains & Mail](/tools/domains-mail/) - DNS, email (22 tools)
   - [Identity](/tools/identity/) - Users, tokens, SSH keys (13 tools)
   - [Miscellaneous](/tools/misc/) - Support (5 tools)
   - [Organization](/tools/organization/) - Org management (7 tools)
   - [Projects & Servers](/tools/project-foundation/) - Projects (12 tools)
   - [SFTP](/tools/sftp/) - SFTP users (2 tools)
   - [SSH](/tools/ssh/) - SSH users (4 tools)
   - [Automation](/tools/automation/) - Cron jobs (9 tools)

   **Total**: 115 tools across 14 domains

   ## Back to Setup Guides

   [Return to Setup & Guides](https://setup-guides-url) for OAuth setup and case studies.
   ```

7. **Test the site**:
   ```bash
   npm run dev
   ```

   - Visit http://localhost:4321
   - Verify: Site loads, home page displays

**Files**:
- `docs/reference/package.json` (new)
- `docs/reference/astro.config.mjs` (new)
- `docs/reference/src/content/docs/index.md` (new)
- `docs/reference/scripts/` (empty directory, for WP07)

**Parallel?**: Can run in parallel with T001 (if multiple agents available)

**Notes**:
- Tool pages will be auto-generated in WP07-WP08
- Navigation will populate automatically once tool pages exist

---

### Subtask T003 – Extract and Integrate Mittwald Branding

**Purpose**: Apply Mittwald branding (logo, colors) consistently across both sites.

**Steps**:

1. **Extract Mittwald branding from mittwald.de**:

   Visit https://mittwald.de in a browser and extract:
   - **Primary color**: Mittwald blue (approximate hex: `#0066cc` or use color picker)
   - **Logo**: Download SVG logo (right-click on logo, save as `mittwald-logo.svg`)

   Alternative: Use placeholder color `#0066cc` and create a simple SVG logo if extraction is difficult.

2. **Create Mittwald color CSS** for **Site 1**:

   File: `docs/setup-and-guides/src/assets/mittwald-colors.css`
   ```css
   :root {
     /* Mittwald branding colors */
     --mittwald-blue: #0066cc;
     --mittwald-blue-dark: #004499;
     --mittwald-blue-light: #3399ff;

     /* Override Starlight theme colors */
     --sl-color-accent-high: var(--mittwald-blue);
     --sl-color-accent-low: var(--mittwald-blue-light);
     --sl-color-accent: var(--mittwald-blue);
   }
   ```

3. **Create Mittwald color CSS** for **Site 2** (same content):

   File: `docs/reference/src/assets/mittwald-colors.css`
   ```css
   /* Same CSS as Site 1 */
   :root {
     --mittwald-blue: #0066cc;
     --mittwald-blue-dark: #004499;
     --mittwald-blue-light: #3399ff;

     --sl-color-accent-high: var(--mittwald-blue);
     --sl-color-accent-low: var(--mittwald-blue-light);
     --sl-color-accent: var(--mittwald-blue);
   }
   ```

4. **Add Mittwald logo** to **Site 1**:

   - Copy `mittwald-logo.svg` to `docs/setup-and-guides/src/assets/mittwald-logo.svg`

5. **Add Mittwald logo** to **Site 2**:

   - Copy `mittwald-logo.svg` to `docs/reference/src/assets/mittwald-logo.svg`

6. **Update Site 1 `astro.config.mjs`** to use branding:

   Add logo and custom CSS:
   ```javascript
   starlight({
     title: 'Mittwald MCP - Setup & Guides',
     description: 'Getting started with Mittwald MCP and agentic coding',
     logo: {
       src: './src/assets/mittwald-logo.svg',
       alt: 'Mittwald Logo',
     },
     customCss: [
       './src/assets/mittwald-colors.css',
     ],
     // ... rest of config
   })
   ```

7. **Update Site 2 `astro.config.mjs`** to use branding:

   Add logo and custom CSS:
   ```javascript
   starlight({
     title: 'Mittwald MCP - Tool Reference',
     description: 'Complete reference for all 115 Mittwald MCP tools',
     logo: {
       src: './src/assets/mittwald-logo.svg',
       alt: 'Mittwald Logo',
     },
     customCss: [
       './src/assets/mittwald-colors.css',
     ],
     // ... rest of config
   })
   ```

8. **Test branding on both sites**:
   ```bash
   # Site 1
   cd docs/setup-and-guides
   npm run dev
   # Visit http://localhost:4321 - verify logo and blue colors

   # Site 2
   cd docs/reference
   npm run dev
   # Visit http://localhost:4321 - verify logo and blue colors
   ```

**Files**:
- `docs/setup-and-guides/src/assets/mittwald-logo.svg` (new)
- `docs/setup-and-guides/src/assets/mittwald-colors.css` (new)
- `docs/reference/src/assets/mittwald-logo.svg` (new)
- `docs/reference/src/assets/mittwald-colors.css` (new)
- `docs/setup-and-guides/astro.config.mjs` (updated)
- `docs/reference/astro.config.mjs` (updated)

**Parallel?**: No (depends on T001, T002)

**Notes**:
- If logo extraction is difficult, use a placeholder SVG with "Mittwald" text
- Color accuracy: Use color picker on mittwald.de for exact hex value
- CSS custom properties override Starlight theme without forking

---

### Subtask T004 – Configure BASE_URL Support and Cross-Site Navigation

**Purpose**: Enable flexible deployment by supporting configurable BASE_URL and linking both sites.

**Steps**:

1. **Verify BASE_URL configuration** in `astro.config.mjs` (already added in T001, T002):

   Both sites should have:
   ```javascript
   const baseUrl = process.env.BASE_URL || '/';

   export default defineConfig({
     base: baseUrl,
     // ... rest of config
   });
   ```

2. **Add cross-site navigation link to Site 1**:

   Update `docs/setup-and-guides/astro.config.mjs` sidebar:
   ```javascript
   sidebar: [
     // ... existing items
     {
       label: 'Tool Reference',
       link: process.env.REFERENCE_SITE_URL || 'https://reference.mittwald.mcp',
     },
   ]
   ```

3. **Add cross-site navigation link to Site 2**:

   Update `docs/reference/astro.config.mjs` sidebar:
   ```javascript
   sidebar: [
     // ... existing items
     {
       label: 'Back to Setup Guides',
       link: process.env.SETUP_SITE_URL || 'https://setup.mittwald.mcp',
     },
   ]
   ```

4. **Test BASE_URL configuration with multiple values**:

   **Test 1 - Default (root path)**:
   ```bash
   cd docs/setup-and-guides
   npm run build
   # Check dist/ - links should be relative to /
   ```

   **Test 2 - /docs path**:
   ```bash
   BASE_URL=/docs npm run build
   # Check dist/ - links should be relative to /docs
   ```

   **Test 3 - /mcp-docs path**:
   ```bash
   BASE_URL=/mcp-docs npm run build
   # Check dist/ - links should be relative to /mcp-docs
   ```

   Repeat for Site 2 (`docs/reference`).

5. **Verify cross-site links** (manual inspection):

   Open `dist/index.html` and verify navigation links use correct BASE_URL prefix.

6. **Document BASE_URL usage** in README:

   Create `docs/setup-and-guides/README.md`:
   ```markdown
   # Mittwald MCP Setup & Guides Site

   ## Build Instructions

   ### Development
   ```bash
   npm run dev
   ```

   ### Production Build

   **Default (root path)**:
   ```bash
   npm run build
   ```

   **Custom base URL**:
   ```bash
   BASE_URL=/docs npm run build
   # or
   BASE_URL=/mcp-docs npm run build
   ```

   ### Cross-Site Links

   Set environment variables for cross-site navigation:
   ```bash
   REFERENCE_SITE_URL=https://reference.mittwald.mcp npm run build
   ```
   ```

   Create similar README for Site 2.

**Files**:
- `docs/setup-and-guides/astro.config.mjs` (updated)
- `docs/reference/astro.config.mjs` (updated)
- `docs/setup-and-guides/README.md` (new)
- `docs/reference/README.md` (new)

**Parallel?**: No (depends on T001, T002, T003)

**Notes**:
- BASE_URL support enables deployment to any path (e.g., GitHub Pages subfolder)
- Cross-site links may be relative or absolute depending on deployment
- Environment variables allow flexible configuration at build time

---

## Test Strategy

**Manual Testing**:

1. **Build both sites successfully**:
   ```bash
   cd docs/setup-and-guides && npm run build
   cd docs/reference && npm run build
   ```

   - ✅ Both builds complete without errors
   - ✅ No warnings or deprecation notices

2. **Verify branding on both sites**:
   ```bash
   # Site 1
   cd docs/setup-and-guides && npm run dev
   # Visit http://localhost:4321

   # Site 2
   cd docs/reference && npm run dev
   # Visit http://localhost:4321
   ```

   - ✅ Mittwald logo appears in header
   - ✅ Primary color is Mittwald blue (links, buttons)
   - ✅ Navigation works

3. **Test BASE_URL with multiple values**:
   ```bash
   # Site 1
   cd docs/setup-and-guides
   BASE_URL=/docs npm run build
   BASE_URL=/mcp-docs npm run build

   # Site 2
   cd docs/reference
   BASE_URL=/docs npm run build
   BASE_URL=/mcp-docs npm run build
   ```

   - ✅ All builds succeed
   - ✅ Links in `dist/` use correct BASE_URL prefix

---

## Risks & Mitigations

**Risk 1: Starlight theme customization may conflict with branding**
- **Mitigation**: Use CSS custom properties to override Starlight defaults; avoid forking theme
- **Testing**: Visual inspection after applying CSS

**Risk 2: BASE_URL configuration may break links**
- **Mitigation**: Test with multiple BASE_URL values; verify cross-site links
- **Testing**: Manual link verification in built output

**Risk 3: Mittwald logo extraction may be difficult**
- **Mitigation**: Use placeholder logo if needed; can refine later
- **Fallback**: Create simple SVG with "Mittwald" text

**Risk 4: Cross-site navigation may not work if sites are deployed to different domains**
- **Mitigation**: Use environment variables for cross-site URLs; document in README
- **Testing**: Verify links work in different deployment scenarios

---

## Review Guidance

**Key Checkpoints**:

1. **Both sites initialize and build successfully**:
   - `npm run build` succeeds for both sites
   - No errors or critical warnings

2. **Branding is consistent and correct**:
   - Logo appears in header on both sites
   - Primary color is Mittwald blue (approximately `#0066cc`)
   - Colors match across both sites

3. **BASE_URL configuration works**:
   - Sites build with multiple BASE_URL values
   - Links in built output use correct BASE_URL prefix

4. **Cross-site navigation is configured**:
   - Links from Site 1 to Site 2 exist in navigation
   - Links from Site 2 to Site 1 exist in navigation

5. **Documentation is clear**:
   - READMEs explain how to build with BASE_URL
   - Build instructions are complete

**Verification Commands**:
```bash
# Build both sites
cd docs/setup-and-guides && npm run build && cd ../reference && npm run build

# Test BASE_URL
cd docs/setup-and-guides && BASE_URL=/docs npm run build
cd docs/reference && BASE_URL=/docs npm run build
```

**Expected Output**:
- Both sites build successfully
- Mittwald branding visible on both sites
- Navigation includes cross-site links

---

## Implementation Command

To implement this work package:

```bash
spec-kitty implement WP01
```

*(No dependencies, so no `--base` flag needed)*

---

## Activity Log

> Entries MUST be in chronological order (oldest first, newest last).

*[Activity log will be populated during implementation and review]*
- 2026-01-23T10:20:22Z – claude – shell_pid=90387 – lane=doing – Started implementation via workflow command
- 2026-01-23T10:24:09Z – claude – shell_pid=90387 – lane=for_review – Ready for review: Successfully initialized both Astro Starlight documentation sites with Mittwald branding, BASE_URL support, cross-site navigation links, and verified builds. All 4 subtasks (T001-T004) completed and tested.
- 2026-01-23T10:47:08Z – claude-code – shell_pid=8585 – lane=doing – Started review via workflow command
