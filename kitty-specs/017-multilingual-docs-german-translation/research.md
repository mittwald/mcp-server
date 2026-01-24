# Research: Starlight i18n Implementation

**Feature**: 017-multilingual-docs-german-translation
**Date**: 2026-01-24

## Research Questions

1. Does Starlight support i18n natively?
2. How does browser language detection work?
3. How is the language switcher configured?
4. What is the recommended directory structure?

## Findings

### 1. Native i18n Support

**Decision**: Use Starlight's built-in i18n support
**Rationale**: Starlight provides complete i18n functionality out of the box, including:
- Locale configuration in `astro.config.mjs`
- Automatic language switcher widget
- Browser language detection via Astro's i18n routing
- Pre-built UI translations for 30+ languages (including German)
- Fallback content with "not yet translated" notices

**Alternatives Considered**:
- Custom i18n implementation: Rejected (unnecessary complexity)
- Third-party i18n plugins: Rejected (Starlight's native support is sufficient)

**Source**: https://starlight.astro.build/guides/i18n/

### 2. Root Locale Configuration

**Decision**: Use English as "root" locale (no `/en/` prefix)
**Rationale**: Preserves all existing English URLs without breaking changes. German content uses `/de/` prefix.

**Configuration Pattern**:
```javascript
locales: {
  root: {
    label: 'English',
    lang: 'en'
  },
  de: {
    label: 'Deutsch',
    lang: 'de'
  }
}
```

**Alternatives Considered**:
- Both languages with prefixes (`/en/`, `/de/`): Rejected (breaks existing URLs)
- German as root: Rejected (majority of existing users are English)

### 3. Browser Language Detection

**Decision**: Rely on Astro's built-in i18n routing
**Rationale**: Astro 5.x includes i18n routing that respects `Accept-Language` headers. When a German browser visits the site, Astro redirects to the German version.

**How it works**:
- Astro reads the `Accept-Language` HTTP header
- Matches against configured locales
- Redirects to the appropriate locale path
- Users can override via the language switcher

**No additional configuration required** - this is enabled automatically when locales are configured.

### 4. Language Switcher

**Decision**: Use Starlight's built-in language switcher
**Rationale**: Automatically appears in the site header when multiple locales are configured. No custom component needed.

**Behavior**:
- Displays current language label
- Dropdown shows all available languages
- Navigates to same page in selected language
- Preserves URL path structure

### 5. Directory Structure

**Decision**: Use `de/` subdirectory within `src/content/docs/`
**Rationale**: Starlight's recommended pattern. Files must mirror the English structure exactly for cross-language linking to work.

**Structure**:
```
src/content/docs/
├── index.mdx           # English (root locale)
├── getting-started/
│   └── index.md        # English
└── de/
    ├── index.mdx       # German
    └── getting-started/
        └── index.md    # German
```

**Key Requirement**: File names must match exactly between locales.

### 6. UI String Translations

**Decision**: Use Starlight's built-in German UI strings
**Rationale**: Starlight includes pre-translated UI strings for German (and 30+ other languages). These cover:
- "On this page" → "Auf dieser Seite"
- "Search" → "Suchen"
- "Table of contents" → "Inhaltsverzeichnis"
- Navigation labels
- Error pages

**No custom UI translation needed** unless we want to override specific strings.

### 7. Sidebar Configuration

**Decision**: Keep existing sidebar configuration (autogenerate works with i18n)
**Rationale**: Starlight's `autogenerate` sidebar feature automatically detects translated content in the `de/` directory and generates the correct sidebar for each locale.

**No changes to sidebar config required** - just add content files to `de/` directories.

## Translation Guidelines

Based on research into German technical documentation best practices:

### Translate
- Page titles and descriptions (frontmatter)
- Sidebar labels
- Prose content (explanations, instructions)
- Parameter descriptions in tables
- Section headings

### Keep in English
- Code examples and snippets
- CLI commands
- API parameter names and types
- Technical acronyms (MCP, OAuth, PKCE, DCR)
- JSON/YAML examples
- File paths and URLs

### Style Guidelines
- Use formal "Sie" form (not informal "du")
- Use German technical terminology where established
- Keep sentences concise (German tends to be wordier)
- Match existing Mittwald.de documentation style

## Verification Checklist

After implementation, verify:
- [ ] `npm run build` succeeds with zero i18n warnings
- [ ] Language switcher appears on all pages
- [ ] Browser with `de` preference loads German content
- [ ] Existing English URLs work unchanged
- [ ] German URLs follow `/de/` pattern
- [ ] UI strings appear in German on German pages
- [ ] Cross-language links work (language switcher navigates correctly)
