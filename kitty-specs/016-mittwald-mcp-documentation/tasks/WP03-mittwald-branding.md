---
work_package_id: WP03
title: Extract and Integrate Mittwald Branding
lane: "doing"
dependencies: []
subtasks:
- T003
phase: Phase A - Infrastructure & Setup
assignee: ''
agent: "claude"
shell_pid: "97768"
review_status: ''
reviewed_by: ''
history:
- timestamp: '2025-01-23T00:00:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
---

# Work Package Prompt: WP03 – Extract and Integrate Mittwald Branding

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

**Goal**: Extract Mittwald branding assets (logo, colors) from mittwald.de and apply them consistently to both documentation sites.

**Success Criteria**:
- ✅ Mittwald logo (SVG) extracted and committed to both sites
- ✅ Mittwald brand colors extracted and documented
- ✅ CSS custom properties created with brand colors
- ✅ Both sites display Mittwald logo in header
- ✅ Both sites use Mittwald blue as primary accent color
- ✅ Branding is visually consistent across both sites
- ✅ Typography uses modern sans-serif fonts
- ✅ Both sites build successfully with branding applied

---

## Context & Constraints

**Prerequisites**: WP01 (Site 1) and WP02 (Site 2) must be complete - both Starlight projects must exist before applying branding.

**Related Documents**:
- Research: `/Users/robert/Code/mittwald-mcp/kitty-specs/016-mittwald-mcp-documentation/research.md` (Section: "Mittwald Branding Integration")
- Plan: `/Users/robert/Code/mittwald-mcp/kitty-specs/016-mittwald-mcp-documentation/plan.md`

**Architectural Context**:
- **Mittwald branding** identified in research phase:
  - Primary color: Mittwald Blue (approximate `#0066cc`)
  - Logo: Available as SVG from mittwald.de
  - Typography: Modern sans-serif (system fonts)
  - Brand values: Fast. Flexible. Personal.
  - Tagline: "Hosting neu gedacht" (Hosting reimagined)

**Why branding matters**:
- Establishes visual connection to Mittwald brand
- Builds trust with Mittwald customers
- Provides professional, polished appearance
- Ensures consistency across all documentation

**Constraints**:
- Use CSS custom properties (no theme forking)
- Apply branding via Starlight's customization system
- Keep branding assets in version control (commit SVG, CSS)
- Ensure branding works with both light and dark modes

---

## Subtasks & Detailed Guidance

### Subtask T003 – Extract and Integrate Mittwald Branding

**Purpose**: Extract branding assets from mittwald.de and apply them to both documentation sites using CSS custom properties and Starlight configuration.

**Steps**:

#### Part 1: Extract Branding Assets from mittwald.de

1. **Visit mittwald.de to extract branding information**:

   Open https://mittwald.de in a browser.

2. **Extract primary brand color**:

   **Method 1 - Browser DevTools**:
   - Right-click on a blue element (logo, button, link)
   - Select "Inspect"
   - Look for `color` or `background-color` in Styles panel
   - Note the hex value

   **Method 2 - Color Picker Extension**:
   - Install a color picker browser extension
   - Click on blue elements to extract hex value

   **Expected result**: Mittwald blue is approximately `#0066cc` or similar

   **Document the colors**:
   ```
   Primary Blue: #0066cc (or extracted value)
   Primary Blue Dark: #004499 (for hover states)
   Primary Blue Light: #3399ff (for backgrounds)
   ```

3. **Extract Mittwald logo**:

   **Method 1 - Direct download**:
   - Right-click on Mittwald logo on homepage
   - Select "Save Image As..."
   - Save as `mittwald-logo.svg`

   **Method 2 - Inspect and extract SVG**:
   - Right-click logo, select "Inspect"
   - If logo is `` `<svg>` ``, copy the entire SVG code
   - Save to file `mittwald-logo.svg`

   **Method 3 - Fallback (create placeholder)**:
   If extraction fails, create a simple placeholder SVG:
   ```xml
   <svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40">
     <text x="10" y="25" font-family="sans-serif" font-size="20" fill="#0066cc">mittwald</text>
   </svg>
   ```

4. **Extract typography information**:

   - Inspect heading and body text on mittwald.de
   - Note font families used

   **Expected**: Modern sans-serif fonts, likely system font stack:
   ```css
   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
   ```

#### Part 2: Create CSS Custom Properties

