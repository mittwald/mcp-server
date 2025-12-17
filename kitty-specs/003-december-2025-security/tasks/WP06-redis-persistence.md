---
work_package_id: WP06
title: Redis Persistence Configuration
lane: done
history:
- timestamp: '2025-12-03T14:00:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
agent: ''
assignee: ''
phase: Phase 3 - Infrastructure (P2)
shell_pid: ''
subtasks:
- T033
- T034
- T035
- T036
- T037
- T038
---

# Work Package Prompt: WP06 – Redis Persistence Configuration

## Objectives & Success Criteria

- **Primary Objective**: Configure Redis for production-grade persistence to minimize session/token data loss
- **Success Criteria**:
  - Sessions and registration tokens survive Redis container restart
  - Maximum data loss window: 1 second (AOF everysec)
  - Session keys protected from eviction (volatile-lru policy)
  - Production and development configs are distinct

## Context & Constraints

- **Spec Reference**: `kitty-specs/003-december-2025-security/spec.md` - User Story 6, FR-012 to FR-014
- **Research**: `kitty-specs/003-december-2025-security/research.md` - Section 6 (Redis AOF)
- **Existing Analysis**: `upgrade-plan-2025-12/REDIS-ANALYSIS.md`

**Architectural Constraints**:
- Modify production docker-compose only (keep development fast)
- Use AOF (Append Only File) for durability
- Maintain backward compatibility with existing Redis data
- Performance overhead must be <1%

## Subtasks & Detailed Guidance

### Subtask T033 – Enable AOF persistence

**Purpose**: Enable append-only file persistence for durability.

**Steps**:
1. Open `docker-compose.prod.yml` (or create if only docker-compose.yml exists)
2. Modify Redis service command:
   ```yaml
   redis:
     image: redis:7-alpine
     command: >
       redis-server
       --maxmemory 512mb
       --maxmemory-policy volatile-lru
       --appendonly yes
       --appendfsync everysec
     volumes:
       - redis-data:/data
     restart: unless-stopped
   ```
3. Ensure named volume `redis-data` is defined in volumes section

