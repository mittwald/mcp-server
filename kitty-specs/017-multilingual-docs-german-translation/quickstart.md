# Quickstart: Verifying Multilingual Documentation

**Feature**: 017-multilingual-docs-german-translation
**Date**: 2026-01-24

## Prerequisites

- Node.js 18+ installed
- Access to the `docs/` directory

## Quick Verification Steps

### 1. Build Both Sites

```bash
cd docs
./build-all.sh
```

Expected output: Build completes with zero errors or warnings.

### 2. Start Development Server

**Setup & Guides site**:
```bash
cd docs/setup-and-guides
npm run dev
```
Opens at http://localhost:4321

**Reference site** (separate terminal):
```bash
cd docs/reference
npm run dev
```
Opens at http://localhost:4322 (or next available port)

### 3. Verify Language Switcher

1. Open http://localhost:4321 in browser
2. Look for language dropdown in header (shows "English")
3. Click dropdown → Select "Deutsch"
4. Page should navigate to http://localhost:4321/de/
5. UI elements should now be in German

### 4. Test Browser Language Detection

**Option A: Browser DevTools**
1. Open Chrome DevTools → Network tab → Request headers
2. Look for `Accept-Language` header
3. Or use: `navigator.language` in console

**Option B: Playwright Test**
```bash
npx playwright test tests/i18n.spec.ts
```

Sample test:
```typescript
import { test, expect } from '@playwright/test';

test('German browser sees German content', async ({ browser }) => {
  const context = await browser.newContext({
    locale: 'de-DE',
  });
  const page = await context.newPage();
  await page.goto('http://localhost:4321');

  // Should redirect to German or show German content
  await expect(page).toHaveURL(/\/de\//);

  // UI should be in German
  await expect(page.locator('text=Auf dieser Seite')).toBeVisible();
});

test('English browser sees English content', async ({ browser }) => {
  const context = await browser.newContext({
    locale: 'en-US',
  });
  const page = await context.newPage();
  await page.goto('http://localhost:4321');

  // Should stay at root (English)
  await expect(page).toHaveURL('http://localhost:4321/');

  // UI should be in English
  await expect(page.locator('text=On this page')).toBeVisible();
});
```

### 5. Verify English URLs Unchanged

Check these URLs still work (no `/en/` prefix):
- http://localhost:4321/ (landing)
- http://localhost:4321/getting-started/ (guides)
- http://localhost:4321/explainers/what-is-mcp/ (explainer)

For reference site:
- http://localhost:4322/ (landing)
- http://localhost:4322/tools/ (overview)
- http://localhost:4322/tools/app/app-list/ (tool page)

### 6. Verify German URLs

Check German content is accessible:
- http://localhost:4321/de/ (German landing)
- http://localhost:4321/de/getting-started/ (German guides)
- http://localhost:4321/de/explainers/what-is-mcp/ (German explainer)

For reference site:
- http://localhost:4322/de/ (German landing)
- http://localhost:4322/de/tools/ (German overview)
- http://localhost:4322/de/tools/app/app-list/ (German tool page)

### 7. Spot Check Translation Quality

Open 5 random German pages and verify:
- [ ] Title is translated
- [ ] Sidebar label is translated
- [ ] Prose content is in German
- [ ] Code examples are still in English
- [ ] Technical terms (MCP, OAuth) remain in English
- [ ] No "TODO" or placeholder text

### 8. Check for Broken Links

```bash
# From docs directory
npx linkinator ./setup-and-guides/dist --recurse
npx linkinator ./reference/dist --recurse
```

All links should return 200 status.

## Troubleshooting

### Language switcher not appearing

**Cause**: i18n configuration missing or incorrect
**Fix**: Verify `locales` config in `astro.config.mjs`:
```javascript
locales: {
  root: { label: 'English', lang: 'en' },
  de: { label: 'Deutsch', lang: 'de' }
}
```

### German pages show English content

**Cause**: German files not found (wrong path or missing)
**Fix**: Ensure files exist at `src/content/docs/de/` with exact matching names

### Build warnings about missing translations

**Cause**: Some German files missing
**Fix**: Check the warning message for specific file paths, create missing files

### Browser not redirecting to German

**Cause**: Browser language not set to German
**Fix**: Check browser settings, or test with Playwright using `locale: 'de-DE'`

## Success Checklist

- [ ] Both sites build successfully
- [ ] Language switcher visible on all pages
- [ ] Clicking "Deutsch" shows German content
- [ ] German browser auto-redirects to `/de/`
- [ ] English URLs work without prefix
- [ ] All 202 German files present
- [ ] No broken internal links
- [ ] Translation quality acceptable