5. **Create branding CSS for Site 1**:

   File: `docs/setup-and-guides/src/assets/mittwald-colors.css`

   ```css
   /**
    * Mittwald Branding - Colors
    * Extracted from: https://mittwald.de
    * Date: 2025-01-23
    */

   :root {
     /* Mittwald Brand Colors */
     --mittwald-blue: #0066cc;           /* Primary brand color */
     --mittwald-blue-dark: #004499;      /* Hover/active states */
     --mittwald-blue-light: #3399ff;     /* Backgrounds, highlights */

     /* Neutral Colors */
     --mittwald-neutral-dark: #333333;   /* Dark text */
     --mittwald-neutral-medium: #666666; /* Secondary text */
     --mittwald-neutral-light: #f5f5f5;  /* Light backgrounds */

     /* Override Starlight Theme Colors */
     /* Primary accent (links, buttons, highlights) */
     --sl-color-accent-high: var(--mittwald-blue);
     --sl-color-accent: var(--mittwald-blue);
     --sl-color-accent-low: var(--mittwald-blue-light);

     /* Hover states */
     --sl-color-accent-hover: var(--mittwald-blue-dark);
   }

   /* Dark mode overrides (if needed) */
   @media (prefers-color-scheme: dark) {
     :root {
       /* Adjust colors for dark mode if necessary */
       --mittwald-blue-light: #4da6ff; /* Brighter for dark backgrounds */
     }
   }
   ```

   **Notes**:
   - Comments document color source and usage
   - Uses CSS custom properties for flexibility
   - Overrides Starlight's default accent colors
   - Includes dark mode considerations

6. **Create branding CSS for Site 2**:

   File: `docs/reference/src/assets/mittwald-colors.css`

   **Content**: Exact same as Site 1

   ```bash
   cp docs/setup-and-guides/src/assets/mittwald-colors.css docs/reference/src/assets/
   ```

7. **Create typography CSS for Site 1**:

   File: `docs/setup-and-guides/src/assets/mittwald-typography.css`

   ```css
   /**
    * Mittwald Branding - Typography
    * Based on mittwald.de font stack
    */

   :root {
     /* Override Starlight font families */
     --sl-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
     --sl-font-headings: var(--sl-font);
     --sl-font-mono: 'Monaco', 'Courier New', monospace;
   }

   /* Optional: Fine-tune font weights and sizes if needed */
   body {
     font-family: var(--sl-font);
   }

   h1, h2, h3, h4, h5, h6 {
     font-family: var(--sl-font-headings);
     font-weight: 600;
   }

   code, pre {
     font-family: var(--sl-font-mono);
   }
   ```

8. **Create typography CSS for Site 2**:

   ```bash
   cp docs/setup-and-guides/src/assets/mittwald-typography.css docs/reference/src/assets/
   ```

#### Part 3: Add Logo to Both Sites

9. **Add logo to Site 1**:

   File: `docs/setup-and-guides/src/assets/mittwald-logo.svg`

   **Content**: Extracted SVG from mittwald.de (or placeholder)

10. **Add logo to Site 2**:

    ```bash
    cp docs/setup-and-guides/src/assets/mittwald-logo.svg docs/reference/src/assets/
    ```

#### Part 4: Configure Starlight to Use Branding

11. **Update Site 1 configuration**:

    File: `docs/setup-and-guides/astro.config.mjs`

    Add logo and custom CSS to the Starlight integration:

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
        './src/assets/mittwald-typography.css',
      ],
      social: {
        github: 'https://github.com/mittwald/mittwald-mcp',
      },
      // ... rest of configuration
    })
    ```

    **Changes**:
    - Added `logo` object with path to SVG
    - Added `customCss` array with color and typography CSS

12. **Update Site 2 configuration**:

    File: `docs/reference/astro.config.mjs`

    Add logo and custom CSS (same as Site 1):

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
        './src/assets/mittwald-typography.css',
      ],
      social: {
        github: 'https://github.com/mittwald/mittwald-mcp',
      },
      // ... rest of configuration
    })
    ```

#### Part 5: Test Branding on Both Sites

13. **Test Site 1 branding**:

    ```bash
    cd docs/setup-and-guides
    npm run dev
    ```

    **Manual verification**:
    - Visit http://localhost:4321
    - **Logo**: Check header - Mittwald logo should appear on left side
    - **Color**: Check links - Should be Mittwald blue (`#0066cc` or similar)
    - **Hover**: Hover over links - Should darken to `#004499`
    - **Typography**: Check fonts - Should use modern sans-serif stack

    **Browser DevTools verification**:
    - Open DevTools (F12)
    - Inspect a link element
    - Verify CSS custom properties:
      ```
      --sl-color-accent: #0066cc
      --sl-font: -apple-system, ...
      ```