**Files**:
- MODIFY: `docker-compose.prod.yml` (or CREATE if doesn't exist)

**Notes**:
- `--appendonly yes` enables AOF persistence
- AOF file stored at /data/appendonly.aof in container

### Subtask T034 – Configure AOF sync interval

**Purpose**: Balance durability vs performance with everysec sync.

**Steps**:
1. Add `--appendfsync everysec` to Redis command
2. This syncs AOF to disk every second
3. Maximum data loss: 1 second of writes

**Files**:
- MODIFY: `docker-compose.prod.yml`

**Notes**:
- `always`: Most durable but slowest (fsync every write)
- `everysec`: Good balance (fsync every second) - RECOMMENDED
- `no`: Fastest but least durable (OS decides when to sync)

### Subtask T035 – Change eviction policy

**Purpose**: Protect long-lived tokens from eviction.

**Steps**:
1. Change `--maxmemory-policy` from `allkeys-lru` to `volatile-lru`
2. `volatile-lru`: Only evicts keys with TTL set (expire-able keys)
3. Session keys have TTL, so they can be evicted under memory pressure
4. Registration tokens have 30-day TTL, also evictable but less likely

**Files**:
- MODIFY: `docker-compose.prod.yml`

**Current (problematic)**:
```yaml
command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

**After (safe)**:
```yaml
command: redis-server --maxmemory 512mb --maxmemory-policy volatile-lru
```

**Notes**:
- `allkeys-lru`: Can evict ANY key including permanent ones
- `volatile-lru`: Only evicts keys with EXPIRE set

### Subtask T036 – Increase memory limit

**Purpose**: Provide adequate memory for production token storage.

**Steps**:
1. Increase `--maxmemory` from `256mb` to `512mb`
2. Calculate expected usage:
   - Sessions: ~1KB each, 10,000 concurrent = 10MB
   - Registration tokens: ~500B each, 1,000 clients = 500KB
   - OAuth states: ~2KB each, 1,000 concurrent = 2MB
   - Total: ~15MB active + AOF rewrite buffer
3. 512MB provides ample headroom

**Files**:
- MODIFY: `docker-compose.prod.yml`

**Notes**:
- Monitor actual usage with `INFO memory` command
- Scale up if approaching 80% utilization

### Subtask T037 – Document Redis configuration

**Purpose**: Create operational runbook for Redis persistence.

**Steps**:
1. Create or update `docs/operations/redis.md`:
   ```markdown
   # Redis Configuration

   ## Production Settings

   | Setting | Value | Purpose |
   |---------|-------|---------|
   | maxmemory | 512mb | Memory limit for Redis |
   | maxmemory-policy | volatile-lru | Only evict keys with TTL |
   | appendonly | yes | Enable AOF persistence |
   | appendfsync | everysec | Sync to disk every second |

   ## Data Durability

   - **Maximum data loss**: 1 second of writes
   - **Persistence**: AOF file at /data/appendonly.aof
   - **Recovery**: Automatic on container restart

   ## Monitoring Commands

   ```bash
   # Check Redis info
   docker exec mittwald-mcp-redis redis-cli INFO

   # Check persistence status
   docker exec mittwald-mcp-redis redis-cli INFO persistence

   # Check memory usage
   docker exec mittwald-mcp-redis redis-cli INFO memory
   ```

   ## Backup Procedure

   1. Copy AOF file: `docker cp mittwald-mcp-redis:/data/appendonly.aof ./backup/`
   2. Verify backup integrity: `redis-check-aof --fix backup/appendonly.aof`
   ```

**Files**:
- CREATE: `docs/operations/redis.md`

**Parallel?**: Yes - can be written while config changes are made

### Subtask T038 – Add verification commands to quickstart

**Purpose**: Help developers verify Redis persistence is working.

**Steps**:
1. Update `kitty-specs/003-december-2025-security/quickstart.md` or main quickstart:
   ```markdown
   ## Verify Redis Persistence

   After starting the production stack:

   ```bash
   # Check AOF is enabled
   docker exec mittwald-mcp-redis redis-cli CONFIG GET appendonly
   # Should return: "appendonly" "yes"

   # Check sync mode
   docker exec mittwald-mcp-redis redis-cli CONFIG GET appendfsync
   # Should return: "appendfsync" "everysec"

   # Check eviction policy
   docker exec mittwald-mcp-redis redis-cli CONFIG GET maxmemory-policy
   # Should return: "maxmemory-policy" "volatile-lru"

   # Test persistence
   docker exec mittwald-mcp-redis redis-cli SET test-key "test-value"
   docker restart mittwald-mcp-redis
   docker exec mittwald-mcp-redis redis-cli GET test-key
   # Should return: "test-value"
   ```
   ```

**Files**:
- MODIFY: `docs/quickstart.md` or relevant quickstart file

**Parallel?**: Yes - documentation can be written anytime

## Test Strategy

**Validation**:
- Start production stack, verify CONFIG GET returns expected values
- Write key, restart Redis, verify key persists
- Fill memory to trigger eviction, verify only TTL keys evicted

**No Automated Tests**: Infrastructure configuration validated manually

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Performance degradation | AOF everysec adds <1% overhead; benchmark if needed |
| Disk space growth | Configure AOF rewrite thresholds (`auto-aof-rewrite-*`) |
| Breaking existing data | AOF is additive; existing RDB data still loads |

## Definition of Done Checklist

- [ ] `docker-compose.prod.yml` has AOF enabled
- [ ] `appendfsync everysec` configured
- [ ] `maxmemory-policy` is `volatile-lru`
- [ ] `maxmemory` increased to 512mb
- [ ] Operations documentation created
- [ ] Verification commands documented
- [ ] Manual testing confirms persistence across restart

## Review Guidance

- Verify production and development configs are different
- Test actual container restart to confirm persistence
- Check Redis INFO output for persistence stats
- Verify disk volume is properly mounted

## Activity Log

- 2025-12-03T14:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
