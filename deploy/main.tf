terraform {
  required_providers {
    mittwald = {
      source  = "mittwald/mittwald"
      version = "~> 1.0"
    }
  }
}

provider "mittwald" {
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
    password = var.dockerhub_password
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
      }
    }

    oauth-server = {
      image       = "mittwald/mcp-server-oauth:${var.image_tag}"
      description = "Mittwald OAuth Server"
      entrypoint  = ["npm"]
      command     = ["start"]

      ports = [{
        container_port = 3000
        public_port    = 3000
        protocol       = "tcp"
      }]

      environment = {
        NODE_ENV = "production"
        PORT     = "3000"
      }
    }
  }
}

# Virtual host configuration for mcp.mittwald.de
resource "mittwald_virtualhost" "mcp_domain" {
  hostname   = "mcp.mittwald.de"
  project_id = mittwald_project.mcp_project.id

  paths = {
    "/" = {
      container = {
        container_id = mittwald_container_stack.mcp_stack.containers.mcp-server.id
        port         = "8080/tcp"
      }
    }
  }
}

resource "mittwald_virtualhost" "oauth_domain" {
  hostname   = "auth.mcp.mittwald.de"
  project_id = mittwald_project.mcp_project.id

  paths = {
    "/" = {
      container = {
        container_id = mittwald_container_stack.mcp_stack.containers.oauth-server.id
        port         = "3000/tcp"
      }
    }
  }
}