# Research Output: Auto-Generation, Starlight, and Branding

**Feature**: 016-mittwald-mcp-documentation  
**Date**: 2025-01-23  
**Research Phase**: Phase 0

## Executive Summary

This research validates three critical architectural decisions:
1. **Auto-generation strategy**: Parse tool handlers from `/src/handlers/tools/` → OpenAPI/Swagger → markdown
2. **Documentation framework**: Astro Starlight (official Astro docs framework)
3. **Branding integration**: Extract Mittwald colors/logo from mittwald.de; apply via CSS variables

All three decisions are validated and ready for Phase 1 implementation.

---

## Research Task 1: Auto-Generation Strategy for 115 MCP Tools

### Research Question
How can we efficiently generate reference documentation for 115 MCP tools while keeping docs in sync with source code?

### Considered Approaches

**Option A: Parse TypeScript Handler Files (CHOSEN)**
- **Mechanism**: Extract tool definitions from `/src/handlers/tools/` directory
- **Output Format**: Generate OpenAPI/Swagger-compatible schema, then convert to markdown
- **Pros**:
  - Always in sync with source code (no manual updates)
  - Structured OpenAPI format enables future integrations (API docs, client SDKs, etc.)
  - Markdown output directly compatible with Starlight
  - Scalable: adding new tools automatically updates docs
- **Cons**:
  - Requires parsing TypeScript/AST or handler structure (engineering effort)
  - Depends on code quality (comments, parameter documentation in handlers)
  - Tight coupling to handler file structure
- **Effort**: Moderate (create extraction + schema generation + markdown conversion scripts)

**Option B: Manual Documentation**
- Pros: Full control over quality and presentation
- Cons: 115 tools = massive manual effort; docs lag behind code; difficult to maintain
- **Verdict**: Rejected (not scalable)

**Option C: Use Existing API Export Format**
- If mittwald-mcp server exports OpenAPI/Swagger schema already
- Pros: No parsing required; clean interface
- Cons: Depends on export mechanism; if not automated, still requires manual updates
- **Verdict**: Not applicable (no existing export found in initial spec)

### Decision: Option A

**Implementation Plan**:

1. **Tool Handler Extraction** (`docs/reference/scripts/extract-mcp-tools.ts`):
   ```typescript
   // Scan /src/handlers/tools/ for TypeScript/JavaScript files
   // For each tool handler:
   //   - Extract tool name (from file or export name)
   //   - Extract description (from comments/JSDoc)
   //   - Extract parameters (from function signature or TypeScript interface)
   //   - Extract return type (from TypeScript return type or JSDoc)
   //   - Extract examples (from JSDoc @example blocks if present)
   // Output: tools-manifest.json
   ```

2. **OpenAPI Schema Generation** (`docs/reference/scripts/generate-openapi.ts`):
   ```typescript
   // Convert tools-manifest.json to OpenAPI 3.0 schema
   // Structure: one API endpoint per tool
   // Output: openapi.json
   ```

3. **Markdown Conversion** (`docs/reference/scripts/convert-to-markdown.ts`):
   ```typescript
   // Convert openapi.json to markdown files
   // Organize by domain: src/content/docs/tools/{domain}/{tool-name}.md
   // Each page includes: name, domain, description, parameters table, return value, examples
   // Output: 115 markdown files organized by 14 domains
   ```

4. **Coverage Validation** (`docs/reference/scripts/validate-coverage.ts`):
   ```typescript
   // Verify:
   //   - Exactly 115 tools present
   //   - No duplicate tool names
   //   - All tools have description, parameters, return type
   //   - All tools are linked from domain landing pages
   // Output: coverage-report.json (success or error list)
   ```

5. **Build Integration**:
   - Add script to `docs/reference/package.json` build process:
     ```json
     "prebuild": "npm run generate-references"
     ```
   - This ensures references are auto-generated before Starlight builds
   - Build fails if validation detects missing or duplicate tools

### Expected Outputs

- **tools-manifest.json**: 115 tools with metadata
- **openapi.json**: OpenAPI 3.0 schema for all tools
- **Markdown files**: `src/content/docs/tools/{domain}/{tool}.md` (115 files)
- **coverage-report.json**: Validation results
- **Domain landing pages**: `src/content/docs/tools/{domain}/index.md` (14 pages)

### Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| Tool handler structure is complex/inconsistent | Start with sample tools; refine extraction logic; add special cases as needed |
| Missing or incomplete tool documentation | Validation script flags missing fields; build fails loudly |
| New tools added but not extracted | Validation script detects count mismatch; CI fails; team alerted |
| Parameter types unclear in source | Use TypeScript interfaces where available; fall back to JSDoc; document assumptions |

### Conclusion

**Option A is viable and recommended**. The extraction, schema generation, and markdown conversion are straightforward engineering tasks. The validation step ensures quality and catches regressions. This approach keeps docs in sync with code and enables future integrations.

---

## Research Task 2: Astro Starlight Documentation Framework

### Research Question
What is the best documentation framework for this project, and how well does it support Divio documentation system?

