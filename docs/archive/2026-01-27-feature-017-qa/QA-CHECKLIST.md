# QA Checklist - Mittwald MCP Documentation

**Version**: 1.0
**Last Updated**: 2026-01-23
**Status**: WP14 - QA Testing Phase

---

## Overview

This document provides a comprehensive QA checklist for the Mittwald MCP documentation sites before final publication. It covers:
- Automated accessibility testing (WCAG 2.1 AA)
- Link validation (internal, cross-site, external)
- Build configuration testing (multiple BASE_URLs)
- Manual testing procedures
- Deployment verification

---

## Phase 1: Automated Testing

### T035 - Accessibility Audit (WCAG 2.1 AA)

#### Objective
Verify both documentation sites meet WCAG 2.1 AA accessibility standards through automated and manual checks.

#### Automated Checks

- [ ] **Run accessibility test script**
  ```bash
  npx tsx docs/qa-scripts/test-accessibility.ts
  ```
  - Generates: `docs/qa-reports/accessibility-report.json`
  - Generates: `docs/qa-reports/accessibility-report.md`

- [ ] **Verify heading hierarchy** (automated)
  - [ ] All pages start with H1
  - [ ] No heading skips (H1→H3 without H2)
  - [ ] Proper nesting throughout

- [ ] **Verify alt text for images** (automated)
  - [ ] All images have descriptive alt text
  - [ ] Alt text is meaningful (not just filenames)
  - [ ] Decorative images properly marked

- [ ] **Check for non-descriptive link text** (automated)
  - [ ] No "click here" links
  - [ ] No "link" text only
  - [ ] Link text explains destination

#### Manual Checks

