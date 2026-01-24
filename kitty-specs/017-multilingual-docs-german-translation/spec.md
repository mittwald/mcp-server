# Feature Specification: Multilingual Documentation with German Translation

**Feature Branch**: `017-multilingual-docs-german-translation`
**Created**: 2026-01-24
**Status**: Draft
**Mission**: documentation

## Overview

This feature adds internationalization (i18n) support to both Mittwald MCP documentation sites and provides complete German translations for all content. Starlight provides native i18n support including automatic language switcher, browser language detection, and fallback content mechanisms.

**Key Discovery**: Starlight has built-in i18n support that includes:
- Automatic language switcher widget (appears when locales configured)
- Browser language detection via Astro's i18n routing
- Fallback content with translation notices
- Pre-built German UI strings out-of-the-box

## Documentation Scope

**Iteration Mode**: feature-specific (adding i18n to existing documentation)
**Target Audience**: German-speaking developers integrating Mittwald MCP with AI coding tools
**Languages**: English (existing), German (new)
**Framework**: Astro Starlight with native i18n support

### Current State

**Setup & Guides Site** (`/docs/setup-and-guides/`):
- 7 content files (6 guides + 1 index)
- OAuth setup guides for Claude Code, Cursor, Codex CLI
- Conceptual explainers (MCP, agentic coding, OAuth)

**Reference Site** (`/docs/reference/`):
- 195 content files (tool documentation)
- 21 tool domains with auto-generated sidebar
- Complete API reference for 115+ MCP tools

**Total Translation Scope**: ~202 content files

## User Scenarios & Testing

### User Story 1 - German Developer First Visit (Priority: P1)

A German-speaking developer visits the documentation for the first time. Their browser is set to German language preferences.

**Why this priority**: First impressions matter. German developers should see German content automatically without manual configuration.

**Independent Test**: Visit documentation with browser language set to German; content appears in German without user action.

**Acceptance Scenarios**:

1. **Given** a user with browser language set to German, **When** they visit the documentation root, **Then** they see German content automatically
2. **Given** a user viewing German content, **When** they navigate the sidebar, **Then** all navigation labels appear in German
3. **Given** a user on German content, **When** they see UI elements (search, "On this page", etc.), **Then** these appear in German

---

### User Story 2 - Language Switching (Priority: P1)

A developer wants to switch between English and German versions of the documentation.

**Why this priority**: Users may prefer a different language than their browser default, or want to compare versions.

**Independent Test**: Language switcher is visible and functional on all pages.

**Acceptance Scenarios**:

1. **Given** any documentation page, **When** a user looks for language options, **Then** they find a language switcher widget
2. **Given** the language switcher, **When** a user selects German, **Then** they see the German version of the current page
3. **Given** a user switches language, **When** they navigate to other pages, **Then** the selected language persists

---

### User Story 3 - English Content Remains Accessible (Priority: P1)

English-speaking users can continue using the documentation without disruption.

**Why this priority**: Existing English users should not experience any regression.

**Independent Test**: All existing English URLs continue to work; English content is unaffected.

**Acceptance Scenarios**:

1. **Given** existing English documentation URLs, **When** a user visits them, **Then** they work exactly as before (no `/en/` prefix required)
2. **Given** a user with browser language set to English, **When** they visit the documentation, **Then** they see English content by default
3. **Given** an English user, **When** they see the language switcher, **Then** English is shown as selected

---

### User Story 4 - German Tool Reference Lookup (Priority: P2)

A German developer needs to look up parameters for a specific MCP tool in German.

**Why this priority**: Technical reference is most useful in the developer's native language.

**Independent Test**: All 195 reference pages have German translations.

**Acceptance Scenarios**:

1. **Given** the German reference site, **When** a developer searches for a tool, **Then** they find German documentation
2. **Given** a German tool reference page, **When** a developer reads parameters, **Then** descriptions are in German
3. **Given** any tool in the reference, **When** a developer views it in German, **Then** all content (description, parameters, examples, return types) is in German

---

### Edge Cases

- **Partial translation available**: Starlight shows fallback English content with a "not yet translated" notice
- **URL structure preserved**: German pages use `/de/` prefix; English pages have no prefix (root locale)
- **Cross-site navigation**: Links between Setup and Reference sites preserve language preference
- **Search in German**: Site search finds German content when viewing German pages
- **Code examples**: Code snippets remain unchanged (only surrounding text is translated)

## Requirements

### Functional Requirements

#### i18n Configuration (FR-001 to FR-008)

- **FR-001**: Both Astro sites MUST configure Starlight i18n with English as root locale and German as secondary locale
- **FR-002**: English content MUST remain at root paths (no `/en/` prefix) to preserve existing URLs
- **FR-003**: German content MUST be served from `/de/` prefix paths
- **FR-004**: Configuration MUST enable browser language detection via Astro's i18n routing
- **FR-005**: Starlight's built-in language switcher widget MUST be visible and functional
- **FR-006**: German UI strings MUST use Starlight's built-in German translations
- **FR-007**: Site titles MUST be localized (English and German variants)
- **FR-008**: Both sites MUST share identical i18n configuration structure for consistency