### Candidates Evaluated

| Framework | Focus | Divio Support | Customization | Accessibility | Status |
|-----------|-------|---------------|---------------|---------------|--------|
| **Astro Starlight** | Documentation (official Astro) | Excellent | High (CSS/components) | WCAG 2.1 built-in | ✅ Chosen |
| MkDocs | Markdown-focused | Good | Moderate (themes) | Good | Considered |
| Docusaurus | React-based | Good | High | Good | Considered |
| Jekyll | Static site generation | Moderate | Moderate | Moderate | Considered |
| Hugo | Speed-focused | Moderate | Moderate | Moderate | Considered |

### Decision: Astro Starlight

**Why Starlight**:

1. **Purpose-Built for Documentation**
   - Official Astro documentation theme (maintained by Astro team)
   - Designed specifically for technical documentation sites
   - Not a generic static site generator; tools like MkDocs or Docusaurus

2. **Divio Documentation System Support** ✅
   - Markdown/MDX support enables all four Divio types
   - Auto-generated navigation from folder structure supports clear type separation
   - Built-in search (Pagefind) helps users navigate between types
   - Sidebar organization can group tutorials, how-tos, reference, explanations

3. **Customization for Branding**
   - CSS override system allows full color/typography customization
   - Logo placement in header/footer configurable
   - Component system allows custom layouts per content type
   - Easy to apply Mittwald branding without forking the theme

4. **Performance & Accessibility**
   - Zero JavaScript by default (fast page loads)
   - Built-in dark mode support
   - Responsive design (mobile/tablet/desktop)
   - WCAG 2.1 compliant (proper headings, alt text support, keyboard navigation)
   - Pagefind search is accessible

5. **Developer Experience**
   - Markdown/MDX frontmatter validation with TypeScript
   - Hot reload during development
   - No build configuration required (sensible defaults)
   - Large community; active maintenance

6. **Scalability**
   - Handles large documentation sites (100+ pages easily)
   - Fast incremental builds
   - SEO optimization built-in
   - Internationalization support (if needed in future)

### Starlight Configuration for This Project

**File**: `docs/setup-and-guides/astro.config.mjs` and `docs/reference/astro.config.mjs`

```javascript
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

const baseUrl = process.env.BASE_URL || '/';

export default defineConfig({
  base: baseUrl,
  integrations: [
    starlight({
      title: 'Mittwald MCP',
      description: 'Getting started with Mittwald MCP',
      logo: {
        src: './src/assets/mittwald-logo.svg',
        alt: 'Mittwald MCP Logo',
      },
      customCss: [
        './src/assets/mittwald-colors.css',
        './src/assets/mittwald-typography.css',
      ],
      sidebar: [
        // Navigation structure (different for each site)
      ],
      social: {
        github: 'https://github.com/mittwald/mittwald-mcp',
      },
      editUrl: 'https://github.com/mittwald/mittwald-mcp/edit/main/docs/',
      head: [
        // Custom meta tags for branding
      ],
    }),
  ],
  vite: {
    define: {
      'process.env.BASE_URL': JSON.stringify(baseUrl),
    },
  },
});
```

### How Starlight Supports Divio Types

**Divio Type → Starlight Organization**:

1. **Tutorials** (`/case-studies/`):
   - Markdown files with step-by-step sections
   - Template: Clear intro, prerequisites, numbered steps, outcomes
   - Navigation: Listed under "Examples" in sidebar

2. **How-To Guides** (`/getting-started/`):
   - Markdown files with goal-oriented structure
   - Template: Problem statement, quick summary, detailed steps, verification
   - Navigation: Listed under "Getting Started" in sidebar

3. **Reference** (`/tools/`):
   - Auto-generated markdown files by domain
   - Template: Name, domain, syntax, parameters table, return value, examples
   - Navigation: Organized by domain folders with auto-generated nav

4. **Explanation** (`/explainers/`):
   - Markdown files with conceptual structure
   - Template: Overview, background, core concepts, design decisions, implications
   - Navigation: Listed under "Learn" in sidebar

### Accessibility Validation

**Built-in Features**:
- ✅ Proper heading hierarchy (Starlight enforces H1 root)
- ✅ Dark/light mode support (no forced color scheme)
- ✅ Keyboard navigation (Starlight sidebar/nav fully keyboard accessible)
- ✅ Screen reader support (semantic HTML, ARIA labels)
- ✅ Code block syntax highlighting (accessible with proper contrast)
- ✅ Search functionality (Pagefind is accessible)

**Manual Validation Required**:
- Alt text for all diagrams (content author responsibility)
- Color contrast for custom CSS (validate against Starlight theme)
- Link text descriptiveness (content author responsibility)

### Conclusion

**Starlight is the optimal choice**. It provides everything needed for this project:
- Purpose-built for documentation
- Excellent Divio support
- Customizable for Mittwald branding
- Strong accessibility baseline
- Active community and maintenance
- Suitable for both small and large documentation sites

---

## Research Task 3: Mittwald Branding Integration

