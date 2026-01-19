# Data Model: Mittwald MCP Use Case Research

**Feature**: 015-mittwald-mcp-use-case-research
**Mission**: research
**Last Updated**: 2025-01-19

## Overview

This document defines the entities, attributes, and relationships for the Mittwald MCP Use Case Research project. These entities represent the core concepts discovered and synthesized during research.

## Entity Definitions

### CustomerSegment

Represents a distinct group of Mittwald customers with shared characteristics and needs.

| Attribute | Type | Description | Required |
|-----------|------|-------------|----------|
| segment_id | string | Unique identifier (e.g., SEG-001) | Yes |
| name | string | Segment name (e.g., "Freelance Web Developer") | Yes |
| characteristics | string[] | Key traits of this segment | Yes |
| cms_preferences | string[] | Preferred CMS/frameworks (WordPress, TYPO3, etc.) | Yes |
| pain_points | string[] | Workflow challenges and frustrations | Yes |
| mcp_opportunities | string[] | How MCP can address their needs | Yes |
| estimated_size | string | Relative size (small/medium/large) | No |
| evidence_refs | string[] | References to evidence-log.csv entries | Yes |

### MCPDomain

Represents a grouping of related MCP tools.

| Attribute | Type | Description | Required |
|-----------|------|-------------|----------|
| domain_id | string | Domain identifier (e.g., "apps", "databases") | Yes |
| name | string | Human-readable name | Yes |
| description | string | What this domain covers | Yes |
| tool_count | number | Number of tools in this domain | Yes |
| tools | MCPTool[] | List of tools in this domain | Yes |

### MCPTool

Represents a single capability exposed by the Mittwald MCP server.

| Attribute | Type | Description | Required |
|-----------|------|-------------|----------|
| tool_id | string | MCP tool name (e.g., "mcp__mittwald__mittwald_app_list") | Yes |
| display_name | string | Short name (e.g., "app/list") | Yes |
| domain | string | Parent domain | Yes |
| description | string | What the tool does | Yes |
| parameters | Parameter[] | Input parameters | No |
| use_cases | string[] | Example workflow applications | Yes |
| case_study_refs | string[] | Case studies using this tool | Yes |

### LLMClient

Represents an AI assistant application capable of using MCP tools.

| Attribute | Type | Description | Required |
|-----------|------|-------------|----------|
| client_id | string | Identifier (e.g., "claude-code") | Yes |
| name | string | Full name (e.g., "Claude Code") | Yes |
| vendor | string | Vendor name (Anthropic, OpenAI, Google) | Yes |
| mcp_support | enum | none, partial, full | Yes |
| mcp_version | string | Supported MCP version (if any) | No |
| auth_methods | string[] | Supported authentication methods | Yes |
| strengths | string[] | What this client does well | Yes |
| limitations | string[] | Known limitations | Yes |
| best_for | string[] | Recommended use cases | Yes |
| evidence_refs | string[] | References to evidence-log.csv entries | Yes |

### CaseStudy

Represents a complete use case document.

| Attribute | Type | Description | Required |
|-----------|------|-------------|----------|
| case_study_id | string | Identifier (e.g., "CS-001") | Yes |
| title | string | Descriptive title | Yes |
| segment_ref | string | CustomerSegment.segment_id | Yes |
| persona | Persona | Detailed user persona | Yes |
| problem | Problem | Business problem description | Yes |
| solution | Solution | MCP-powered solution | Yes |
| workflow | WorkflowStep[] | Step-by-step implementation | Yes |
| roi | ROIAnalysis | Business justification | Yes |
| guidance | ImplementationGuidance | Developer instructions | Yes |
| tools_used | string[] | MCPTool.tool_id references | Yes |
| llm_clients | string[] | Recommended LLMClient.client_id | Yes |

### Persona (embedded in CaseStudy)

| Attribute | Type | Description | Required |
|-----------|------|-------------|----------|
| name | string | Fictional name | Yes |
| role | string | Job title/role | Yes |
| company_type | string | Type of organization | Yes |
| experience_level | string | junior/mid/senior | Yes |
| daily_challenges | string[] | Day-to-day pain points | Yes |
| goals | string[] | What they want to achieve | Yes |

### Problem (embedded in CaseStudy)

| Attribute | Type | Description | Required |
|-----------|------|-------------|----------|
| summary | string | One-sentence problem statement | Yes |
| context | string | Background and circumstances | Yes |
| current_workflow | string | How they solve it today | Yes |
| pain_points | string[] | Specific frustrations | Yes |
| business_impact | string | Cost of the problem | Yes |

### Solution (embedded in CaseStudy)

| Attribute | Type | Description | Required |
|-----------|------|-------------|----------|
| summary | string | One-sentence solution | Yes |
| mcp_tools | string[] | Specific tools used | Yes |
| llm_interaction | string | How user interacts with LLM | Yes |
| automation_scope | string | What gets automated | Yes |
| human_oversight | string | What remains manual | Yes |

### WorkflowStep (embedded in CaseStudy)

| Attribute | Type | Description | Required |
|-----------|------|-------------|----------|
| step_number | number | Sequence number | Yes |
| action | string | What happens | Yes |
| actor | enum | user, llm, system | Yes |
| mcp_tools | string[] | Tools invoked (if any) | No |
| inputs | string[] | Required inputs | No |
| outputs | string[] | Expected outputs | No |
| notes | string | Additional context | No |

### ROIAnalysis (embedded in CaseStudy)

| Attribute | Type | Description | Required |
|-----------|------|-------------|----------|
| time_saved | string | Estimated time savings | Yes |
| error_reduction | string | Quality improvement | Yes |
| scalability | string | How it scales | Yes |
| learning_curve | string | Adoption difficulty | Yes |
| prerequisites | string[] | What's needed to start | Yes |

### ImplementationGuidance (embedded in CaseStudy)

| Attribute | Type | Description | Required |
|-----------|------|-------------|----------|
| setup_steps | string[] | Initial configuration | Yes |
| example_prompts | string[] | Sample LLM prompts | Yes |
| common_pitfalls | string[] | What to avoid | Yes |
| success_indicators | string[] | How to know it's working | Yes |
| next_steps | string[] | Advanced usage | No |

## Coverage Matrices

### ToolCoverageMatrix

Maps which tools are used in which case studies.

| Attribute | Type | Description |
|-----------|------|-------------|
| tool_id | string | MCPTool reference |
| case_studies | string[] | CaseStudy IDs using this tool |
| coverage_count | number | Number of case studies |

### SegmentCoverageMatrix

Maps which segments are addressed by which case studies.

| Attribute | Type | Description |
|-----------|------|-------------|
| segment_id | string | CustomerSegment reference |
| case_studies | string[] | CaseStudy IDs for this segment |
| coverage_count | number | Number of case studies |

## Relationships

```
CustomerSegment 1--* CaseStudy (via segment_ref)
MCPDomain 1--* MCPTool (via domain)
MCPTool *--* CaseStudy (via tools_used)
LLMClient *--* CaseStudy (via llm_clients)
```

## Validation Rules

1. **Tool Coverage**: Every MCPTool must appear in at least one CaseStudy.tools_used
2. **Segment Coverage**: Every CustomerSegment must have at least one CaseStudy.segment_ref
3. **Evidence Tracking**: Every CustomerSegment and LLMClient must have evidence_refs
4. **Case Study Completeness**: Every CaseStudy must have all required embedded objects populated

## Notes

- This data model supports the research deliverables defined in spec.md
- Entities are designed to be serializable to JSON for potential automation
- Coverage matrices enable validation of FR-021 and FR-022 requirements
