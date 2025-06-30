# Container Management User Guide

This guide demonstrates how to use natural language prompts to manage containers in your Mittwald projects. Each example shows the user prompt and the corresponding MCP tool calls that would be executed.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Container Operations](#basic-container-operations)
3. [Multi-Container Applications](#multi-container-applications)
4. [Working with Volumes](#working-with-volumes)
5. [Private Registries](#private-registries)
6. [Monitoring and Logs](#monitoring-and-logs)
7. [Advanced Scenarios](#advanced-scenarios)

## Getting Started

### Check Container Support in a Project

**User Prompt:**
> "Show me the container stacks in project p-abc123"

**Expected Tool Calls:**
```json
{
  "tool": "mittwald_container_list_stacks",
  "arguments": {
    "projectId": "p-abc123",
    "output": "json"
  }
}
```

### List All Container Resources

**User Prompt:**
> "Give me an overview of all containers, volumes, and registries in my project p-abc123"

**Expected Tool Calls:**
```json
[
  {
    "tool": "mittwald_container_list_stacks",
    "arguments": {
      "projectId": "p-abc123",
      "output": "json"
    }
  },
  {
    "tool": "mittwald_container_list_services",
    "arguments": {
      "projectId": "p-abc123",
      "output": "json"
    }
  },
  {
    "tool": "mittwald_container_list_volumes",
    "arguments": {
      "projectId": "p-abc123",
      "output": "json"
    }
  },
  {
    "tool": "mittwald_container_list_registries",
    "arguments": {
      "projectId": "p-abc123",
      "output": "json"
    }
  }
]
```

## Basic Container Operations

### Deploy a Simple Web Server

**User Prompt:**
> "Deploy an nginx web server in my project's stack stack-xyz789"

**Expected Tool Calls:**
```json
{
  "tool": "mittwald_container_declare_stack",
  "arguments": {
    "stackId": "stack-xyz789",
    "desiredServices": {
      "nginx": {
        "imageUri": "nginx:latest",
        "ports": [
          {
            "containerPort": 80,
            "protocol": "tcp"
          }
        ]
      }
    }
  }
}
```

### Deploy a Container with Environment Variables

**User Prompt:**
> "I want to run a Node.js app container on port 3000 with NODE_ENV set to production in stack stack-xyz789"

**Expected Tool Calls:**
```json
{
  "tool": "mittwald_container_declare_stack",
  "arguments": {
    "stackId": "stack-xyz789",
    "desiredServices": {
      "nodejs-app": {
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
        ]
      }
    }
  }
}
```

### Update a Container

**User Prompt:**
> "Update my nginx container to use nginx:alpine image and add a custom config environment variable NGINX_HOST=example.com"

**Expected Tool Calls:**
```json
{
  "tool": "mittwald_container_declare_stack",
  "arguments": {
    "stackId": "stack-xyz789",
    "desiredServices": {
      "nginx": {
        "imageUri": "nginx:alpine",
        "environment": {
          "NGINX_HOST": "example.com"
        },
        "ports": [
          {
            "containerPort": 80,
            "protocol": "tcp"
          }
        ]
      }
    }
  }
}
```

### Remove a Container

**User Prompt:**
> "Remove the nginx container from my stack but keep the other services"

**Expected Tool Calls:**
```json
{
  "tool": "mittwald_container_declare_stack",
  "arguments": {
    "stackId": "stack-xyz789",
    "desiredServices": {
      "nodejs-app": {
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
        ]
      }
    }
  }
}
```

## Multi-Container Applications

### Deploy WordPress with MySQL

**User Prompt:**
> "Set up WordPress with MySQL database in my project stack. Use strong passwords and persistent storage for the database"

**Expected Tool Calls:**
```json
{
  "tool": "mittwald_container_declare_stack",
  "arguments": {
    "stackId": "stack-xyz789",
    "desiredServices": {
      "mysql": {
        "imageUri": "mysql:8.0",
        "environment": {
          "MYSQL_ROOT_PASSWORD": "SuperSecureRootPass123!",
          "MYSQL_DATABASE": "wordpress",
          "MYSQL_USER": "wordpress",
          "MYSQL_PASSWORD": "WordPressDBPass456!"
        },
        "ports": [
          {
            "containerPort": 3306,
            "protocol": "tcp"
          }
        ],
        "volumes": [
          {
            "name": "mysql-data",
            "mountPath": "/var/lib/mysql",
            "readOnly": false
          }
        ]
      },
      "wordpress": {
        "imageUri": "wordpress:latest",
        "environment": {
          "WORDPRESS_DB_HOST": "mysql:3306",
          "WORDPRESS_DB_USER": "wordpress",
          "WORDPRESS_DB_PASSWORD": "WordPressDBPass456!",
          "WORDPRESS_DB_NAME": "wordpress"
        },
        "ports": [
          {
            "containerPort": 80,
            "protocol": "tcp"
          }
        ],
        "volumes": [
          {
            "name": "wordpress-data",
            "mountPath": "/var/www/html",
            "readOnly": false
          }
        ]
      }
    },
    "desiredVolumes": {
      "mysql-data": {
        "size": "10Gi"
      },
      "wordpress-data": {
        "size": "5Gi"
      }
    }
  }
}
```

### Deploy a Microservices Application

**User Prompt:**
> "Deploy a microservices app with: 
> - A Node.js API service on port 3000
> - Redis for caching on port 6379
> - PostgreSQL database
> All services should have persistent storage"

**Expected Tool Calls:**
```json
{
  "tool": "mittwald_container_declare_stack",
  "arguments": {
    "stackId": "stack-xyz789",
    "desiredServices": {
      "api": {
        "imageUri": "node:18-alpine",
        "environment": {
          "NODE_ENV": "production",
          "PORT": "3000",
          "REDIS_HOST": "redis",
          "REDIS_PORT": "6379",
          "POSTGRES_HOST": "postgres",
          "POSTGRES_PORT": "5432",
          "POSTGRES_DB": "apidb",
          "POSTGRES_USER": "apiuser",
          "POSTGRES_PASSWORD": "ApiPass789!"
        },
        "ports": [
          {
            "containerPort": 3000,
            "protocol": "tcp"
          }
        ],
        "volumes": [
          {
            "name": "api-data",
            "mountPath": "/app/data",
            "readOnly": false
          }
        ]
      },
      "redis": {
        "imageUri": "redis:7-alpine",
        "environment": {
          "REDIS_PASSWORD": "RedisPass321!"
        },
        "ports": [
          {
            "containerPort": 6379,
            "protocol": "tcp"
          }
        ],
        "volumes": [
          {
            "name": "redis-data",
            "mountPath": "/data",
            "readOnly": false
          }
        ]
      },
      "postgres": {
        "imageUri": "postgres:15-alpine",
        "environment": {
          "POSTGRES_USER": "apiuser",
          "POSTGRES_PASSWORD": "ApiPass789!",
          "POSTGRES_DB": "apidb"
        },
        "ports": [
          {
            "containerPort": 5432,
            "protocol": "tcp"
          }
        ],
        "volumes": [
          {
            "name": "postgres-data",
            "mountPath": "/var/lib/postgresql/data",
            "readOnly": false
          }
        ]
      }
    },
    "desiredVolumes": {
      "api-data": {
        "size": "2Gi"
      },
      "redis-data": {
        "size": "1Gi"
      },
      "postgres-data": {
        "size": "20Gi"
      }
    }
  }
}
```

## Working with Volumes

### Add Persistent Storage to Existing Container

**User Prompt:**
> "Add a 5GB volume to my nginx container for storing static files at /usr/share/nginx/html"

**Expected Tool Calls:**
```json
{
  "tool": "mittwald_container_declare_stack",
  "arguments": {
    "stackId": "stack-xyz789",
    "desiredServices": {
      "nginx": {
        "imageUri": "nginx:latest",
        "ports": [
          {
            "containerPort": 80,
            "protocol": "tcp"
          }
        ],
        "volumes": [
          {
            "name": "nginx-static",
            "mountPath": "/usr/share/nginx/html",
            "readOnly": false
          }
        ]
      }
    },
    "desiredVolumes": {
      "nginx-static": {
        "size": "5Gi"
      }
    }
  }
}
```

### Mount Project Files into Container

**User Prompt:**
> "I want my nginx container to serve files from my project's html directory"

**Expected Tool Calls:**
```json
{
  "tool": "mittwald_container_declare_stack",
  "arguments": {
    "stackId": "stack-xyz789",
    "desiredServices": {
      "nginx": {
        "imageUri": "nginx:latest",
        "ports": [
          {
            "containerPort": 80,
            "protocol": "tcp"
          }
        ],
        "volumes": [
          {
            "name": "/home/p-abc123/html",
            "mountPath": "/usr/share/nginx/html",
            "readOnly": true
          }
        ]
      }
    }
  }
}
```

### Share Volume Between Containers

**User Prompt:**
> "Create a shared volume that both my web app and worker containers can access"

**Expected Tool Calls:**
```json
{
  "tool": "mittwald_container_declare_stack",
  "arguments": {
    "stackId": "stack-xyz789",
    "desiredServices": {
      "webapp": {
        "imageUri": "myapp:latest",
        "ports": [
          {
            "containerPort": 8080,
            "protocol": "tcp"
          }
        ],
        "volumes": [
          {
            "name": "shared-data",
            "mountPath": "/app/shared",
            "readOnly": false
          }
        ]
      },
      "worker": {
        "imageUri": "myapp:worker",
        "volumes": [
          {
            "name": "shared-data",
            "mountPath": "/app/shared",
            "readOnly": false
          }
        ]
      }
    },
    "desiredVolumes": {
      "shared-data": {
        "size": "10Gi"
      }
    }
  }
}
```

## Private Registries

### Configure Docker Hub Private Registry

**User Prompt:**
> "Set up Docker Hub access with my username 'mycompany' and access token for pulling private images"

**Expected Tool Calls:**
```json
{
  "tool": "mittwald_container_create_registry",
  "arguments": {
    "projectId": "p-abc123",
    "uri": "docker.io",
    "imageRegistryType": "docker",
    "username": "mycompany",
    "password": "dckr_pat_xxxxxxxxxxxxx"
  }
}
```

### Configure GitHub Container Registry

**User Prompt:**
> "I need to pull images from GitHub Container Registry using my personal access token"

**Expected Tool Calls:**
```json
{
  "tool": "mittwald_container_create_registry",
  "arguments": {
    "projectId": "p-abc123",
    "uri": "ghcr.io",
    "imageRegistryType": "github",
    "username": "myusername",
    "password": "ghp_xxxxxxxxxxxxx"
  }
}
```

### Deploy from Private Registry

**User Prompt:**
> "Deploy my private app image from GitHub Container Registry ghcr.io/mycompany/myapp:v2.1.0"

**Expected Tool Calls:**
```json
{
  "tool": "mittwald_container_declare_stack",
  "arguments": {
    "stackId": "stack-xyz789",
    "desiredServices": {
      "myapp": {
        "imageUri": "ghcr.io/mycompany/myapp:v2.1.0",
        "environment": {
          "APP_ENV": "production"
        },
        "ports": [
          {
            "containerPort": 8080,
            "protocol": "tcp"
          }
        ]
      }
    }
  }
}
```

## Monitoring and Logs

### Check Container Status

**User Prompt:**
> "Show me the status of all running containers in project p-abc123"

**Expected Tool Calls:**
```json
{
  "tool": "mittwald_container_list_services",
  "arguments": {
    "projectId": "p-abc123",
    "output": "json",
    "extended": true
  }
}
```

### Get Container Logs

**User Prompt:**
> "Show me the last 50 log lines from my api service in stack stack-xyz789"

**Expected Tool Calls:**
```json
{
  "tool": "mittwald_container_get_service_logs",
  "arguments": {
    "stackId": "stack-xyz789",
    "serviceId": "service-api-123",
    "limit": 50
  }
}
```

### Get Logs from Specific Time Range

**User Prompt:**
> "Get logs from my nginx container for the last hour"

**Expected Tool Calls:**
```json
{
  "tool": "mittwald_container_get_service_logs",
  "arguments": {
    "stackId": "stack-xyz789",
    "serviceId": "service-nginx-456",
    "since": "2024-01-20T14:00:00Z",
    "until": "2024-01-20T15:00:00Z"
  }
}
```

## Advanced Scenarios

### Deploy Development Environment

**User Prompt:**
> "Set up a complete development environment with:
> - PostgreSQL 15 with pgAdmin
> - Redis with RedisInsight
> - Elasticsearch and Kibana
> All with appropriate networking and storage"

**Expected Tool Calls:**
```json
{
  "tool": "mittwald_container_declare_stack",
  "arguments": {
    "stackId": "stack-xyz789",
    "desiredServices": {
      "postgres": {
        "imageUri": "postgres:15",
        "environment": {
          "POSTGRES_USER": "devuser",
          "POSTGRES_PASSWORD": "DevPass123!",
          "POSTGRES_DB": "devdb"
        },
        "ports": [
          {
            "containerPort": 5432,
            "protocol": "tcp"
          }
        ],
        "volumes": [
          {
            "name": "postgres-data",
            "mountPath": "/var/lib/postgresql/data",
            "readOnly": false
          }
        ]
      },
      "pgadmin": {
        "imageUri": "dpage/pgadmin4:latest",
        "environment": {
          "PGADMIN_DEFAULT_EMAIL": "admin@dev.local",
          "PGADMIN_DEFAULT_PASSWORD": "AdminPass456!",
          "PGADMIN_CONFIG_SERVER_MODE": "False"
        },
        "ports": [
          {
            "containerPort": 80,
            "protocol": "tcp"
          }
        ]
      },
      "redis": {
        "imageUri": "redis:7",
        "environment": {
          "REDIS_PASSWORD": "RedisPass789!"
        },
        "ports": [
          {
            "containerPort": 6379,
            "protocol": "tcp"
          }
        ],
        "volumes": [
          {
            "name": "redis-data",
            "mountPath": "/data",
            "readOnly": false
          }
        ]
      },
      "redisinsight": {
        "imageUri": "redislabs/redisinsight:latest",
        "ports": [
          {
            "containerPort": 8001,
            "protocol": "tcp"
          }
        ]
      },
      "elasticsearch": {
        "imageUri": "elasticsearch:8.11.0",
        "environment": {
          "discovery.type": "single-node",
          "xpack.security.enabled": "false",
          "ES_JAVA_OPTS": "-Xms512m -Xmx512m"
        },
        "ports": [
          {
            "containerPort": 9200,
            "protocol": "tcp"
          }
        ],
        "volumes": [
          {
            "name": "elastic-data",
            "mountPath": "/usr/share/elasticsearch/data",
            "readOnly": false
          }
        ]
      },
      "kibana": {
        "imageUri": "kibana:8.11.0",
        "environment": {
          "ELASTICSEARCH_HOSTS": "http://elasticsearch:9200"
        },
        "ports": [
          {
            "containerPort": 5601,
            "protocol": "tcp"
          }
        ]
      }
    },
    "desiredVolumes": {
      "postgres-data": {
        "size": "10Gi"
      },
      "redis-data": {
        "size": "2Gi"
      },
      "elastic-data": {
        "size": "20Gi"
      }
    }
  }
}
```

### Blue-Green Deployment

**User Prompt:**
> "I want to do a blue-green deployment. Currently running myapp:v1.0.0, deploy myapp:v2.0.0 as 'myapp-green' alongside it"

**Expected Tool Calls:**
```json
{
  "tool": "mittwald_container_declare_stack",
  "arguments": {
    "stackId": "stack-xyz789",
    "desiredServices": {
      "myapp-blue": {
        "imageUri": "myapp:v1.0.0",
        "environment": {
          "APP_VERSION": "blue",
          "PORT": "8080"
        },
        "ports": [
          {
            "containerPort": 8080,
            "protocol": "tcp"
          }
        ]
      },
      "myapp-green": {
        "imageUri": "myapp:v2.0.0",
        "environment": {
          "APP_VERSION": "green",
          "PORT": "8080"
        },
        "ports": [
          {
            "containerPort": 8080,
            "protocol": "tcp"
          }
        ]
      }
    }
  }
}
```

### Cleanup Everything

**User Prompt:**
> "Remove all containers and volumes from my stack"

**Expected Tool Calls:**
```json
{
  "tool": "mittwald_container_declare_stack",
  "arguments": {
    "stackId": "stack-xyz789",
    "desiredServices": {},
    "desiredVolumes": {}
  }
}
```

## Tips and Best Practices

1. **Always use specific image tags** in production (avoid `:latest`)
2. **Set resource limits** when deploying resource-intensive containers
3. **Use environment variables** for configuration, not hardcoded values
4. **Create persistent volumes** for any data you want to keep
5. **Use internal service names** for container-to-container communication
6. **Check logs regularly** to monitor container health
7. **Plan your volume strategy** - decide what needs persistence
8. **Test locally first** before deploying to Mittwald

## Common Patterns

### Database + App Pattern
```
Stack
├── Database Container (with persistent volume)
├── Application Container (connects to database)
└── Admin Tool Container (optional)
```

### Microservices Pattern
```
Stack
├── API Gateway Container
├── Service A Container
├── Service B Container
├── Message Queue Container
└── Shared Cache Container
```

### Static Site Pattern
```
Stack
├── Web Server Container
└── Project Volume Mount (/home/p-xxx/html)
```

## Troubleshooting

**Container won't start?**
- Check logs with `mittwald_container_get_service_logs`
- Verify image name and tag
- Check environment variables
- Ensure ports aren't conflicting

**Can't pull private image?**
- Configure registry with `mittwald_container_create_registry`
- Verify credentials are correct
- Check image URI format

**Services can't communicate?**
- Use service name as hostname
- Verify they're in the same stack
- Check port configurations

**Volume issues?**
- Ensure volume is declared in `desiredVolumes`
- Check mount paths are correct
- Verify permissions (readOnly flag)