- [ ] **Color Contrast Verification**
  - Tool: Browser DevTools Color Picker + Lighthouse
  - Mittwald Blue (#0066cc) on white background
  - Text must meet WCAG AA (4.5:1 for normal, 3:1 for large)
  - Test pages:
    - [ ] Setup site home page
    - [ ] Setup site OAuth guide
    - [ ] Reference site home page
    - [ ] Reference site tool page

- [ ] **Keyboard Navigation Testing**
  - Test on: Setup site home page
  - [ ] Tab through navigation menu
  - [ ] All interactive elements are keyboard accessible
  - [ ] Focus indicators are visible
  - [ ] Tab order is logical
  - [ ] No keyboard traps

- [ ] **Screen Reader Compatibility** (if available)
  - Test with: VoiceOver (macOS) or NVDA (Windows)
  - [ ] All headings announced correctly
  - [ ] Link purposes clear when announced alone
  - [ ] Form fields have proper labels
  - [ ] Images have meaningful alt text

#### Pass Criteria

- ✅ Zero critical accessibility violations
- ✅ All issues documented in `accessibility-report.md`
- ✅ All fixable issues resolved before publication
- ✅ Color contrast meets WCAG AA standards

#### Report Location
- JSON: `docs/qa-reports/accessibility-report.json`
- Markdown: `docs/qa-reports/accessibility-report.md`

---

### T036 - Link Validation

#### Objective
Verify all internal, cross-site, and external links work correctly.

#### Automated Checks

- [ ] **Run link validation script**
  ```bash
  npx tsx docs/qa-scripts/validate-links.ts
  ```
  - Generates: `docs/qa-reports/link-validation-report.json`
  - Generates: `docs/qa-reports/link-validation-report.md`

- [ ] **Internal Link Validation**
  - [ ] All internal links in HTML files resolve
  - [ ] No 404 errors on local navigation
  - [ ] Relative paths work correctly
  - [ ] Hash anchors point to valid headings

- [ ] **Markdown Link Validation**
  - [ ] All markdown file references exist
  - [ ] Relative paths are correct
  - [ ] No case sensitivity issues

- [ ] **External Link Validation**
  - [ ] URL formats are valid
  - [ ] No obvious broken patterns (e.g., typos in domain)
  - [ ] Sample external links reachable:
    - [ ] https://github.com/mittwald/mittwald-mcp
    - [ ] https://mittwald.de
    - [ ] RFC specifications (datatracker.ietf.org)

#### Manual Cross-Site Tests

**Setup Scenario**: Both sites deployed at different base paths
```bash
# Build Setup site
cd docs/setup && BASE_URL=/setup npm run build

# Build Reference site
cd docs/reference && BASE_URL=/reference npm run build
```

- [ ] **Setup site → Reference site navigation**
  - [ ] Links from case studies to tool references work
  - [ ] Tool links use format: `/reference/tools/{domain}/{tool}/`
  - [ ] Navigation link to reference site works

- [ ] **Reference site → Setup site navigation**
  - [ ] Back-to-setup links work (if present)
  - [ ] Links use format: `/setup/{page}/`
  - [ ] Navigation link to setup site works

**Different Domain Scenario**
```bash
# Build for different domains
cd docs/setup && BASE_URL=/ npm run build
cd docs/reference && BASE_URL=/ npm run build
```

- [ ] **Absolute URL links work**
  - [ ] Setup site links to reference use absolute URL
  - [ ] Reference site links to setup use absolute URL
  - [ ] No relative path confusion

#### Pass Criteria

- ✅ Zero broken internal links
- ✅ All external links reachable
- ✅ Cross-site navigation tested and working
- ✅ All issues documented in `link-validation-report.md`

#### Report Location
- JSON: `docs/qa-reports/link-validation-report.json`
- Markdown: `docs/qa-reports/link-validation-report.md`

---

### T037 - Build Verification and Configuration Testing

#### Objective
Verify both sites build successfully with multiple BASE_URL values and production configurations.

#### Build Configuration Tests

- [ ] **Run build test script**
  ```bash
  npx tsx docs/qa-scripts/test-builds.ts
  ```
  - Generates: `docs/qa-reports/build-verification-report.json`
  - Generates: `docs/qa-reports/build-verification-report.md`

#### Setup Site Build Tests

- [ ] **Root deployment** (`BASE_URL=/`)
  - [ ] Build succeeds
  - [ ] Build time < 30 seconds
  - [ ] dist/index.html exists
  - [ ] All pages render
  - [ ] Navigation links have correct paths

- [ ] **/docs subpath** (`BASE_URL=/docs`)
  - [ ] Build succeeds
  - [ ] Assets loaded with correct base path
  - [ ] Links include /docs prefix
  - [ ] Navigation works correctly

- [ ] **/setup subpath** (`BASE_URL=/setup`)
  - [ ] Build succeeds
  - [ ] Cross-site links reference /reference
  - [ ] Setup-specific configuration applied

- [ ] **/mcp-docs subpath** (`BASE_URL=/mcp-docs`)
  - [ ] Build succeeds
  - [ ] All paths prefixed correctly
  - [ ] Asset loading works

#### Reference Site Build Tests

- [ ] **Root deployment** (`BASE_URL=/`)
  - [ ] Build succeeds
  - [ ] Build time < 60 seconds (115+ auto-generated pages)
  - [ ] All tool reference pages generated
  - [ ] dist/index.html exists
  - [ ] dist/tools/ directory has domain subdirectories

- [ ] **/reference subpath** (`BASE_URL=/reference`)
  - [ ] Build succeeds
  - [ ] Tool links prefixed with /reference
  - [ ] Back-to-setup link uses /setup

- [ ] **Alternative paths** (`BASE_URL=/docs` and `/mcp-docs`)
  - [ ] Both builds succeed
  - [ ] Asset loading works correctly
  - [ ] Navigation paths update correctly

#### Cross-Site Link Configuration

- [ ] **Same domain scenario**
  ```bash
  SETUP_SITE_URL=/setup REFERENCE_SITE_URL=/reference npm run build
  ```
  - [ ] Setup site links to /reference work
  - [ ] Reference site links to /setup work

- [ ] **Different domains scenario**
  ```bash
  SETUP_SITE_URL=https://setup.example.com REFERENCE_SITE_URL=https://reference.example.com npm run build
  ```
  - [ ] Links are absolute URLs
  - [ ] No relative path conflicts

#### Build Output Verification

- [ ] **Setup Site Output Structure**
  ```
  dist/
  ├── index.html
  ├── _astro/
  ├── getting-started/
  ├── explainers/
  ├── case-studies/
  ├── guides/
  └── 404.html
  ```
  - [ ] Expected ~20 pages (verify: `find dist -name index.html | wc -l`)
  - [ ] All subdirectories present
  - [ ] Assets compiled in _astro/

- [ ] **Reference Site Output Structure**
  ```
  dist/
  ├── index.html
  ├── _astro/
  ├── tools/
  │  ├── apps/
  │  ├── databases/
  │  └── ...  (other domains)
  ├── guides/
  ├── reference/
  └── 404.html
  ```
  - [ ] Expected ~130 pages (verify: `find dist -name index.html | wc -l`)
  - [ ] All tool domains have subdirectories
  - [ ] Assets compiled in _astro/

#### Build Performance Baselines

- [ ] **Setup Site**
  - [ ] First build: target < 30 seconds
  - [ ] Rebuild: target < 20 seconds
  - [ ] Record actual times for baseline

- [ ] **Reference Site**
  - [ ] First build: target < 60 seconds
  - [ ] Rebuild: target < 50 seconds
  - [ ] Record actual times for baseline

#### Pass Criteria

- ✅ All BASE_URL configurations build successfully
- ✅ Build times acceptable (< limits specified)
- ✅ Output directories contain expected pages
- ✅ Cross-site links configured correctly
- ✅ All issues documented in `build-verification-report.md`

#### Report Location
- JSON: `docs/qa-reports/build-verification-report.json`
- Markdown: `docs/qa-reports/build-verification-report.md`

---

## Phase 2: Manual Testing (WP15)

### Environment Setup for Manual Tests

```bash
# Ensure both sites are built
cd docs/setup && npm run build
cd docs/reference && npm run build

# Optional: Serve locally for testing
# Using Node.js http-server or similar
npx http-server docs/setup/dist -p 3001 &
npx http-server docs/reference/dist -p 3002 &
```

### Manual Testing Procedures

#### Navigation and Usability

- [ ] **Setup Site Navigation**
  - [ ] Home page loads without errors
  - [ ] Side navigation menu displays correctly
  - [ ] All main sections accessible
  - [ ] Mobile responsive (test at 375px, 768px, 1440px)
  - [ ] Dark mode toggle works (if present)

- [ ] **Reference Site Navigation**
  - [ ] Home page loads without errors
  - [ ] Domain categories display
  - [ ] Tool listings show all 115 tools
  - [ ] Search functionality works (if present)
  - [ ] Mobile responsive

- [ ] **Cross-Site Navigation**
  - [ ] Setup → Reference links work
  - [ ] Reference → Setup links work
  - [ ] No dead links or 404s
  - [ ] Link targets are correct

#### Content Quality

- [ ] **Setup Site Content**
  - [ ] OAuth guides render correctly
  - [ ] Code examples are readable
  - [ ] Diagrams display properly
  - [ ] Links in guides are active
  - [ ] No broken images

- [ ] **Reference Site Content**
  - [ ] Tool documentation pages render
  - [ ] Parameter documentation clear
  - [ ] Example commands visible
  - [ ] Related tools linked
  - [ ] No orphaned pages

#### Performance

- [ ] **Page Load Performance**
  - Tool: Chrome DevTools Lighthouse
  - [ ] Setup home page: Lighthouse score > 80
  - [ ] Reference home page: Lighthouse score > 75
  - [ ] Tool reference page: Lighthouse score > 75

- [ ] **Time to Interactive**
  - [ ] Setup site: < 2 seconds
  - [ ] Reference site: < 3 seconds

- [ ] **Asset Size**
  - [ ] Setup CSS: < 200KB gzipped
  - [ ] Reference CSS: < 200KB gzipped
  - [ ] Main JS bundle: < 300KB gzipped

#### Accessibility (Manual Phase)

- [ ] **Keyboard Navigation**
  - [ ] Tab order is logical
  - [ ] Focus indicators visible throughout
  - [ ] Menu navigation works with keyboard only
  - [ ] No keyboard traps

- [ ] **Screen Reader Testing** (if available)
  - [ ] Page structure announced correctly
  - [ ] Navigation landmarks identified
  - [ ] Link purposes clear
  - [ ] Form fields proper labels

- [ ] **Color and Contrast**
  - [ ] All text meets WCAG AA (4.5:1)
  - [ ] UI elements identifiable without color alone
  - [ ] Dark mode contrast acceptable

#### Browser Compatibility

- [ ] **Desktop Browsers**
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)