#### Content Translation (FR-009 to FR-016)

- **FR-009**: All 7 content files in Setup & Guides site MUST be translated to German
- **FR-010**: All 195 content files in Reference site MUST be translated to German
- **FR-011**: German translations MUST preserve the original file structure under `src/content/docs/de/`
- **FR-012**: German file names MUST match English file names exactly (for Starlight's cross-language linking)
- **FR-013**: Frontmatter metadata (title, description, sidebar labels) MUST be translated
- **FR-014**: All prose content MUST be translated to natural German (not machine-translated quality)
- **FR-015**: Code examples, CLI commands, and API parameters MUST remain unchanged (English)
- **FR-016**: Technical terms with no standard German equivalent MAY remain in English with explanation

#### Navigation & UX (FR-017 to FR-022)

- **FR-017**: Sidebar navigation labels MUST appear in the user's selected language
- **FR-018**: Page titles in browser tab MUST reflect the selected language
- **FR-019**: Meta descriptions MUST be translated for SEO
- **FR-020**: "On this page" table of contents MUST reflect translated headings
- **FR-021**: Cross-site links MUST preserve language preference when navigating between sites
- **FR-022**: 404 pages MUST be available in both languages

### Key Entities

- **Locale**: Language configuration (English `en`, German `de`)
- **Root Locale**: Default language served without URL prefix (English)
- **Content Directory**: Language-specific content folder (`src/content/docs/` for English, `src/content/docs/de/` for German)
- **UI Strings**: Starlight's built-in interface translations
- **Language Switcher**: Starlight's native locale picker component

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of content files (202 total) have German translations
- **SC-002**: Browser language detection correctly routes German browsers to German content
- **SC-003**: Language switcher is accessible on every page of both sites
- **SC-004**: All existing English URLs continue to work unchanged
- **SC-005**: German UI strings display correctly (sidebar, search, table of contents)
- **SC-006**: Both sites build successfully with zero i18n-related warnings
- **SC-007**: Cross-site navigation preserves language preference

### Quality Gates

- All German translations read as natural German (reviewed for quality)
- No broken internal links in either language
- Frontmatter metadata (title, description) translated in all files
- Code examples remain unchanged across translations
- Language switcher visible and functional on mobile and desktop
- Site search returns results in the selected language

## Assumptions

- **ASM-001**: Starlight's built-in German UI strings are sufficient (no custom UI translation needed)
- **ASM-002**: AI-assisted translation produces acceptable quality for technical documentation
- **ASM-003**: German translations will be reviewed but not require professional translation services
- **ASM-004**: Technical terms (MCP, OAuth, PKCE) remain in English per industry convention
- **ASM-005**: The build process handles both languages without significant performance impact

## Out of Scope

- Additional languages beyond German (future consideration)
- Custom language switcher design (use Starlight's default)
- Language-specific content (same information in both languages)
- RTL language support
- Translation management system integration
- Automated translation updates when English content changes

## Constraints

- Starlight's i18n requires mirrored directory structure for translations
- File names must match exactly for cross-language linking
- German content adds ~200 files to repository
- Build time increases proportionally with content volume
- Translations require maintenance when English source changes

## Implementation Notes

### Starlight i18n Configuration Pattern

```javascript
// astro.config.mjs
starlight({
  title: {
    en: 'Mittwald MCP',
    de: 'Mittwald MCP'
  },
  locales: {
    root: {
      label: 'English',
      lang: 'en'
    },
    de: {
      label: 'Deutsch',
      lang: 'de'
    }
  },
  defaultLocale: 'root',
  // ... existing config
})
```

### Directory Structure After Implementation

```
docs/setup-and-guides/src/content/docs/
├── index.mdx                    # English (root)
├── getting-started/             # English
│   ├── index.md
│   ├── cursor.md
│   └── codex-cli.md
├── explainers/                  # English
│   ├── what-is-mcp.md
│   ├── what-is-agentic-coding.md
│   └── oauth-integration.md
└── de/                          # German translations
    ├── index.mdx
    ├── getting-started/
    │   ├── index.md
    │   ├── cursor.md
    │   └── codex-cli.md
    └── explainers/
        ├── what-is-mcp.md
        ├── what-is-agentic-coding.md
        └── oauth-integration.md
```

```
docs/reference/src/content/docs/
├── index.mdx                    # English (root)
├── tools/                       # English (195 files)
│   ├── index.md
│   ├── app/
│   ├── backup/
│   └── ... (21 domains)
└── de/                          # German translations
    ├── index.mdx
    ├── tools/
    │   ├── index.md
    │   ├── app/
    │   ├── backup/
    │   └── ... (21 domains)
```

## Acceptance Criteria Summary

For completion:
- All i18n configuration applied to both Astro sites
- Language switcher visible and functional
- Browser language detection working
- All 7 Setup & Guides files translated to German
- All 195 Reference files translated to German
- German translations reviewed for quality
- All existing English URLs unchanged
- Both sites build and deploy successfully
- Cross-site language preference preserved