14. **Test Site 2 branding**:

    ```bash
    cd docs/reference
    npm run dev
    ```

    **Manual verification**: Same as Site 1
    - Logo in header
    - Blue accent color
    - Consistent typography

15. **Test production builds**:

    ```bash
    cd docs/setup-and-guides
    npm run build

    cd docs/reference
    npm run build
    ```

    **Verification**:
    - ✅ Both builds succeed
    - ✅ No CSS errors in build logs
    - ✅ Logo files copied to `dist/_astro/`

16. **Visual consistency check**:

    Open both sites side-by-side:
    - Site 1: http://localhost:4321
    - Site 2: http://localhost:4322 (use different port)

    **Compare**:
    - Logo should look identical
    - Blue accent color should match
    - Typography should match
    - Overall "feel" should be consistent

#### Part 6: Document Branding Assets

17. **Create branding documentation**:

    File: `docs/BRANDING.md`

    ```markdown
    # Mittwald Branding Guidelines for Documentation

    This document describes the branding assets used in the Mittwald MCP documentation sites.

    ## Brand Colors

    ### Primary Color
    - **Mittwald Blue**: `#0066cc`
    - Usage: Links, buttons, primary actions, highlights
    - Accessibility: Meets WCAG AA contrast requirements on white backgrounds

    ### Secondary Colors
    - **Mittwald Blue Dark**: `#004499`
    - Usage: Hover states, active states
    
    - **Mittwald Blue Light**: `#3399ff`
    - Usage: Backgrounds, subtle highlights

    ### Neutral Colors
    - **Dark**: `#333333` (text)
    - **Medium**: `#666666` (secondary text)
    - **Light**: `#f5f5f5` (backgrounds)

    ## Logo

    - **File**: `mittwald-logo.svg`
    - **Format**: SVG (scalable, crisp on all screens)
    - **Locations**:
      - `docs/setup-and-guides/src/assets/mittwald-logo.svg`
      - `docs/reference/src/assets/mittwald-logo.svg`
    - **Usage**: Header logo in Starlight navigation

    ## Typography

    **Font Stack** (system fonts for performance):
    ```css
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif
    ```

    **Font Weights**:
    - Body text: 400 (regular)
    - Headings: 600 (semibold)
    - Bold: 700

    ## Implementation

    Branding is applied via CSS custom properties in:
    - `src/assets/mittwald-colors.css` (color overrides)
    - `src/assets/mittwald-typography.css` (font overrides)

    These files are referenced in `astro.config.mjs`:
    ```javascript
    customCss: [
      './src/assets/mittwald-colors.css',
      './src/assets/mittwald-typography.css',
    ]
    ```

    ## Updating Branding

    To update branding:

    1. **Colors**: Edit `src/assets/mittwald-colors.css` in both sites
    2. **Logo**: Replace `src/assets/mittwald-logo.svg` in both sites
    3. **Typography**: Edit `src/assets/mittwald-typography.css` in both sites

    Always update **both sites** to maintain consistency.

    ## Accessibility

    All branding meets WCAG 2.1 AA standards:
    - Color contrast ratios verified
    - Logo has alt text
    - Links are distinguishable without color alone
    ```

**Files Created/Modified**:
- `docs/setup-and-guides/src/assets/mittwald-colors.css` (new)
- `docs/setup-and-guides/src/assets/mittwald-typography.css` (new)
- `docs/setup-and-guides/src/assets/mittwald-logo.svg` (new)
- `docs/reference/src/assets/mittwald-colors.css` (new)
- `docs/reference/src/assets/mittwald-typography.css` (new)
- `docs/reference/src/assets/mittwald-logo.svg` (new)
- `docs/setup-and-guides/astro.config.mjs` (modified)
- `docs/reference/astro.config.mjs` (modified)
- `docs/BRANDING.md` (new - documentation)

**Parallel?**: No - depends on WP01 and WP02 (sites must exist first)

**Notes**:
- If exact color extraction is difficult, `#0066cc` is a reasonable approximation
- Placeholder logo is acceptable; can be refined later with actual SVG
- CSS custom properties allow easy future updates without theme forking
- Branding assets are committed to version control for consistency

---

## Test Strategy

**Manual Testing**:

1. **Visual inspection - Site 1**:
   ```bash
   cd docs/setup-and-guides
   npm run dev
   ```
   - ✅ Logo visible in header
   - ✅ Links are Mittwald blue
   - ✅ Hover states darken correctly
   - ✅ Typography is modern sans-serif

