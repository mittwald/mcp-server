# WP05 Tool Inventory

**Total Tools**: 175 tool handlers
**Already Migrated** (WP04): 1 (`app/list-cli.ts`)
**Remaining to Migrate**: 174 tools

## Category Breakdown

### Major Categories (>10 tools)

| Category | Count | Priority | Complexity |
|----------|-------|----------|------------|
| app | 28 | P0 | Medium |
| database | 22 | P0 | Medium |
| project | 14 | P0 | High |
| user | 12 | P1 | Low |
| org | 10 | P1 | Low |
| mail | 10 | P1 | Medium |
| cronjob | 10 | P1 | Low |

**Subtotal**: 106 tools

### Medium Categories (5-9 tools)

| Category | Count | Priority | Complexity |
|----------|-------|----------|------------|
| domain | 9 | P1 | Medium |
| container | 9 | P2 | Medium |
| backup | 9 | P2 | Low |
| conversation | 6 | P2 | Low |

**Subtotal**: 33 tools

### Small Categories (1-4 tools)

| Category | Count | Priority | Complexity |
|----------|-------|----------|------------|
| stack | 4 | P2 | Low |
| ssh | 4 | P2 | Low |
| sftp | 4 | P2 | Low |
| registry | 4 | P2 | Low |
| extension | 4 | P2 | Low |
| context | 4 | P2 | Low |
| volume | 3 | P2 | Low |
| login | 3 | P1 | Low |
| server | 2 | P2 | Medium |
| ddev | 2 | P2 | Low |
| certificate | 2 | P2 | Medium |

**Subtotal**: 36 tools

## Migration Strategy

### Phase 1: Core Tools (P0) - 63 tools
1. **app** (28 tools) - High usage, 1 already done (list)
2. **database** (22 tools) - Critical for MySQL/Redis operations
3. **project** (14 tools) - Core resource management

### Phase 2: User Management (P1) - 45 tools
4. **user** (12 tools) - User operations
5. **org** (10 tools) - Organization management
6. **mail** (10 tools) - Email configuration
7. **cronjob** (10 tools) - Scheduled tasks
8. **login** (3 tools) - Authentication

### Phase 3: Extended Services (P1) - 9 tools
9. **domain** (9 tools) - DNS and domain management

### Phase 4: Infrastructure (P2) - 57 tools
10. **container** (9 tools)
11. **backup** (9 tools)
12. **conversation** (6 tools)
13. **stack** (4 tools)
14. **ssh** (4 tools)
15. **sftp** (4 tools)
16. **registry** (4 tools)
17. **extension** (4 tools)
18. **context** (4 tools)
19. **volume** (3 tools)
20. **server** (2 tools)
21. **ddev** (2 tools)
22. **certificate** (2 tools)

## Tool List by Category

### App Tools (28 tools)
```bash
$ find src/handlers/tools/mittwald-cli/app -name "*-cli.ts" | sort
```