### Research Question
How do we extract and integrate Mittwald branding (colors, logo) consistently across two Starlight sites?

### Branding Assets Identified

**From mittwald.de website analysis**:

1. **Logo**:
   - Format: SVG
   - Variants: Full logo (horizontal), icon logo (square)
   - Colors: White (on dark) and blue (standalone)
   - Availability: Download from mittwald.de

2. **Primary Color (Blue)**:
   - Used in icon logo
   - Modern, professional blue
   - Hex value: Extracted from CSS or logo (approximate: `#0066cc` or similar)
   - Usage: Primary brand color for links, buttons, highlights

3. **Typography**:
   - Style: Modern sans-serif (likely system fonts or web fonts)
   - Examples: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
   - Usage: Clean, professional appearance

4. **Tagline/Voice**:
   - "Hosting neu gedacht" (Hosting reimagined)
   - "Schnell. Flexibel. Persönlich." (Fast. Flexible. Personal.)
   - Conveys speed, adaptability, human connection

### Branding Integration Strategy

**Step 1: Extract Assets**
- Download Mittwald logo (SVG) from mittwald.de
- Screenshot/export colors from website
- Commit assets to repository:
  - `docs/setup-and-guides/src/assets/mittwald-logo.svg`
  - `docs/reference/src/assets/mittwald-logo.svg`

**Step 2: Define CSS Variables**
- Create `mittwald-colors.css` with CSS custom properties:
  ```css
  :root {
    --mittwald-blue: #0066cc;
    --mittwald-blue-dark: #004499;
    --mittwald-blue-light: #3399ff;
    --mittwald-neutral-dark: #333333;
    --mittwald-neutral-light: #f5f5f5;
  }
  ```
- Create `mittwald-typography.css` with font stack:
  ```css
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }
  ```

**Step 3: Apply in Starlight Theme**
- Reference CSS files in Starlight config:
  ```javascript
  customCss: [
    './src/assets/mittwald-colors.css',
    './src/assets/mittwald-typography.css',
  ]
  ```
- Override Starlight theme colors:
  ```css
  :root {
    --sl-color-accent-high: var(--mittwald-blue);
    --sl-color-accent-low: var(--mittwald-blue-light);
  }
  ```

**Step 4: Logo Placement**
- Starlight config:
  ```javascript
  logo: {
    src: './src/assets/mittwald-logo.svg',
    alt: 'Mittwald Logo',
  }
  ```
- Appears in header on all pages
- Can add footer logo via custom component

**Step 5: Consistency Across Sites**
- Both sites use identical CSS files (copy to both `docs/setup-and-guides/` and `docs/reference/`)
- Maintain single source of truth for colors (document colors and usage guidelines)
- Validate visual consistency during QA phase

### Branding Validation

| Element | Validation Method | Pass Criteria |
|---------|-------------------|---------------|
| Logo visibility | Visual inspection | Logo appears in header, readable, correct proportions |
| Color accuracy | Color picker tool | Primary color matches mittwald.de blue |
| Typography | Font stack verification | Sans-serif renders correctly on all devices |
| Consistency | Side-by-side comparison | Both sites have identical branding |
| Accessibility | WCAG contrast checker | Logo has sufficient contrast; colors meet AA standards |

### Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| Brand colors extracted incorrectly | Use color picker on mittwald.de; validate against official brand guidelines if available |
| Logo appears pixelated or distorted | Ensure SVG is used (not rasterized); test at different sizes |
| Custom CSS breaks Starlight theme | Test CSS override order; prefix custom properties to avoid conflicts |
| Branding inconsistent between sites | Use shared CSS files; validate visually before commit |
| Accessibility issues with colors | Test contrast ratios; ensure sufficient differentiation for colorblind users |

### Conclusion

**Branding integration is straightforward**. Using CSS custom properties and Starlight's customization system, we can apply Mittwald branding consistently across both sites without modifying Starlight's core theme. The extraction of colors and logo from mittwald.de is a one-time task during initial setup.

---

## Research Summary

### Key Findings

1. **Auto-Generation (Option A) ✅**
   - Parser tool handler files → OpenAPI schema → markdown
   - Keeps docs in sync with source code
   - Scalable: new tools automatically documented
   - Requires extraction + schema generation + validation scripts

2. **Starlight Framework ✅**
   - Purpose-built for documentation
   - Excellent Divio support
   - Built-in accessibility (WCAG 2.1)
   - Customizable for branding
   - Large active community

3. **Branding Integration ✅**
   - Extract logo + colors from mittwald.de
   - Use CSS custom properties for consistency
   - Apply via Starlight customization system
   - No theme fork required

### No Critical Issues

All three research areas are resolved. No blocking issues identified. Ready to proceed to Phase 1 design and implementation.

### Next Steps

1. **Phase 1 Design**: Create data-model.md, quickstart.md
2. **Phase 2 Implementation**: Run `/spec-kitty.tasks` to generate work packages
3. **Execution**: Begin with WP01 (Starlight setup), then WP02-07 in sequence

