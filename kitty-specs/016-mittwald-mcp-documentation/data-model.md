# Data Model: Mittwald MCP Documentation Structure

**Feature**: 016-mittwald-mcp-documentation  
**Date**: 2025-01-23  
**Phase**: 1 (Design)

## Overview

This document defines the core entities, relationships, and validation rules for the Mittwald MCP documentation system.

---

## Core Entities

### 1. DocumentationSite

Represents one Starlight site (Setup+Guides or Reference).

```typescript
interface DocumentationSite {
  id: 'setup-and-guides' | 'reference';
  title: string;
  description: string;
  baseUrl: string;  // e.g., '/docs', '/mcp-docs'
  siteType: 'guide' | 'reference';
  astroPath: string;  // e.g., 'docs/setup-and-guides/'
  buildCommand: string;  // npm run build
  publishedAt?: Date;
  version: string;  // e.g., 1.0.0
}
```

**Instances**:
- `site:setup-guides` - Home, OAuth guides, explainers, case studies
- `site:reference` - Auto-generated tool reference

---

### 2. DocumentationPage

Represents a single markdown page in either site.

```typescript
interface DocumentationPage {
  id: string;  // Unique identifier
  path: string;  // Relative path in Starlight (e.g., 'getting-started/claude-code')
  title: string;
  description: string;
  divioType: 'tutorial' | 'how-to' | 'reference' | 'explanation';
  siteId: 'setup-and-guides' | 'reference';
  lastModified: Date;
  frontmatter: {
    title: string;
    description: string;
    sidebar?: {
      label: string;
      order?: number;
    };
  };
  content: string;  // Markdown content
}
```

---

### 3. OAuthGettingStartedGuide (extends DocumentationPage)

Specialized page for OAuth setup for one tool.

```typescript
interface OAuthGettingStartedGuide extends DocumentationPage {
  divioType: 'how-to';
  tool: 'Claude Code' | 'GitHub Copilot' | 'Cursor' | 'Codex CLI';
  sections: {
    prerequisites: string[];
    registration: OAuthRegistrationSteps;
    redirectUri: RedirectUriConfig;
    pkceSetup: PKCEConfig;
    verification: VerificationSteps;
    troubleshooting: TroubleshootingEntry[];
  };
}

interface OAuthRegistrationSteps {
  endpoint: string;  // URL of OAuth registration endpoint
  clientName: string;
  redirectUri: string;
  scopes: string[];
  steps: string[];  // Step descriptions
}

interface RedirectUriConfig {
  pattern: string;  // e.g., 'http://127.0.0.1:PORT/callback'
  toolSpecifics: string;  // Tool-specific instructions
}

interface PKCEConfig {
  required: boolean;
  method: 'S256' | 'plain';
  toolSpecifics: string;
}

interface VerificationSteps {
  description: string;
  commands: string[];
  expectedOutput: string;
}

interface TroubleshootingEntry {
  error: string;  // Error message or condition
  cause: string;  // Why it happens
  solution: string;  // How to fix it
}
```

---

### 4. ConceptualExplainer (extends DocumentationPage)

Specialized page for explaining concepts.

```typescript
interface ConceptualExplainer extends DocumentationPage {
  divioType: 'explanation';
  concepts: Concept[];
  diagram?: DiagramRef;
  misconceptions: Misconception[];
}

interface Concept {
  name: string;
  explanation: string;
  implications: string[];
}

interface DiagramRef {
  path: string;  // Relative path to SVG or image
  alt: string;  // Alt text for accessibility
}

interface Misconception {
  belief: string;  // Wrong idea
  reality: string;  // What's actually true
  clarification: string;  // Detailed explanation
}
```

---

### 5. CaseStudyTutorial (extends DocumentationPage)

Specialized page for real-world use case tutorial.

