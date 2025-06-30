# Container Management Quick Reference

## Essential Commands at a Glance

### 🔍 Discovery Commands

| What you want | Say this | Tool Called |
|--------------|----------|-------------|
| List stacks | "Show me container stacks in project X" | `mittwald_container_list_stacks` |
| List services | "What containers are running?" | `mittwald_container_list_services` |
| List volumes | "Show persistent volumes" | `mittwald_container_list_volumes` |
| List registries | "What registries are configured?" | `mittwald_container_list_registries` |

### 🚀 Deployment Commands

| What you want | Say this | Tool Called |
|--------------|----------|-------------|
| Deploy container | "Run nginx in my stack" | `mittwald_container_declare_stack` |
| Deploy with env vars | "Deploy app with NODE_ENV=production" | `mittwald_container_declare_stack` |
| Deploy multiple | "Set up WordPress with MySQL" | `mittwald_container_declare_stack` |
| Update container | "Change image to nginx:alpine" | `mittwald_container_declare_stack` |
| Remove container | "Delete the redis container" | `mittwald_container_declare_stack` |

### 💾 Storage Commands

| What you want | Say this | Tool Called |
|--------------|----------|-------------|
| Add volume | "Add 5GB storage to postgres" | `mittwald_container_declare_stack` |
| Mount project files | "Mount my HTML folder into nginx" | `mittwald_container_declare_stack` |
| Share volume | "Share data between app and worker" | `mittwald_container_declare_stack` |

### 🔐 Registry Commands

| What you want | Say this | Tool Called |
|--------------|----------|-------------|
| Add Docker Hub | "Configure Docker Hub with my credentials" | `mittwald_container_create_registry` |
| Add GitHub Registry | "Set up GitHub Container Registry" | `mittwald_container_create_registry` |
| Add GitLab Registry | "Configure GitLab registry access" | `mittwald_container_create_registry` |

### 📊 Monitoring Commands

| What you want | Say this | Tool Called |
|--------------|----------|-------------|
| View logs | "Show logs from my API container" | `mittwald_container_get_service_logs` |
| Recent logs | "Last 100 lines from nginx" | `mittwald_container_get_service_logs` |
| Time-based logs | "Logs from the last hour" | `mittwald_container_get_service_logs` |

## Common Deployment Patterns

### Single Container
```yaml
"Deploy nginx web server"
→ Creates: nginx:latest on port 80
```

### App + Database
```yaml
"Set up Node.js app with PostgreSQL"
→ Creates: 
  - node:18-alpine (port 3000)
  - postgres:15 (port 5432)
  - Persistent volumes for data
```

### Full Stack Application
```yaml
"Deploy WordPress with MySQL and phpMyAdmin"
→ Creates:
  - wordpress:latest (port 80)
  - mysql:8.0 (port 3306)
  - phpmyadmin:latest (port 80)
  - Persistent volumes for both
```

### Microservices
```yaml
"Create API, Redis cache, and Postgres database"
→ Creates:
  - API service
  - Redis with password
  - PostgreSQL with credentials
  - Volumes for persistence
```

## Image Sources

### Public Images
- `nginx:latest` - Docker Hub
- `node:18-alpine` - Docker Hub
- `postgres:15` - Docker Hub
- `redis:7-alpine` - Docker Hub

### Private Images
- `ghcr.io/myorg/app:v1.0.0` - GitHub
- `registry.gitlab.com/myorg/app:latest` - GitLab
- `myregistry.com/app:prod` - Custom

## Volume Types

### Stack Volumes
```json
"volumes": [{
  "name": "data-volume",
  "mountPath": "/data"
}]
```

### Project Volumes
```json
"volumes": [{
  "name": "/home/p-abc123/html",
  "mountPath": "/usr/share/nginx/html"
}]
```

## Environment Variables

### Database Containers
```
MYSQL_ROOT_PASSWORD
MYSQL_DATABASE
MYSQL_USER
MYSQL_PASSWORD

POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB

REDIS_PASSWORD
```

### Application Containers
```
NODE_ENV
PORT
DATABASE_URL
API_KEY
DEBUG
```

## Port Mappings

### Common Ports
- **80** - HTTP (nginx, Apache)
- **443** - HTTPS
- **3000** - Node.js apps
- **3306** - MySQL
- **5432** - PostgreSQL
- **6379** - Redis
- **8080** - Alternative HTTP
- **9200** - Elasticsearch

## Quick Examples

### "Deploy a web server"
```json
{
  "desiredServices": {
    "web": {
      "imageUri": "nginx:alpine",
      "ports": [{"containerPort": 80}]
    }
  }
}
```

### "Add Redis cache"
```json
{
  "desiredServices": {
    "redis": {
      "imageUri": "redis:7-alpine",
      "environment": {"REDIS_PASSWORD": "secret"},
      "ports": [{"containerPort": 6379}],
      "volumes": [{"name": "redis-data", "mountPath": "/data"}]
    }
  },
  "desiredVolumes": {
    "redis-data": {"size": "1Gi"}
  }
}
```

### "Database with backup"
```json
{
  "desiredServices": {
    "postgres": {
      "imageUri": "postgres:15",
      "environment": {
        "POSTGRES_PASSWORD": "secure123"
      },
      "volumes": [{
        "name": "pg-data",
        "mountPath": "/var/lib/postgresql/data"
      }]
    }
  },
  "desiredVolumes": {
    "pg-data": {"size": "10Gi"}
  }
}
```

## Networking

### Internal Communication
- Containers can reach each other by service name
- Example: `mysql:3306`, `redis:6379`, `api:8080`

### External Access
- Define ports in service configuration
- Use virtualhost tools for HTTP(S) ingress
- Non-HTTP protocols not supported externally

## Best Practices Checklist

✅ Use specific image tags (not `:latest`)  
✅ Set strong passwords for databases  
✅ Create volumes for persistent data  
✅ Use environment variables for config  
✅ Check logs after deployment  
✅ Test locally before deploying  
✅ Plan your volume strategy  
✅ Monitor resource usage  

## Common Issues

### 🚫 Container Won't Start
1. Check image name/tag
2. Verify environment variables
3. Check port conflicts
4. Review logs

### 🚫 Can't Pull Image
1. Configure registry first
2. Check credentials
3. Verify image URI

### 🚫 Services Can't Connect
1. Use service name as hostname
2. Check they're in same stack
3. Verify port numbers

### 🚫 Data Lost on Update
1. Always use volumes for data
2. Mount at correct path
3. Set proper permissions