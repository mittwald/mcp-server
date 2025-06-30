# Container Management in Mittwald MCP

This document describes the container management capabilities available through the Mittwald MCP server.

## 📚 Additional Documentation

- **[User Guide](./CONTAINER_USER_GUIDE.md)** - Natural language examples and prompts
- **[Quick Reference](./CONTAINER_QUICK_REFERENCE.md)** - Command cheat sheet and patterns
- **[Example Conversation](./CONTAINER_EXAMPLE_CONVERSATION.md)** - Real-world deployment scenario
- **[Implementation Summary](./CONTAINER_IMPLEMENTATION_SUMMARY.md)** - Technical implementation details

## Overview

Mittwald provides a comprehensive container platform that allows you to deploy Docker containers alongside traditional applications. The platform uses a **stack-based approach** where containers run as services within stacks.

## Available Container Tools

### Stack Management

#### `mittwald_container_list_stacks`
Lists all container stacks in a project.

**Parameters:**
- `projectId` (required): Project ID
- `output`: Output format (json, table, csv, tsv)
- `extended`: Show extended information

**Example:**
```json
{
  "projectId": "p-xxxxx",
  "output": "json"
}
```

#### `mittwald_container_declare_stack`
Declaratively manage services and volumes in a stack. This is idempotent - services/volumes not in the declaration will be removed.

**Parameters:**
- `stackId` (required): Stack ID
- `desiredServices`: Map of service configurations
- `desiredVolumes`: Map of volume configurations

**Example:**
```json
{
  "stackId": "stack-xxxxx",
  "desiredServices": {
    "webapp": {
      "imageUri": "node:18-alpine",
      "environment": {
        "NODE_ENV": "production",
        "PORT": "3000"
      },
      "ports": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "volumes": [
        {
          "name": "app-data",
          "mountPath": "/app/data",
          "readOnly": false
        }
      ]
    }
  },
  "desiredVolumes": {
    "app-data": {
      "size": "1Gi"
    }
  }
}
```

### Service Management

#### `mittwald_container_list_services`
Lists all container services in a project.

**Parameters:**
- `projectId` (required): Project ID
- `output`: Output format
- `extended`: Show extended information

#### `mittwald_container_get_service_logs`
Retrieves logs from a container service.

**Parameters:**
- `stackId` (required): Stack ID
- `serviceId` (required): Service ID
- `since`: Show logs since timestamp (RFC3339)
- `until`: Show logs until timestamp (RFC3339)
- `limit`: Maximum number of log lines

**Example:**
```json
{
  "stackId": "stack-xxxxx",
  "serviceId": "service-xxxxx",
  "limit": 100
}
```

### Volume Management

#### `mittwald_container_list_volumes`
Lists all container volumes in a project.

**Parameters:**
- `projectId` (required): Project ID
- `output`: Output format

### Registry Management

#### `mittwald_container_create_registry`
Creates a container registry for pulling private images.

**Parameters:**
- `projectId` (required): Project ID
- `uri` (required): Registry URI
- `imageRegistryType`: Type of registry (docker, github, gitlab, custom)
- `username`: Registry username
- `password`: Registry password or token

**Example:**
```json
{
  "projectId": "p-xxxxx",
  "uri": "ghcr.io",
  "imageRegistryType": "github",
  "username": "myuser",
  "password": "ghp_xxxxxxxxxxxx"
}
```

#### `mittwald_container_list_registries`
Lists all container registries in a project.

## Common Use Cases

### 1. Deploy a Simple Web Application

```javascript
// Deploy nginx
await client.callTool('mittwald_container_declare_stack', {
  stackId: 'stack-xxxxx',
  desiredServices: {
    nginx: {
      imageUri: 'nginx:alpine',
      ports: [{
        containerPort: 80,
        protocol: 'tcp'
      }]
    }
  }
});
```

### 2. Deploy Application with Database

```javascript
// Deploy WordPress with MySQL
await client.callTool('mittwald_container_declare_stack', {
  stackId: 'stack-xxxxx',
  desiredServices: {
    mysql: {
      imageUri: 'mysql:8.0',
      environment: {
        MYSQL_ROOT_PASSWORD: 'secretpass',
        MYSQL_DATABASE: 'wordpress'
      },
      volumes: [{
        name: 'mysql-data',
        mountPath: '/var/lib/mysql'
      }]
    },
    wordpress: {
      imageUri: 'wordpress:latest',
      environment: {
        WORDPRESS_DB_HOST: 'mysql:3306',
        WORDPRESS_DB_PASSWORD: 'secretpass'
      },
      ports: [{
        containerPort: 80
      }]
    }
  },
  desiredVolumes: {
    'mysql-data': {
      size: '5Gi'
    }
  }
});
```

### 3. Use Private Registry

```javascript
// First create registry
await client.callTool('mittwald_container_create_registry', {
  projectId: 'p-xxxxx',
  uri: 'ghcr.io',
  imageRegistryType: 'github',
  username: 'myorg',
  password: 'ghp_token'
});

// Then deploy from private registry
await client.callTool('mittwald_container_declare_stack', {
  stackId: 'stack-xxxxx',
  desiredServices: {
    myapp: {
      imageUri: 'ghcr.io/myorg/myapp:v1.0.0',
      ports: [{
        containerPort: 8080
      }]
    }
  }
});
```

### 4. Mount Project Volume

```javascript
// Mount project files into container
await client.callTool('mittwald_container_declare_stack', {
  stackId: 'stack-xxxxx',
  desiredServices: {
    fileserver: {
      imageUri: 'nginx:alpine',
      volumes: [{
        name: '/home/p-xxxxx/html',
        mountPath: '/usr/share/nginx/html',
        readOnly: true
      }]
    }
  }
});
```

## Important Notes

1. **Stack-based Deployment**: All containers run within stacks. Each project has at least one stack.

2. **Declarative Management**: The `declare_stack` operation is idempotent. It will create, update, or delete services/volumes to match your declaration.

3. **Internal Networking**: Containers can communicate with each other using service names as hostnames.

4. **Volume Types**:
   - Stack volumes: Created within the stack declaration
   - Project volumes: Use absolute paths like `/home/p-xxxxx/html`

5. **Port Exposure**: Define ports in the service configuration. HTTP(S) ingress requires additional configuration (not covered by these tools).

6. **Registry Support**: Supports Docker Hub, GitHub Container Registry, GitLab Container Registry, and custom registries.

## Limitations

1. **No Direct Ingress Management**: These tools don't handle external HTTP(S) access. Use the domain/virtualhost tools for that.

2. **No Container Exec**: Cannot execute commands inside running containers through these tools.

3. **No Build Support**: Containers must be pre-built and available in a registry.

4. **HTTP(S) Only for External Access**: Non-HTTP protocols cannot be exposed externally.

## Best Practices

1. **Use Specific Tags**: Avoid using `latest` tag in production. Use specific version tags.

2. **Manage Secrets Carefully**: Don't hardcode sensitive data in environment variables.

3. **Plan Volume Strategy**: Decide between stack volumes and project volumes based on your needs.

4. **Test Locally First**: Test your container configurations locally before deploying.

5. **Monitor Resources**: Keep an eye on container resource usage through logs.