```typescript
interface CaseStudyTutorial extends DocumentationPage {
  divioType: 'tutorial';
  caseStudyId: string;  // e.g., 'CS-001'
  segment: CustomerSegment;
  persona: Persona;
  problem: Problem;
  solution: Solution;
  implementation: ImplementationSteps;
  outcomes: Outcome[];
  estimatedTime: number;  // Minutes
  tools: MCPToolReference[];
  troubleshooting: TroubleshootingEntry[];
}

interface Persona {
  name: string;
  title: string;
  segment: CustomerSegment;
  toolsUsed: string[];
  painPoint: string;
}

type CustomerSegment = 
  | 'Freelance Web Developer'
  | 'Web Development Agency'
  | 'E-commerce Specialist'
  | 'Enterprise TYPO3 Developer'
  | 'Modern Stack Developer';

interface Problem {
  description: string;
  quantifiedImpact: string;  // e.g., "50 hours/week manual work"
  frequency: string;  // How often it occurs
}

interface Solution {
  summary: string;
  keyTools: string[];  // Tool names
  workflow: string;  // Description of the solution workflow
}

interface ImplementationSteps {
  step: ImplementationStep[];
}

interface ImplementationStep {
  number: number;
  title: string;
  description: string;
  command?: string;
  expectedResult: string;
}

interface Outcome {
  metric: string;  // What was measured
  before: string;  // Before value
  after: string;  // After value
  impact: string;  // Business impact
}
```

---

### 6. MCPTool

Represents one MCP tool (auto-generated from handler).

```typescript
interface MCPTool {
  id: string;  // Unique identifier (e.g., 'app-create')
  name: string;  // Display name (e.g., 'app/create')
  domain: MCPDomain;
  description: string;
  handler: string;  // Path to handler in src/handlers/tools/
  parameters: Parameter[];
  returnType: ReturnTypeDefinition;
  examples: Example[];
  relatedTools: string[];  // IDs of related tools in same domain
  usedInCaseStudies: string[];  // Case study IDs that reference this tool
}

interface Parameter {
  name: string;
  type: string;  // e.g., 'string', 'number', 'object'
  required: boolean;
  description: string;
  defaultValue?: any;
  constraints?: string;  // e.g., "Must be < 1GB"
}

interface ReturnTypeDefinition {
  type: string;
  description: string;
  properties?: Record<string, Property>;
}

interface Property {
  type: string;
  description: string;
}

interface Example {
  title: string;
  code: string;
  output: string;
}

type MCPDomain = 
  | 'apps'
  | 'backups'
  | 'certificates'
  | 'containers'
  | 'context'
  | 'databases'
  | 'domains-mail'
  | 'identity'
  | 'misc'
  | 'organization'
  | 'project-foundation'
  | 'sftp'
  | 'ssh'
  | 'automation';
```

---

### 7. MCPDomain

Represents a grouping of related MCP tools.

```typescript
interface MCPDomain {
  id: MCPDomainId;
  name: string;
  description: string;
  toolCount: number;  // Number of tools in this domain
  tools: MCPTool[];
  order: number;  // Sort order in navigation
}

type MCPDomainId = 
  | 'apps'
  | 'backups'
  | 'certificates'
  | 'containers'
  | 'context'
  | 'databases'
  | 'domains-mail'
  | 'identity'
  | 'misc'
  | 'organization'
  | 'project-foundation'
  | 'sftp'
  | 'ssh'
  | 'automation';
```

---

### 8. ToolReference (extends DocumentationPage)

Auto-generated page for one MCP tool.

```typescript
interface ToolReference extends DocumentationPage {
  divioType: 'reference';
  tool: MCPTool;
  siteId: 'reference';  // Always in reference site
  generatedFrom: {
    handler: string;  // Path to handler file
    timestamp: Date;
    scriptVersion: string;
  };
}
```

---

## Relationships

```
DocumentationSite
  ├── contains → DocumentationPage[]
  │           ├── OAuthGettingStartedGuide
  │           ├── ConceptualExplainer
  │           ├── CaseStudyTutorial
  │           └── ToolReference

MCPDomain
  ├── contains → MCPTool[]
  └── referenced by → ToolReference[]

CaseStudyTutorial
  └── references → MCPTool[]

MCPTool
  ├── belongsTo → MCPDomain
  └── usedIn → CaseStudyTutorial[]
```

---

## Validation Rules

### DocumentationPage
- ✅ `path` must be unique within `siteId`
- ✅ `title` must not be empty
- ✅ `divioType` must match content structure (e.g., 'tutorial' pages must have outcomes)
- ✅ `content` must be valid Markdown
- ✅ All links must reference existing pages or external URLs

