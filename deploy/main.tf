terraform {
  required_providers {
    mittwald = {
      source  = "mittwald/mittwald"
      version = "~> 1.0"
    }
  }

  cloud {
    organization = "mittwald"
    workspaces {
      name = "mcp-server"
    }
  }
}

provider "mittwald" {
  api_key = var.mittwald_api_key
}

locals {
  base_domain = "mcp.mittwald.de"
}

resource "random_string" "jwt_secret" {
  length           = 32
  special          = false
}

resource "random_password" "metrics_password" {
  length           = 16
  special          = true
}

moved {
  from = resource.random_string.random
  to = resource.random_string.jwt_secret
}

resource "mittwald_project" "mcp_project" {
  description = "mStudio MCP server"
  server_id = var.server_id
}

resource "mittwald_container_registry" "mcp_registry" {
  project_id = mittwald_project.mcp_project.id

  uri = "index.docker.io"
  description = "Docker Hub"

  credentials = {
    username = var.dockerhub_username
    password_wo = var.dockerhub_password
    password_wo_version = 1
  }
}

resource "mittwald_container_stack" "mcp_stack" {
  project_id    = mittwald_project.mcp_project.id
  default_stack = true

  containers = {
    mcp-server = {
      image       = "mittwald/mcp-server-http:${var.image_tag}"
      description = "Mittwald MCP Server"
      entrypoint  = ["node"]
      command     = ["build/index.js"]

      ports = [{
        container_port = 8080
        public_port    = 8080
        protocol       = "tcp"
      }]

      environment = {
        NODE_ENV = "production"

        # HTTPs needs to be disabled, because the mittwald ingress controller handles TLS termination
        PORT         = "8080"
        ENABLE_HTTPS = "false"
        FLY_APP_NAME = "mock" # FLY_APP_NAME is required to trick the server into disabling TLS

        CORS_ORIGIN = "https://claude.ai,https://chatgpt.com"

        MCP_PUBLIC_BASE = "https://${local.base_domain}"
        MITTWALD_AUTHORIZATION_URL = "https://studio.mittwald.de/api/v2/oauth2/authorize"
        MITTWALD_CLIENT_ID = "mittwald-mcp-server"
        MITTWALD_CLIENT_SECRET = "mock-client-secret"

        REDIRECT_URL = "https://auth.${local.base_domain}/auth/callback"

        OAUTH_BRIDGE_BASE_URL = "https://auth.${local.base_domain}"
        OAUTH_BRIDGE_JWT_SECRET = random_string.jwt_secret.result
        OAUTH_BRIDGE_ISSUER = "https://auth.${local.base_domain}"
        #OAUTH_BRIDGE_AUDIENCE = "https://${local.base_domain}"
        OAUTH_BRIDGE_AUTHORIZATION_URL = "https://auth.${local.base_domain}/authorize"
        OAUTH_BRIDGE_TOKEN_URL = "https://auth.${local.base_domain}/token"

        # unclear; these are both in the .env.example
        OAUTH_BRIDGE_REDIS_URL = "redis://${mittwald_redis_database.mcp_redis.hostname}:6379"
        REDIS_URL = "redis://${mittwald_redis_database.mcp_redis.hostname}:6379"

        ENABLE_DIRECT_BEARER_TOKENS = "true"

        METRICS_USER = "metrics"
        METRICS_PASS = random_password.metrics_password.result
      }
    }

    oauth-server = {
      image       = "mittwald/mcp-server-oauth:${var.image_tag}"
      description = "Mittwald OAuth Server"
      entrypoint  = ["node"]
      command     = ["dist/server.js"]

      ports = [{
        container_port = 3000
        public_port    = 3000
        protocol       = "tcp"
      }]

      environment = {
        NODE_ENV = "production"

        PORT         = "3000"
        ENABLE_HTTPS = "false"
        FLY_APP_NAME = "mock" # FLY_APP_NAME is required to trick the server into disabling TLS

        BRIDGE_ISSUER = "https://auth.${local.base_domain}"
        BRIDGE_BASE_URL = "https://auth.${local.base_domain}"
        BRIDGE_JWT_SECRET = random_string.jwt_secret.result
        BRIDGE_REDIRECT_URIS = "https://chatgpt.com/connector_platform_oauth_redirect,https://claude.ai/api/mcp/auth_callback"

        BRIDGE_STATE_STORE = "redis"
        BRIDGE_REDIS_URL = "redis://${mittwald_redis_database.mcp_redis.hostname}:6379"

        MITTWALD_AUTHORIZATION_URL = "https://studio.mittwald.de/api/v2/oauth2/authorize"
        MITTWALD_TOKEN_URL = "https://studio.mittwald.de/api/v2/oauth2/token"

        MITTWALD_CLIENT_ID = "mittwald-mcp-server"
        MITTWALD_CLIENT_SECRET = "mock-client-secret"

      }
    }
  }
}

resource "mittwald_redis_database" "mcp_redis" {
  version = "7.2"
  project_id = mittwald_project.mcp_project.id
  description = "MCP server"

  configuration = {
    max_memory_mb = 512
    max_memory_policy = "allkeys-lru"
    persistent = true
  }
}

# Virtual host configuration for mcp.mittwald.de
resource "mittwald_virtualhost" "mcp_domain" {
  hostname   = local.base_domain
  project_id = mittwald_project.mcp_project.id

  paths = {
    "/" = {
      container = {
        container_id = mittwald_container_stack.mcp_stack.containers["mcp-server"].id
        port         = "8080/tcp"
      }
    }
  }
}

resource "mittwald_virtualhost" "oauth_domain" {
  hostname   = "auth.${local.base_domain}"
  project_id = mittwald_project.mcp_project.id

  paths = {
    "/" = {
      container = {
        container_id = mittwald_container_stack.mcp_stack.containers["oauth-server"].id
        port         = "3000/tcp"
      }
    }
  }
}
