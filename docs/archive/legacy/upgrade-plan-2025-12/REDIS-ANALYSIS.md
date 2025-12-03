# Redis Persistence Analysis - December 2025

## Executive Summary

**Question:** Is Redis state persisted between restarts?

**Answer:** **PARTIALLY** - The Docker Compose configuration mounts a volume for persistence, but Redis is NOT configured for AOF (Append-Only File) persistence. This means:

- Sessions may survive restarts (if RDB snapshot exists)
- Up to 5 minutes of data loss possible on crash
- Memory pressure can evict active sessions prematurely

---

## Current Configuration

### docker-compose.yml (Development)
```yaml
redis:
  image: redis:7-alpine
  volumes:
    - redis-data:/data
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

### docker-compose.prod.yml (Production)
```yaml
redis:
  image: redis:7-alpine
  volumes:
    - redis-data:/data
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

**Note:** Both configs are identical - production should have stricter persistence.

---

## Analysis

### What's Good

| Feature | Status |
|---------|--------|
| Named volume (`redis-data:/data`) | Survives container removal |
| Memory limit (256MB) | Prevents runaway memory |
| Alpine image (redis:7-alpine) | Small, secure image |

### What's Missing

| Feature | Status | Risk |
|---------|--------|------|
| `--appendonly yes` | **MISSING** | Up to 5 min data loss on crash |
| `--appendfsync everysec` | **MISSING** | No guaranteed sync interval |
| Memory policy | `allkeys-lru` | May evict unexpired sessions |

### Default Redis Persistence Behavior

Without explicit AOF configuration, Redis uses RDB snapshots with defaults:
- Save after 3600 seconds if at least 1 key changed
- Save after 300 seconds if at least 100 keys changed
- Save after 60 seconds if at least 10000 keys changed

For this MCP server with moderate session traffic, the 300s/100 keys rule likely applies, meaning **5 minutes of data loss** on unexpected shutdown.

---

## Session Data at Risk

### MCP Session Manager
```
Key: session:{uuid}
Contains:
  - mittwaldAccessToken (sensitive)
  - mittwaldRefreshToken (sensitive)
  - oauthToken
  - userId
  - currentContext (projectId, serverId, orgId)
  - expiresAt
  - scopes

TTL: 8 hours default
```

**Impact of loss:** Users must re-authenticate through OAuth flow.

### OAuth Bridge State
```
Keys:
  - bridge:authreq:{state} (short-lived, ~10 min)
  - bridge:grant:{code} (short-lived, ~10 min)
  - bridge:client:{id} (long-lived, no TTL)

Impact of loss:
  - authreq/grant: OAuth flows in progress will fail
  - client: Dynamic client registrations lost (if DCR enabled)
```

---

## Recommendations

### Option 1: Enable AOF Persistence (Recommended)

```yaml
# docker-compose.yml
redis:
  image: redis:7-alpine
  volumes:
    - redis-data:/data
  command: >
    redis-server
    --maxmemory 256mb
    --maxmemory-policy volatile-lru
    --appendonly yes
    --appendfsync everysec
```

**Changes:**
- `--appendonly yes`: Enable AOF persistence
- `--appendfsync everysec`: Sync to disk every second (1s data loss max)
- `--maxmemory-policy volatile-lru`: Only evict keys with TTL set (safer)

### Option 2: Hybrid Persistence

```yaml
command: >
  redis-server
  --maxmemory 512mb
  --maxmemory-policy volatile-ttl
  --appendonly yes
  --appendfsync everysec
  --aof-rewrite-incremental-fsync yes
  --save 900 1
  --save 300 10
  --save 60 10000
```

**Benefits:**
- AOF for durability
- RDB snapshots for faster recovery
- `volatile-ttl`: Evict keys closest to expiry first

### Option 3: Accept Ephemeral Sessions (Current State)

If session loss on restart is acceptable:
- Keep current configuration
- Document that users may need to re-authenticate after server restarts
- Ensure graceful shutdown in deployment scripts

---

## Production Considerations

### For Fly.io / Cloud Deployment

If deploying to Fly.io with managed Redis (Upstash):
- Upstash Redis has built-in persistence
- No configuration changes needed
- Check Upstash persistence settings in dashboard

### For Self-Hosted Redis

```yaml
# docker-compose.prod.yml (recommended changes)
redis:
  image: redis:7-alpine
  volumes:
    - redis-data:/data
  command: >
    redis-server
    --maxmemory 512mb
    --maxmemory-policy volatile-lru
    --appendonly yes
    --appendfsync everysec
  deploy:
    resources:
      limits:
        memory: 768M
  restart: always
```

---

## Verification Commands

```bash
# Check current Redis persistence config
docker exec -it mittwald-mcp-redis-1 redis-cli CONFIG GET appendonly
docker exec -it mittwald-mcp-redis-1 redis-cli CONFIG GET save

# Check if AOF file exists
docker exec -it mittwald-mcp-redis-1 ls -la /data/

# Force RDB snapshot
docker exec -it mittwald-mcp-redis-1 redis-cli BGSAVE

# Check memory usage
docker exec -it mittwald-mcp-redis-1 redis-cli INFO memory
```

---

## Action Items

- [ ] **Task R1:** Update `docker-compose.yml` to add `--appendonly yes --appendfsync everysec`
- [ ] **Task R2:** Update `docker-compose.prod.yml` with production-safe Redis config
- [ ] **Task R3:** Change memory policy to `volatile-lru` (only evict keys with TTL)
- [ ] **Task R4:** Document session recovery behavior in operational runbook
- [ ] **Task R5:** Add Redis persistence health check to monitoring

---

## Clarification: No DatabaseConnection Issue

The comment about "DCRServer" with "TODO: Persist client to database" does **NOT exist in this codebase**.

- No `DCRServer` class found
- No `app.ts` with database dependencies
- No `DatabaseConnection` imports anywhere
- The OAuth bridge has a complete `RedisStateStore` implementation

The other agent may have been working on a different project or referencing stale documentation.

---

*Analysis completed: 2025-12-03*