2. **Visual inspection - Site 2**:
   ```bash
   cd docs/reference
   npm run dev
   ```
   - ✅ Identical logo and colors to Site 1
   - ✅ Consistent branding

3. **DevTools CSS verification**:
   - Inspect element
   - Check computed styles
   - Verify custom properties:
     - `--sl-color-accent: #0066cc`
     - `--sl-font: -apple-system, ...`

4. **Build verification**:
   ```bash
   cd docs/setup-and-guides && npm run build
   cd docs/reference && npm run build
   ```
   - ✅ No CSS errors
   - ✅ Logo copied to `dist/`

5. **Dark mode verification**:
   - Toggle browser to dark mode
   - Verify colors still visible and accessible
   - Check if blue needs adjustment for dark backgrounds

6. **Accessibility check**:
   - Use browser contrast checker
   - Verify Mittwald blue on white meets WCAG AA (4.5:1)
   - Verify logo has alt text

**Automated Testing** (future):
- Visual regression testing with Percy or similar
- Contrast ratio testing with axe-core
- Build smoke tests

---

## Risks & Mitigations

**Risk 1: Logo extraction may fail**
- **Cause**: mittwald.de uses optimized/bundled assets
- **Mitigation**: Use placeholder SVG initially; refine later
- **Fallback**: Create text-based SVG with "Mittwald" in blue

**Risk 2: Extracted color may not match exactly**
- **Cause**: mittwald.de may use multiple shades of blue
- **Mitigation**: Use color picker multiple times; choose most prominent
- **Acceptance**: Approximate match (`#0066cc`) is sufficient

**Risk 3: CSS overrides may not apply correctly**
- **Cause**: Starlight theme specificity may override custom properties
- **Mitigation**: Use `!important` if needed (as last resort)
- **Testing**: Inspect elements to verify CSS is applied

**Risk 4: Branding may look inconsistent between sites**
- **Cause**: Copy/paste errors, different configurations
- **Mitigation**: Use identical CSS files (via copy command)
- **Validation**: Visual side-by-side comparison

**Risk 5: Dark mode may make colors less visible**
- **Cause**: Blue on dark background has lower contrast
- **Mitigation**: Test in dark mode; adjust `--mittwald-blue-light` if needed
- **Testing**: Manual dark mode testing

---

## Review Guidance

**Key Acceptance Criteria**:

1. **Branding assets extracted and documented**:
   - Logo (SVG) committed to both sites
   - Colors documented (hex values, usage)
   - Typography specified

2. **CSS custom properties created**:
   - `mittwald-colors.css` exists in both sites
   - `mittwald-typography.css` exists in both sites
   - CSS overrides Starlight defaults correctly

3. **Starlight configured to use branding**:
   - Logo appears in `astro.config.mjs` for both sites
   - `customCss` array includes color and typography files
   - Alt text provided for logo

4. **Visual verification**:
   - Logo visible in header on both sites
   - Links use Mittwald blue color
   - Hover states darken correctly
   - Typography is consistent

5. **Consistency between sites**:
   - Logo looks identical on both sites
   - Colors match exactly
   - Typography matches

6. **Documentation exists**:
   - `docs/BRANDING.md` explains colors, logo, typography
   - Update process documented

**Verification Commands**:

```bash
# Test Site 1
cd docs/setup-and-guides
npm run dev
# Visit http://localhost:4321, inspect visually

# Test Site 2
cd docs/reference
npm run dev
# Visit http://localhost:4321, inspect visually

# Verify files exist
ls -la docs/setup-and-guides/src/assets/
ls -la docs/reference/src/assets/

# Build both sites
cd docs/setup-and-guides && npm run build
cd docs/reference && npm run build
```

**Review Checklist**:
- [ ] Logo SVG committed to both sites
- [ ] CSS color overrides applied to both sites
- [ ] CSS typography overrides applied to both sites
- [ ] Logo appears in header on both sites
- [ ] Links use Mittwald blue color
- [ ] Colors are consistent between sites
- [ ] Typography is consistent between sites
- [ ] Branding documentation exists (`BRANDING.md`)
- [ ] Both sites build successfully
- [ ] Dark mode tested and acceptable

---

## Implementation Command

To implement this work package:

```bash
spec-kitty implement WP03 --base WP01
```

*(Depends on WP01 and WP02; use WP01 as base since it was implemented first)*

---

## Activity Log

> Entries MUST be in chronological order (oldest first, newest last).

*[Activity log will be populated during implementation and review]*
- 2026-01-23T10:30:50Z – claude – shell_pid=97768 – lane=doing – Started implementation via workflow command
