terraform {
  required_providers {
    mittwald = {
      source  = "mittwald/mittwald"
      version = "~> 1.0"
    }
  }
}

provider "mittwald" {
  debug_request_bodies = true
}

locals {
  base_domain = "mcp.mittwald.de"
}

resource "random_string" "random" {
  length           = 32
  special          = false
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
        PORT     = "8080"
        MCP_PUBLIC_BASE = "https://${local.base_domain}"
        MITTWALD_AUTHORIZATION_URL = "https://studio.mittwald.de/oauth2/authorize"
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
        PORT     = "3000"

        BRIDGE_ISSUER = "auth.${local.base_domain}"
        BRIDGE_BASE_URL = "https://auth.${local.base_domain}"
        BRIDGE_JWT_SECRET = random_string.random.result
        BRIDGE_REDIRECT_URIS = "https://auth.${local.base_domain}/auth/callback"

        MITTWALD_AUTHORIZATION_URL = "https://studio.mittwald.de/oauth2/authorize"
        MITTWALD_TOKEN_URL = "https://studio.mittwald.de/oauth2/token"

        MITTWALD_CLIENT_ID = "mittwald-mcp-server"
        MITTWALD_CLIENT_SECRET = "mock-client-secret"

      }
    }
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