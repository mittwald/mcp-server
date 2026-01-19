# CS-005: Container Stack Deployment

## Persona

**Segment**: SEG-005 Modern Stack Developer
**Role**: Full-stack developer building a SaaS application with containerized microservices
**Context**: You're deploying a new internal tool for a client: a Next.js frontend, a Strapi headless CMS for content management, and a PostgreSQL database—all running as Docker containers. The client wants infrastructure-as-code and easy scaling.

## Problem

Deploying containerized applications on traditional hosting requires juggling multiple tools: setting up a container registry to store images, configuring Docker Compose files, managing persistent volumes for database data, and verifying that all services start correctly. Each deployment involves SSH sessions, manual docker commands, and hoping the compose file syntax is correct. When something fails, debugging requires checking logs across multiple containers. A typical first deployment takes 2-4 hours of configuration and troubleshooting, and subsequent updates still require careful orchestration to avoid downtime.

## Solution: MCP Workflow

### Prerequisites

- Mittwald MCP server connected to Claude Code
- Active Mittwald project with container hosting enabled
- Project ID available (e.g., `p-saasapp`)
- Docker Compose file ready (`docker-compose.yml`)
- Container images built and ready to push

### Step 1: Check Existing Container Infrastructure

```
List all container registries in my SaaS App project.
I need to see if we have a registry set up for our Docker images.
```

**Tools Used**: `registry/list`
**Expected Output**: Registry inventory:
- No registries found (new project)
- Or existing registry: `registry.mittwald.de/p-saasapp` (if previously configured)
- Recommendation: Create dedicated registry for this stack

### Step 2: Create Container Registry

```
Create a new container registry for the SaaS App project.
I'll use this to store our Next.js and Strapi Docker images.
```

**Tools Used**: `registry/create`
**Expected Output**: Registry created:
- Registry URL: `registry.mittwald.de/p-saasapp`
- Authentication: Project credentials
- Push command: `docker push registry.mittwald.de/p-saasapp/frontend:latest`
- Storage quota: 10GB included

### Step 3: Deploy the Docker Compose Stack

```
Deploy my Docker Compose stack to the SaaS App project. The stack includes:
- frontend (Next.js on port 3000)
- cms (Strapi on port 1337)
- db (PostgreSQL on port 5432)

Use the docker-compose.yml from my project root.
```

**Tools Used**: `stack/deploy`
**Expected Output**: Stack deployment initiated:
- Stack name: `saasapp-stack`
- Services: 3 (frontend, cms, db)
- Status: Deploying
- Pulling images from registry.mittwald.de/p-saasapp/
- Network created: `saasapp-network`
- Estimated startup time: 2-3 minutes

### Step 4: List All Deployed Stacks

```
List all deployed stacks in this project. I want to verify
the SaaS App stack was created successfully.
```

**Tools Used**: `stack/list`
**Expected Output**: Stack inventory:
- `saasapp-stack`
  - Created: 2025-01-19 14:32:00
  - Services: 3
  - Status: Running
  - Compose version: 3.8

### Step 5: Check Container Status

```
Show me the status of all containers in the saasapp-stack.
I need to verify all services are running and healthy.
```

**Tools Used**: `stack/ps`
**Expected Output**: Container status for `saasapp-stack`:
| Container | Image | Status | Ports |
|-----------|-------|--------|-------|
| frontend | p-saasapp/frontend:latest | Running (healthy) | 3000→3000 |
| cms | p-saasapp/strapi:latest | Running (healthy) | 1337→1337 |
| db | postgres:15 | Running (healthy) | 5432→5432 |

All 3 containers running, health checks passing.

### Step 6: Verify Persistent Volumes

```
List all persistent volumes in this project. I need to confirm
the PostgreSQL data volume is properly configured for data persistence.
```

**Tools Used**: `volume/list`
**Expected Output**: Volume inventory:
- `saasapp-stack_postgres_data`
  - Size: 1.2GB used
  - Mount: `/var/lib/postgresql/data`
  - Driver: local
  - Status: In use by `db` container
- `saasapp-stack_strapi_uploads`
  - Size: 45MB used
  - Mount: `/srv/app/public/uploads`
  - Status: In use by `cms` container

### Step 7: List All Running Containers

```
Show me all running containers across the entire project,
not just this stack. I want a complete container inventory.
```

**Tools Used**: `container/list`
**Expected Output**: Project container inventory:
- `saasapp-stack_frontend_1` - Running, 256MB memory
- `saasapp-stack_cms_1` - Running, 512MB memory
- `saasapp-stack_db_1` - Running, 384MB memory
- Total: 3 containers, 1.15GB memory allocated
- No orphaned containers from previous deployments

### Step 8: Verify Stack Health Summary

```
Give me a deployment summary for the SaaS App:
- Stack status and all services
- Volume persistence confirmation
- Registry usage
```

**Tools Used**: `stack/ps`, `volume/list`, `registry/list`
**Expected Output**: Deployment Summary:
- ✅ Stack: `saasapp-stack` running with 3 healthy services
- ✅ Volumes: 2 persistent volumes mounted correctly
- ✅ Registry: Images stored at `registry.mittwald.de/p-saasapp`
- ✅ Network: Internal service discovery working
- Frontend accessible at: https://saasapp.mittwald.de
- CMS admin at: https://saasapp.mittwald.de:1337/admin

## Outcomes

- **Time Saved**: 2-4 hours of initial deployment reduced to 15-20 minutes. Subsequent stack updates take under 5 minutes. No SSH sessions or manual docker commands required.
- **Error Reduction**: Container status visible at a glance (no more `docker ps` over SSH), volume persistence verified before going live, registry configuration automated. Stack deployment is reproducible and consistent.
- **Next Steps**:
  - Set up CI/CD pipeline to auto-deploy on git push
  - Configure stack scaling with `stack/deploy --scale frontend=3`
  - Add monitoring with container health alerts
  - Create staging stack for pre-production testing

---

## Tools Used in This Case Study

| Tool | Domain | Purpose |
|------|--------|---------|
| `registry/list` | containers | Check existing registries |
| `registry/create` | containers | Create image registry |
| `stack/deploy` | containers | Deploy Docker Compose stack |
| `stack/list` | containers | List deployed stacks |
| `stack/ps` | containers | Check container status |
| `volume/list` | containers | Verify persistent volumes |
| `container/list` | containers | Full container inventory |

**Total Tools**: 7 primary workflow tools (all from containers domain)
