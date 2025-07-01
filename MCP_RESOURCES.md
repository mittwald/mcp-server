# MCP Resources

This MCP server provides several educational resources to help LLMs understand how to work with Mittwald's platform effectively.

## Available Resources

### 1. Container Safety Guide
**URI**: `mittwald://container-safety-guide`

Explains the critical safety considerations when working with container stacks:
- Declarative vs imperative operations
- How to safely add/remove services without data loss
- Common mistakes and their consequences
- Safe workflows for container management

### 2. Container Virtual Host Guide
**URI**: `guide://mittwald/container-virtualhost`

Focused guide on creating virtual hosts for container services:
- Difference between app IDs (a-xxx) and container IDs (c-xxx)
- Port specification requirements
- Common container ports
- Examples for OpenSearch, Nginx, etc.

### 3. Domains and Virtual Hosts Guide
**URI**: `guide://mittwald/domains-and-virtual-hosts`

Comprehensive guide covering:
- Project subdomains (*.p-xxx.project.space)
- Virtual host creation for apps, containers, and URLs
- Path-based routing strategies
- DNS configuration
- Common patterns (WordPress, microservices, etc.)
- Troubleshooting tips

## How to Use These Resources

LLMs can access these resources through the MCP protocol to get contextual help when working with Mittwald. The resources are designed to:

1. **Prevent common mistakes** - Like accidentally deleting services
2. **Provide correct syntax** - With validated examples
3. **Explain concepts** - In a way that helps LLMs make better decisions
4. **Offer troubleshooting** - For when things go wrong

## Example Usage

When an LLM needs to:
- Create a virtual host for a container → Read the Container Virtual Host Guide
- Understand domain routing → Read the Domains and Virtual Hosts Guide  
- Modify a container stack → Read the Container Safety Guide first

These resources ensure LLMs have the context needed to use Mittwald's platform safely and effectively.