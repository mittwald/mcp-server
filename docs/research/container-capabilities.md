# Mittwald Container Capabilities Research

## Overview

Mittwald provides comprehensive container support through their API, allowing users to deploy and manage containerized applications. The container functionality is available for PS and SS plans.

## Core Container Concepts

### 1. Container Stacks
- Containers run as part of a **Container Stack**
- A stack is a collection of containers and volumes that run together
- Each project has a **default stack** that is automatically created
- Multiple stacks per project are planned but not yet supported

### 2. Container Services
- Individual containers within a stack are called **services**
- Services can have:
  - Custom images from public or private registries
  - Environment variables
  - Port mappings
  - Volume mounts
  - Custom entrypoint and command

### 3. Container Registries
- Support for public and private container registries
- Pre-defined registries:
  - `index.docker.io` (Docker Hub)
  - `registry.gitlab.com` (GitLab Container Registry)
  - `ghcr.io` (GitHub Container Registry)
- Custom private registries can be added with credentials

### 4. Volumes
- Two types of volumes:
  - **Project volume**: Shared across all containers and apps in a project
  - **Stack volumes**: Bound to a specific container stack
- Volumes are automatically backed up with project backups

## API Operations

### Container Stack Operations
- `container-list-stacks`: List available stacks
- `container-get-stack`: Get stack details
- `container-declare-stack`: Declare desired state (idempotent)
- `container-update-stack`: Selectively update services/volumes

### Container Service Operations
- `container-list-services`: List services in a project
- `container-get-service`: Get service details
- `container-start-service`: Start a service
- `container-stop-service`: Stop a service
- `container-restart-service`: Restart a service
- `container-recreate-service`: Recreate a service
- `container-pull-image-for-service`: Pull latest image
- `container-get-service-logs`: Get service logs

### Container Registry Operations
- `container-list-registries`: List registries
- `container-create-registry`: Create registry
- `container-get-registry`: Get registry details
- `container-update-registry`: Update registry
- `container-delete-registry`: Delete registry
- `container-validate-registry-credentials`: Validate credentials
- `container-validate-container-registry-uri`: Validate URI

### Container Volume Operations
- `container-list-volumes`: List volumes
- `container-get-volume`: Get volume details
- `container-delete-volume`: Delete volume

### Container Image Operations
- `container-get-container-image-config`: Get image configuration

## Deployment Strategies

### 1. Immutable Deployment
- Create new container image for each release
- Use versioned tags (e.g., `v1.0.1`)
- Keep old images for rollback

### 2. Mutable Deployment
- Use same tag (e.g., `latest`) for all versions
- Update image and pull latest version

## Networking

### Internal Connectivity
- Containers and managed apps share the same network
- Container hostname derived from service name
- Internal DNS resolution available

### External Access (HTTP/HTTPS only)
- Create Ingress resources to expose HTTP ports
- Non-HTTP protocols not supported for external access
- Use `ingress-create-ingress` operation

## CLI Support

Current CLI commands (via `mw` CLI):
- `stack list` / `stack ls`: List container stacks
- `stack ps`: List services within a stack
- `stack delete`: Delete a stack

Note: Full container management via CLI is not yet supported. There's an open feature request (#1150) for complete CLI support.

## Integration with CI/CD

### GitHub Actions
- Official action: `mittwald/deploy-container-action`
- Supports automated deployment from GitHub
- Features:
  - Build and push to container registry
  - Deploy to Mittwald platform
  - Selective service recreation
  - Environment-based deployments

## Implementation Status in MCP

### Already Implemented
- Container type definitions in `/src/types/mittwald/container.ts`
- All necessary TypeScript types for:
  - Registries
  - Stacks
  - Services
  - Volumes
  - Request/Response types

### Not Yet Implemented
- No container-related tools in `/src/tools/`
- No container command constants
- No container handlers

## Recommendations for MCP Implementation

1. **Priority Tools to Implement**:
   - `container-list-stacks`
   - `container-declare-stack`
   - `container-list-services`
   - `container-get-service-logs`
   - `container-create-registry`

2. **Advanced Tools**:
   - `container-start-service`
   - `container-stop-service`
   - `container-restart-service`
   - `container-pull-image-for-service`

3. **Resource Management Tools**:
   - `container-list-volumes`
   - `container-list-registries`

4. **Deployment Tools**:
   - Stack declaration with services and volumes
   - Registry credential management
   - Service recreation after updates

## Example Container Stack Declaration

```typescript
{
  services: {
    myapp: {
      image: "nginx:1.27.4",
      description: "Web server",
      entrypoint: ["/docker-entrypoint.sh"],
      command: ["nginx", "-g", "daemon off;"],
      ports: ["80:80/tcp"],
      envs: {
        FOO: "bar"
      },
      volumes: ["data:/usr/share/nginx/html"]
    }
  },
  volumes: {
    data: {}
  }
}
```

## Limitations

1. External access only supported for HTTP/HTTPS
2. Multiple stacks per project not yet available
3. No direct Docker socket access
4. Container must be reachable from internet (no firewall-hidden registries)
5. CLI support is limited