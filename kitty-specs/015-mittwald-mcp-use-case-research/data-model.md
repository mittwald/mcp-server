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

### CaseStudy (Streamlined Tutorial Format)

Represents a complete use case document in the 4-section streamlined format.

| Attribute | Type | Description | Required |
|-----------|------|-------------|----------|
| case_study_id | string | Identifier (e.g., "CS-001") | Yes |
| title | string | Descriptive title | Yes |
| segment_ref | string | CustomerSegment.segment_id | Yes |
| persona | PersonaStreamlined | Quick persona intro | Yes |
| problem | string | 2-3 sentence problem statement | Yes |
| solution | SolutionWorkflow | Step-by-step MCP workflow | Yes |
| outcomes | Outcomes | Results and next steps | Yes |
| tools_used | string[] | MCPTool.display_name references | Yes |
| llm_client | string | Recommended LLMClient.client_id | Yes |

### PersonaStreamlined (Section 1 of CaseStudy)

| Attribute | Type | Description | Required |
|-----------|------|-------------|----------|
| segment | string | Segment ID and name | Yes |
| role | string | Job title/description | Yes |
| context | string | 1-2 sentences on their situation | Yes |

### SolutionWorkflow (Section 3 of CaseStudy)

| Attribute | Type | Description | Required |
|-----------|------|-------------|----------|
| prerequisites | string[] | What's needed before starting | Yes |
| steps | WorkflowStep[] | Ordered list of workflow steps | Yes |

### WorkflowStep (embedded in SolutionWorkflow)

| Attribute | Type | Description | Required |
|-----------|------|-------------|----------|
| step_number | number | Sequence number | Yes |
| action_name | string | Short action title | Yes |
| prompt_or_command | string | LLM prompt or MCP tool invocation | Yes |
| tools_used | string[] | MCP tools invoked (display_name format) | Yes |
| expected_output | string | What the user sees after this step | Yes |

### Outcomes (Section 4 of CaseStudy)

| Attribute | Type | Description | Required |
|-----------|------|-------------|----------|
| time_saved | string | Qualitative time savings estimate | Yes |
| error_reduction | string | What manual mistakes are avoided | Yes |
| next_steps | string[] | How to extend this workflow | Yes |

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
