# Redis Configuration

## Production Settings

| Setting | Value | Purpose |
|---------|-------|---------|
| maxmemory | 512mb | Memory limit for Redis |
| maxmemory-policy | volatile-lru | Only evict keys with TTL set |
| appendonly | yes | Enable AOF persistence |
| appendfsync | everysec | Sync to disk every second |

## Data Durability

- **Maximum data loss**: 1 second of writes (worst case on crash)
- **Persistence**: AOF (Append Only File) at `/data/appendonly.aof`
- **Recovery**: Automatic replay of AOF on container restart

## Key Types and TTL

| Key Pattern | TTL | Evictable |
|-------------|-----|-----------|
| `session:{id}` | 24 hours | Yes (has TTL) |
| `auth_request:{state}` | 10 minutes | Yes (has TTL) |
| `reg_token:{client_id}` | 30 days | Yes (has TTL) |

With `volatile-lru` policy, only keys with TTL can be evicted under memory pressure. This protects any permanent keys while allowing session cleanup.

## Monitoring Commands

```bash
# Check Redis info
docker exec mittwald-mcp-redis redis-cli INFO

# Check persistence status
docker exec mittwald-mcp-redis redis-cli INFO persistence

# Check memory usage
docker exec mittwald-mcp-redis redis-cli INFO memory

# Check current configuration
docker exec mittwald-mcp-redis redis-cli CONFIG GET appendonly
docker exec mittwald-mcp-redis redis-cli CONFIG GET appendfsync
docker exec mittwald-mcp-redis redis-cli CONFIG GET maxmemory-policy
```

## Verify Persistence

```bash
# Check AOF is enabled
docker exec mittwald-mcp-redis redis-cli CONFIG GET appendonly
# Expected: "appendonly" "yes"

# Check sync mode
docker exec mittwald-mcp-redis redis-cli CONFIG GET appendfsync
# Expected: "appendfsync" "everysec"

# Check eviction policy
docker exec mittwald-mcp-redis redis-cli CONFIG GET maxmemory-policy
# Expected: "maxmemory-policy" "volatile-lru"

# Test persistence (development only)
docker exec mittwald-mcp-redis redis-cli SET test-persistence "test-value"
docker restart mittwald-mcp-redis
sleep 2
docker exec mittwald-mcp-redis redis-cli GET test-persistence
# Expected: "test-value"
docker exec mittwald-mcp-redis redis-cli DEL test-persistence
```

## Backup Procedure

### Manual Backup

```bash
# 1. Trigger AOF rewrite to compact the file
docker exec mittwald-mcp-redis redis-cli BGREWRITEAOF

# 2. Wait for rewrite to complete
docker exec mittwald-mcp-redis redis-cli INFO persistence | grep aof_rewrite_in_progress

# 3. Copy AOF file
docker cp mittwald-mcp-redis:/data/appendonly.aof ./backup/appendonly-$(date +%Y%m%d).aof

# 4. Verify backup integrity
redis-check-aof ./backup/appendonly-$(date +%Y%m%d).aof
```

### Restore from Backup

```bash
# 1. Stop Redis container
docker stop mittwald-mcp-redis

# 2. Replace AOF file
docker cp ./backup/appendonly.aof mittwald-mcp-redis:/data/appendonly.aof

# 3. Start Redis container
docker start mittwald-mcp-redis

# 4. Verify data restored
docker exec mittwald-mcp-redis redis-cli DBSIZE
```

## Troubleshooting

### AOF File Corruption

If Redis fails to start due to AOF corruption:

```bash
# 1. Check and fix AOF file
docker exec mittwald-mcp-redis redis-check-aof --fix /data/appendonly.aof

# 2. Restart Redis
docker restart mittwald-mcp-redis
```

### Memory Issues

If Redis runs out of memory:

```bash
# Check current memory usage
docker exec mittwald-mcp-redis redis-cli INFO memory | grep used_memory_human

# Check eviction stats
docker exec mittwald-mcp-redis redis-cli INFO stats | grep evicted_keys

# Manually clear expired keys
docker exec mittwald-mcp-redis redis-cli DEBUG QUICKLIST
```

## Development vs Production

| Setting | Development | Production |
|---------|-------------|------------|
| appendonly | no (default) | yes |
| appendfsync | - | everysec |
| maxmemory | 256mb | 512mb |
| maxmemory-policy | allkeys-lru | volatile-lru |

Development uses the default `docker-compose.yml` which prioritizes fast restart over persistence. Production uses `docker-compose.prod.yml` with durability settings.
