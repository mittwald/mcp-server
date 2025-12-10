# Use Case Prompt Rewriting Guidelines (T012)

## Objective

Convert MCP tool test prompts from prescriptive (tool-centric) to outcome-focused (goal-centric) format to enable accurate LLM tool discovery measurement.

## Problem Statement

**Prescriptive Format (Incorrect)**:
```
Use the Mittwald MCP tools to first list all projects, then create a new PHP application.
```

**Outcome-Focused Format (Correct)**:
```
I need to deploy a PHP 8.2 web application so I can see it running in my project environment.
```

The prescriptive format trains LLMs to expect specific tool names, preventing genuine discovery of appropriate tools.

## Rewriting Principles

### 1. **Focus on Business Outcome**
- **What**: State the end goal or business objective
- **Why**: Explain the user's motivation or constraint
- **Not How**: Never specify which tools or commands to use

**Example**:
```
❌ Use mcp__mittwald__project_list then mcp__mittwald__app_create
✅ I want to set up a new website for my client's business
```

### 2. **Remove Tool References**
- Strip all `mcp__mittwald__*` patterns
- Remove "use the tools" language
- Eliminate "call", "invoke", "execute" in tool context
- Remove specific tool names (project_list, app_create, etc.)

**Prohibited Patterns**:
- `mcp__mittwald__*` - any MCP tool reference
- "use the tools" / "use the tool" / "use this tool"
- "call the" / "invoke the" / "execute the" (in tool context)
- "first [tool] then [tool]" - prescriptive sequences
- Tool names without context (e.g., "run project_list")

### 3. **Maintain Sufficient Context**
- Keep domain information (e.g., "PHP application", "MySQL database")
- Include user constraints (e.g., "with Node.js 16.x")
- Preserve resource types and configurations
- Specify success criteria implicitly through outcome description

**Example with Context**:
```
✅ I have an existing web project and I need to add a MySQL database
   to store user information securely
```

### 4. **Write in First Person**
- Use "I need", "I want", "I have"
- Avoid imperative ("create", "list", "delete") as direct commands
- Frame as user narrative, not system commands

**Example**:
```
❌ Create a new project and add an app
✅ I need to create a new project to organize my development work
```

### 5. **Specify Domain but Not Implementation**
- Name the domain (apps, databases, containers, etc.)
- Describe the resource (PHP app, MySQL DB, Docker container)
- DO NOT name the specific MCP tool

**Example**:
```
✅ I need to set up a new website (app domain)
✅ I need to add a MySQL database (database domain)
❌ I need to call project_list and app_create
```

## Validation Checklist

For each rewritten prompt, verify:

- [ ] Zero `mcp__mittwald__*` matches (automated scan)
- [ ] Zero "use the tools" / "use the tool" phrases
- [ ] Zero "call", "invoke", "execute" in tool context
- [ ] Outcome is clear (what the user wants to achieve)
- [ ] Business context is preserved
- [ ] Domain is identifiable from wording
- [ ] Prompt is self-contained (no external references)
- [ ] First-person narrative throughout
- [ ] Success criteria implied or stated

## Implementation Process

1. **Read the original prompt** and understand the business goal
2. **Identify the domain** (apps, databases, containers, etc.)
3. **Remove tool references** – strip `mcp__mittwald__*`, "use the tools", etc.
4. **Rewrite as outcome** – "I need to...", "I want to...", "I have... and need to..."
5. **Verify context** – domain info and constraints remain
6. **Validate** – run automated scan, verify with domain expert
7. **Commit** with rationale in PR description

## Examples by Domain

### Apps Domain
```
Original:  Use mcp__mittwald__project_list then mcp__mittwald__app_create
           to set up a PHP 8.2 website
Rewritten: I need to deploy a PHP 8.2 web application
           so I can see it running in my project
```

### Databases Domain
```
Original:  Call project_list, then database_create with MySQL
Rewritten: I have an existing web project and I need to add
           a MySQL database to store user information
```

### Containers Domain
```
Original:  Use app_list and container_list to see what containers
           are running on my app
Rewritten: I'd like to see what container resources I'm currently
           using on my web application
```

### Backup Domain
```
Original:  Execute project_backup to create a backup
Rewritten: I need to create a backup of my project
           before making major updates
```

## Automated Validation

All prompts MUST pass the automated scan:
```bash
rg 'mcp__mittwald__' tests/functional/use-case-library --count
# Expected: 0

rg '(use the tools?|use this tool|call the|invoke the|execute the)' \
   tests/functional/use-case-library/\*/prompt.txt --count
# Expected: 0
```

## Maintenance

When adding new use cases:
1. Follow these guidelines from the start
2. Have a domain expert spot-check against this document
3. Run automated validation before committing
4. Document the spot-check in WP03 records

---

**Document Version**: 1.0
**Last Updated**: 2025-12-09
**Authored By**: Sprint 008 Team