- [ ] **Mobile Browsers**
  - [ ] iOS Safari
  - [ ] Android Chrome
  - [ ] Firefox Mobile

- [ ] **Older Browser Support** (if required)
  - [ ] IE 11 (if supported)
  - [ ] Safari 11+ (if supported)

---

## Phase 3: Deployment Verification

### Pre-Deployment Checklist

- [ ] **All QA tests passing**
  - [ ] Accessibility: 0 critical issues
  - [ ] Links: All links valid
  - [ ] Builds: All configurations successful

- [ ] **Reports Generated and Reviewed**
  - [ ] accessibility-report.md reviewed
  - [ ] link-validation-report.md reviewed
  - [ ] build-verification-report.md reviewed

- [ ] **Documentation Complete**
  - [ ] README updated with build instructions
  - [ ] BASE_URL configuration documented
  - [ ] Deployment procedures documented

### Staging Deployment

- [ ] **Deploy to staging environment**
  ```bash
  # Use your deployment tool (GitHub Actions, fly.io, etc.)
  # Example for fly.io:
  # flyctl deploy --app mittwald-docs-staging
  ```

- [ ] **Verify staging deployment**
  - [ ] Both sites accessible at staging URLs
  - [ ] Cross-site navigation works in staging
  - [ ] All paths resolve correctly
  - [ ] No console errors

