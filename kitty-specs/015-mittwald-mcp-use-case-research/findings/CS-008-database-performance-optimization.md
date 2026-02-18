# CS-008: Database Performance Optimization

## Persona

**Segment**: SEG-003 E-commerce Specialist
**Role**: WooCommerce developer maintaining a high-traffic fashion e-commerce store
**Context**: Black Friday is in 3 weeks. Last year, the checkout process slowed to 15+ seconds during peak traffic, and the store lost an estimated €12,000 in abandoned carts. The client wants assurance this won't happen again.

## Problem

E-commerce database performance issues often surface at the worst possible time: during sales events when traffic spikes 10x. Diagnosing the problem requires logging into phpMyAdmin, checking MySQL configuration, wondering if a cache layer would help, and hoping you have the right MySQL version for the needed features. There's no unified view of database health—you check MySQL settings in one place, wonder about Redis in another, and have no idea which database users exist or what permissions they have. When performance degrades, you're troubleshooting blind while customers abandon their carts.

## Solution: MCP Workflow

### Prerequisites

- Mittwald MCP server connected to Claude Code
- Active Mittwald project with WooCommerce/Shopware installed
- Project ID available (e.g., `p-fashionstore`)
- Knowledge that checkout is slow (symptom)

### Step 1: Inventory All MySQL Databases

```
List all MySQL databases in the Fashion Store project.
I need to understand what databases exist and their sizes
before investigating performance issues.
```

**Tools Used**: `database/mysql/list`
**Expected Output**: Database inventory:
| Database | Size | Created | Status |
|----------|------|---------|--------|
| fashionstore_woo | 4.8GB | 2023-06-15 | Active |
| fashionstore_staging | 2.1GB | 2024-01-10 | Active |
| fashionstore_analytics | 0.8GB | 2024-03-22 | Active |

Total: 3 databases consuming 7.7GB.
Note: Production database (fashionstore_woo) is largest at 4.8GB.

### Step 2: Check Production Database Configuration

```
Get detailed configuration for the fashionstore_woo database.
I need to verify MySQL version, character set, and connection
settings to identify potential bottlenecks.
```

**Tools Used**: `database/mysql/get`
**Expected Output**: Database details for `fashionstore_woo`:
- **MySQL version**: 8.0.32
- **Character set**: utf8mb4
- **Collation**: utf8mb4_unicode_ci
- **Max connections**: 100 (⚠️ may be low for Black Friday traffic)
- **Storage engine**: InnoDB
- **Buffer pool size**: 1GB
- **Slow query log**: Enabled (queries > 2s)
- **Current connections**: 23/100

Observation: Connection limit of 100 may bottleneck during peak traffic.

### Step 3: Check Available MySQL Versions

```
What MySQL versions are available for upgrade? I want to see if
there's a newer version with performance improvements we should consider.
```

**Tools Used**: `database/mysql/versions`
**Expected Output**: Available MySQL versions:
| Version | Status | Notes |
|---------|--------|-------|
| 8.0.32 | Current | Installed on fashionstore_woo |
| 8.0.35 | Available | Bug fixes, performance improvements |
| 8.0.36 | Available | Latest stable, recommended |

Recommendation: Upgrade to 8.0.36 for latest optimizations before Black Friday.

### Step 4: Audit Database Users and Permissions

```
List all database users for the fashionstore_woo database.
I need to verify there are no orphaned accounts and
permissions are properly scoped.
```

**Tools Used**: `database/mysql/user/list`
**Expected Output**: Database users for `fashionstore_woo`:
| Username | Host | Privileges | Created |
|----------|------|------------|---------|
| fashionstore_app | localhost | ALL | 2023-06-15 |
| fashionstore_ro | % | SELECT | 2024-02-10 |
| backup_user | localhost | SELECT, LOCK | 2023-08-01 |
| old_dev_user | % | ALL | 2023-07-20 ⚠️ |

⚠️ Alert: `old_dev_user` has full access from any host—security risk and should be removed.

### Step 5: Check Existing Redis Instances

```
List any Redis instances configured for this project.
I want to see if we already have a cache layer or need to create one.
```

**Tools Used**: `database/redis/list`
**Expected Output**: Redis instances for Fashion Store:
- No Redis instances configured

Recommendation: Add Redis for session storage and object caching to reduce MySQL load during peak traffic.

### Step 6: Create Redis Cache Instance

```
Create a Redis instance for the Fashion Store project.
This will be used for WooCommerce session storage and object caching
to reduce database load during Black Friday.
```

**Tools Used**: `database/redis/create`
**Expected Output**: Redis instance created:
- **Instance ID**: `redis-fashionstore-001`
- **Version**: Redis 7.2
- **Memory**: 512MB (expandable)
- **Max connections**: 1000
- **Connection string**: `redis://redis-fashionstore-001.mittwald.de:6379`
- **Status**: Running

Next step: Configure WooCommerce to use Redis for sessions and object cache.

### Step 7: Generate Performance Readiness Summary

```
Give me a performance readiness summary for the Fashion Store:
- Database configuration status
- Redis cache status
- Any security concerns
- Recommendations for Black Friday
```

**Tools Used**: `database/mysql/get`, `database/redis/list`, `database/mysql/user/list`
**Expected Output**: Performance Readiness Summary:

**Database Health**:
- ✅ MySQL 8.0.32 running (recommend upgrade to 8.0.36)
- ⚠️ Connection limit 100 (consider increasing to 200)
- ✅ Slow query logging enabled

**Caching**:
- ✅ Redis instance created (512MB, 1000 connections)
- ⏳ WooCommerce Redis integration pending configuration

**Security**:
- ⚠️ `old_dev_user` should be removed (full access, any host)
- ✅ Other users properly scoped

**Black Friday Recommendations**:
1. Upgrade MySQL to 8.0.36
2. Increase connection limit to 200
3. Configure WooCommerce Redis plugin
4. Remove orphaned database user
5. Test under load before event

## Outcomes

- **Time Saved**: Hours of phpMyAdmin investigation and guesswork reduced to a 15-minute MCP audit. Complete visibility into database configuration, user permissions, and caching status in one session.
- **Error Reduction**: Discovered orphaned high-privilege user (`old_dev_user`) that was a security risk. Identified connection limit bottleneck before it caused Black Friday failures. Redis setup ensures cache layer is ready.
- **Next Steps**:
  - Schedule MySQL version upgrade during low-traffic window
  - Configure WooCommerce Redis Object Cache plugin
  - Remove orphaned database user
  - Create performance monitoring dashboard
  - Run load test simulating Black Friday traffic

---

## Tools Used in This Case Study

| Tool | Domain | Purpose |
|------|--------|---------|
| `database/mysql/list` | databases | Inventory all MySQL databases |
| `database/mysql/get` | databases | Check database configuration |
| `database/mysql/versions` | databases | Check available MySQL versions |
| `database/mysql/user/list` | databases | Audit database users |
| `database/redis/list` | databases | Check existing Redis instances |
| `database/redis/create` | databases | Create Redis cache instance |

**Total Tools**: 6 primary workflow tools (all from databases domain)