### OAuthGettingStartedGuide
- ✅ `tool` must be one of: Claude Code, GitHub Copilot, Cursor, Codex CLI
- ✅ Must have exactly one instance per tool
- ✅ `troubleshooting` array must not be empty
- ✅ `redirectUri` must include tool-specific pattern instructions

### ConceptualExplainer
- ✅ Must have at least one `Concept`
- ✅ If `diagram` is present, image file must exist
- ✅ All `misconceptions` must be addressed clearly

### CaseStudyTutorial
- ✅ `caseStudyId` must be unique (e.g., CS-001 through CS-010)
- ✅ `segment` must be one of: Freelancer, Agency, E-commerce, TYPO3, Modern Stack
- ✅ Exactly 2 case studies per segment (validation: count by segment = 2)
- ✅ Must reference at least one `MCPTool`
- ✅ `estimatedTime` must be > 0

### MCPTool
- ✅ `id` must be unique
- ✅ `name` must follow format `domain/action` (e.g., `app/create`)
- ✅ `domain` must be one of 14 defined domains
- ✅ `parameters` array must match handler signature
- ✅ All `usedInCaseStudies` references must exist

### ToolReference
- ✅ One page per MCPTool (115 total)
- ✅ Must be auto-generated (not manually edited)
- ✅ `generatedFrom.handler` must reference valid handler file

---

## Auto-Generation Contracts

### Input: tools-manifest.json
```json
{
  "tools": [
    {
      "id": "app-create",
      "name": "app/create",
      "domain": "apps",
      "description": "Create a new application",
      "parameters": [
        {
          "name": "projectId",
          "type": "string",
          "required": true,
          "description": "ID of the project"
        }
      ],
      "returnType": {
        "type": "Application",
        "description": "Created application object"
      },
      "examples": [...]
    }
  ]
}
```

### Output: OpenAPI Schema
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Mittwald MCP Tools",
    "version": "1.0.0"
  },
  "paths": {
    "/app/create": {
      "post": {
        "description": "Create a new application",
        "parameters": [...],
        "responses": {
          "200": {
            "description": "Success",
            "schema": { "type": "Application" }
          }
        }
      }
    }
  }
}
```

### Output: Markdown Pages
```
docs/reference/src/content/docs/tools/apps/app-create.md
docs/reference/src/content/docs/tools/apps/index.md  (domain landing page)
...
docs/reference/src/content/docs/tools/reference/index.md  (site home)
```

---

## Coverage Metrics

### Site 1 (Setup + Guides)
| Type | Count | Target |
|------|-------|--------|
| OAuth Guides | 4 | 4 (Claude Code, Copilot, Cursor, Codex CLI) |
| Explainers | 3 | 3 (MCP, Agentic Coding, OAuth) |
| Case Studies | 10 | 10 (2 per segment) |
| **Total Pages** | **17** | **17** |

### Site 2 (Reference)
| Type | Count | Target |
|------|-------|--------|
| Tool References | 115 | 115 (all MCP tools) |
| Domain Landing Pages | 14 | 14 (one per domain) |
| Site Home | 1 | 1 |
| **Total Pages** | **130** | **130** |

### Overall
- **Total Documentation Pages**: 147
- **Tool Coverage**: 115/115 (100%)
- **Segment Coverage**: 5/5 (100%, 2 case studies each)
- **Domain Coverage**: 14/14 (100%)

---

## Divio Type Mapping

| Type | Purpose | Example | Site |
|------|---------|---------|------|
| **Tutorial** | Learning-oriented | "Freelancer Client Onboarding" | Site 1 |
| **How-To** | Goal-oriented | "Getting Started with Claude Code" | Site 1 |
| **Reference** | Info-oriented | "app/create tool documentation" | Site 2 |
| **Explanation** | Understanding-oriented | "What is MCP?" | Site 1 |

---

## State Transitions

### Page Lifecycle
```
Draft → Review → Published → (Optional: Archived)
```

### Tool Reference Lifecycle (Auto-Generated)
```
Generated → Validated → Published (no human draft/review)
```

### Case Study Lifecycle
```
Sketch (from 015) → Convert to Tutorial Format → Review → Published
```