- [ ] **Run smoke tests in staging**
  ```bash
  # Visit key pages in browser and verify:
  ```
  - [ ] Setup home page loads
  - [ ] Reference home page loads
  - [ ] Navigation works end-to-end
  - [ ] External links work

### Production Deployment

- [ ] **Final pre-production checks**
  - [ ] All staging tests passed
  - [ ] BASE_URL correct for production
  - [ ] Environment variables set
  - [ ] Analytics configured (if used)

- [ ] **Deploy to production**
  ```bash
  # Using your deployment process
  ```

- [ ] **Post-deployment verification**
  - [ ] Both sites accessible at production URLs
  - [ ] All expected pages render
  - [ ] Cross-site navigation works
  - [ ] No console errors
  - [ ] Lighthouse scores acceptable

- [ ] **Monitor for issues**
  - [ ] Check error logs 24 hours post-deploy
  - [ ] Monitor user feedback
  - [ ] Track performance metrics

---

## Running Automated Tests Locally

### Quick Start

```bash
# Run all QA tests
npm run qa:all

# Or run individual tests
npm run qa:accessibility
npm run qa:links
npm run qa:builds
```

### Individual Test Scripts

#### Accessibility Testing
```bash
npx tsx docs/qa-scripts/test-accessibility.ts

# Output:
# - docs/qa-reports/accessibility-report.json
# - docs/qa-reports/accessibility-report.md
```

#### Link Validation
```bash
npx tsx docs/qa-scripts/validate-links.ts

# Output:
# - docs/qa-reports/link-validation-report.json
# - docs/qa-reports/link-validation-report.md
```

#### Build Verification
```bash
npx tsx docs/qa-scripts/test-builds.ts

# Output:
# - docs/qa-reports/build-verification-report.json
# - docs/qa-reports/build-verification-report.md
```

---

## Troubleshooting

### Accessibility Issues

**Issue**: "Heading skip detected H1 → H3"
- **Solution**: Edit markdown file, add H2 between headings
- **Example**:
  ```markdown
  # Main Title (H1)
  ## Section (H2)   ← Add this
  ### Subsection (H3)
  ```

**Issue**: "Missing alt text for image"
- **Solution**: Add alt text to image
- **Example**:
  ```markdown
  ![MCP Architecture Diagram](../images/mcp-arch.png)
  ↓
  ![MCP showing request/response flow between Claude and tool servers](../images/mcp-arch.png)
  ```

### Link Issues

**Issue**: "Broken internal link"
- **Solution**: Verify target file path
- **Debugging**:
  ```bash
  # Check if file exists
  ls -la docs/setup/src/content/docs/target-file.md
  ```

**Issue**: "Cross-site link not working"
- **Solution**: Verify BASE_URL configuration
- **Debug**: Check generated HTML to see actual href values
  ```bash
  grep -r "href=\"/reference" docs/setup/dist/
  ```

### Build Issues

**Issue**: "Build fails with NODE_ENV error"
- **Solution**: Ensure Node.js version is compatible
  ```bash
  node --version  # Should be 18.0.0 or later
  npm --version   # Should be 9.0.0 or later
  ```

**Issue**: "Build timeout or slow"
- **Solution**: Check available system resources
  ```bash
  # Monitor build
  time npm run build
  ```

---

## Approval Sign-Off

### QA Lead Sign-Off
- **Name**: ________________
- **Date**: ________________
- **Status**: ☐ Approved ☐ Approved with Notes

### Notes
```
[Space for reviewer notes and comments]
```

### Development Lead Sign-Off
- **Name**: ________________
- **Date**: ________________
- **Status**: ☐ Ready for Production ☐ Needs Rework

### Deployment Approval
- **Name**: ________________
- **Date**: ________________
- **Authorized By**: ________________

---

## Related Documents

- **Accessibility Audit Report**: `docs/qa-reports/accessibility-report.md`
- **Link Validation Report**: `docs/qa-reports/link-validation-report.md`
- **Build Verification Report**: `docs/qa-reports/build-verification-report.md`
- **WP14 Specification**: `kitty-specs/016-mittwald-mcp-documentation/tasks/WP14-qa-accessibility-links-builds.md`

---

**Version History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-23 | Claude Code | Initial version - WP14 implementation |

