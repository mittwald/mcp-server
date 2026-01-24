# Data Model: Content File Structure

**Feature**: 017-multilingual-docs-german-translation
**Date**: 2026-01-24

## Overview

This feature involves content files, not database entities. This document defines the file structure and content format for German translations.

## Content File Entity

Each content file follows this structure:

### Frontmatter Schema

```yaml
---
title: string           # TRANSLATE: Page title (shown in browser tab, search)
description: string     # TRANSLATE: Page description (meta, search snippet)
sidebar:
  label: string         # TRANSLATE: Sidebar navigation label (optional)
  order: number         # KEEP: Sort order (unchanged from English)
head:
  - tag: meta
    attrs:
      name: string      # KEEP: Meta tag name
      content: string   # TRANSLATE: Meta tag content
lastUpdated: date       # UPDATE: Set to translation date
---
```

### Content Sections

| Section | Treatment |
|---------|-----------|
| Headings (##, ###) | TRANSLATE |
| Prose paragraphs | TRANSLATE |
| Bullet lists | TRANSLATE |
| Code blocks | KEEP (English) |
| Tables - header row | TRANSLATE |
| Tables - data cells | Context-dependent |
| Internal links | UPDATE path to `/de/` equivalent |
| External links | KEEP |
| Images | KEEP (same assets) |

## File Inventory

### Setup & Guides Site (7 files)

| Path | English File | German File |
|------|--------------|-------------|
| Landing | `index.mdx` | `de/index.mdx` |
| Getting Started | `getting-started/index.md` | `de/getting-started/index.md` |
| Cursor Setup | `getting-started/cursor.md` | `de/getting-started/cursor.md` |
| Codex CLI Setup | `getting-started/codex-cli.md` | `de/getting-started/codex-cli.md` |
| What is MCP | `explainers/what-is-mcp.md` | `de/explainers/what-is-mcp.md` |
| Agentic Coding | `explainers/what-is-agentic-coding.md` | `de/explainers/what-is-agentic-coding.md` |
| OAuth Integration | `explainers/oauth-integration.md` | `de/explainers/oauth-integration.md` |

### Reference Site (195 files)

| Domain | File Count | Path Pattern |
|--------|------------|--------------|
| Landing | 1 | `de/index.mdx` |
| Tools Overview | 1 | `de/tools/index.md` |
| App | 34 | `de/tools/app/*.md` |
| Backup | 9 | `de/tools/backup/*.md` |
| Certificate | 3 | `de/tools/certificate/*.md` |
| Container | 9 | `de/tools/container/*.md` |
| Context | 4 | `de/tools/context/*.md` |
| Conversation | 7 | `de/tools/conversation/*.md` |
| Cronjob | 11 | `de/tools/cronjob/*.md` |
| Database | 24 | `de/tools/database/*.md` |
| Domain | 9 | `de/tools/domain/*.md` |
| Extension | 5 | `de/tools/extension/*.md` |
| Login | 3 | `de/tools/login/*.md` |
| Mail | 14 | `de/tools/mail/*.md` |
| Org | 10 | `de/tools/org/*.md` |
| Project | 14 | `de/tools/project/*.md` |
| Registry | 5 | `de/tools/registry/*.md` |
| Server | 2 | `de/tools/server/*.md` |
| SFTP | 4 | `de/tools/sftp/*.md` |
| SSH | 4 | `de/tools/ssh/*.md` |
| Stack | 4 | `de/tools/stack/*.md` |
| User | 14 | `de/tools/user/*.md` |
| Volume | 4 | `de/tools/volume/*.md` |
| **Total** | **195** | |

## Tool Reference File Format

Each tool reference file follows a consistent pattern:

```markdown
---
title: [German Title]
description: [German Description]
sidebar:
  label: [German Label]
  order: [Same as English]
head:
  - tag: meta
    attrs:
      name: og:title
      content: [German Title]
lastUpdated: 2026-01-24
---

## Übersicht

[German translation of overview text]

## Parameter

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|--------------|--------------|
| projectId | string | Ja | [German description] |
| name | string | Nein | [German description] |

## Rückgabetyp

**Typ**: object

[German prose about return value]

\`\`\`json
{
  // JSON example - unchanged
}
\`\`\`
```

## Configuration File Changes

### astro.config.mjs Schema

```javascript
// Added fields for i18n
starlight({
  title: {
    en: 'Mittwald MCP',      // NEW
    de: 'Mittwald MCP'       // NEW
  },
  locales: {                  // NEW block
    root: {
      label: 'English',
      lang: 'en'
    },
    de: {
      label: 'Deutsch',
      lang: 'de'
    }
  },
  defaultLocale: 'root',      // NEW
  // ... existing sidebar unchanged
})
```

## Validation Rules

1. **File name matching**: German file names MUST exactly match English file names
2. **Directory mirroring**: German directory structure MUST mirror English structure
3. **Frontmatter required**: All German files MUST have translated frontmatter
4. **No orphan files**: Every German file MUST have an English counterpart
5. **Link consistency**: Internal links MUST be updated to German equivalents
