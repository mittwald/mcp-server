import type { Resource } from '@modelcontextprotocol/sdk/types.js';

export const domainsGuideResource: Resource = {
  uri: 'guide://mittwald/domains-and-virtual-hosts',
  name: 'Domains and Virtual Hosts Guide',
  description: 'Comprehensive guide for working with domains, subdomains, and virtual hosts in Mittwald',
  mimeType: 'text/markdown',
};

export const domainsGuideContent = `# Domains and Virtual Hosts Guide

## Overview

This guide explains how to work with domains, subdomains, and virtual hosts (ingresses) in Mittwald. Understanding these concepts is crucial for making your applications and services accessible on the internet.

## Key Concepts

### 1. Projects and Default Domains
Every Mittwald project gets a default subdomain:
- Format: \`p-{projectId}.project.space\`
- Example: \`p-b9hpjf.project.space\`
- This domain is automatically available for your project

### 2. Virtual Hosts (Ingresses)
Virtual hosts route incoming HTTP/HTTPS traffic to your applications or containers:
- They map hostnames to services
- Support path-based routing
- Can target apps, containers, or external URLs

### 3. Domain Types
- **Project subdomains**: \`*.p-{projectId}.project.space\` (free, automatic)
- **Custom domains**: Your own domains (e.g., \`example.com\`)
- **Subdomains**: Both project and custom (e.g., \`api.example.com\`)

## Working with Virtual Hosts

### Creating a Virtual Host

Use \`mittwald_domain_virtualhost_create\` with these parameters:

#### For App Installations
\`\`\`json
{
  "hostname": "myapp.p-b9hpjf.project.space",
  "pathToApp": ["/:a-123456"],
  "projectId": "p-b9hpjf"
}
\`\`\`

#### For Container Services
\`\`\`json
{
  "hostname": "opensearch.p-b9hpjf.project.space",
  "pathToContainer": ["/:c-f6kw84:5601/tcp"],
  "projectId": "p-b9hpjf"
}
\`\`\`

#### For URL Redirects
\`\`\`json
{
  "hostname": "docs.example.com",
  "pathToUrl": ["/:https://documentation.example.com"]
}
\`\`\`

### Path-Based Routing

You can route different paths to different targets:

\`\`\`json
{
  "hostname": "api.example.com",
  "pathToApp": ["/v1:a-app1", "/v2:a-app2"],
  "pathToContainer": ["/metrics:c-prometheus:9090/tcp"],
  "pathToUrl": ["/docs:https://api-docs.example.com"]
}
\`\`\`

This creates:
- \`api.example.com/v1\` → App a-app1
- \`api.example.com/v2\` → App a-app2
- \`api.example.com/metrics\` → Prometheus container
- \`api.example.com/docs\` → External documentation

## Common Patterns

### 1. WordPress with Custom Domain
\`\`\`json
// First, install WordPress
{
  "tool": "mittwald_app_install_wordpress",
  "args": {
    "projectId": "p-b9hpjf",
    "version": "6.4.2",
    "adminUser": "admin",
    "adminEmail": "admin@example.com",
    "adminPass": "secure-password",
    "siteTitle": "My Blog"
  }
}

// Then create virtual host
{
  "tool": "mittwald_domain_virtualhost_create",
  "args": {
    "hostname": "blog.example.com",
    "pathToApp": ["/:a-wordpress-id"]
  }
}
\`\`\`

### 2. Microservices Architecture
\`\`\`json
{
  "hostname": "api.myservice.com",
  "pathToContainer": [
    "/users:c-users-api:3000/tcp",
    "/orders:c-orders-api:3001/tcp",
    "/auth:c-auth-service:8080/tcp"
  ],
  "pathToApp": ["/admin:a-admin-panel"]
}
\`\`\`

### 3. Development vs Production
\`\`\`json
// Development subdomain
{
  "hostname": "dev.p-b9hpjf.project.space",
  "pathToApp": ["/:a-dev-app"]
}

// Production domain
{
  "hostname": "www.mycompany.com",
  "pathToApp": ["/:a-prod-app"]
}
\`\`\`

## DNS Configuration

### For Project Subdomains
- Automatically configured
- No DNS changes needed
- SSL certificates auto-provisioned

### For Custom Domains
1. Add domain to project (if supported by your plan)
2. Configure DNS records:
   - A record: Point to Mittwald IP
   - CNAME: Point to project domain
3. Wait for DNS propagation
4. Create virtual host

## Managing Virtual Hosts

### List Virtual Hosts
\`\`\`json
{
  "tool": "mittwald_domain_virtualhost_list",
  "args": {
    "projectId": "p-b9hpjf"
  }
}
\`\`\`

### Get Virtual Host Details
\`\`\`json
{
  "tool": "mittwald_domain_virtualhost_get",
  "args": {
    "ingressId": "i-123456"
  }
}
\`\`\`

### Delete Virtual Host
\`\`\`json
{
  "tool": "mittwald_domain_virtualhost_delete",
  "args": {
    "virtualHostId": "i-123456",
    "force": true
  }
}
\`\`\`

## Best Practices

### 1. Naming Conventions
- Use descriptive subdomains: \`api.\`, \`admin.\`, \`dashboard.\`
- Environment prefixes: \`dev-\`, \`staging-\`, \`prod-\`
- Service indicators: \`opensearch.\`, \`redis.\`, \`db.\`

### 2. Security Considerations
- Always use HTTPS (automatic with Mittwald)
- Limit access to sensitive services
- Use authentication for admin interfaces

### 3. Performance Tips
- Use path-based routing to reduce DNS lookups
- Consider CDN for static assets
- Monitor response times

## Troubleshooting

### Virtual Host Creation Fails

1. **"No ID returned"**
   - Check container/app exists and is running
   - Verify port is exposed
   - Ensure project permissions

2. **"Invalid ID format"**
   - App IDs start with \`a-\`
   - Container IDs start with \`c-\`
   - Include port for containers

3. **DNS Not Resolving**
   - Wait for propagation (up to 48h)
   - Check DNS records
   - Verify domain ownership

### Common Mistakes

1. **Wrong ID Type**
   - ❌ \`pathToApp: ["/:c-123"]\` (container ID in app field)
   - ✅ \`pathToContainer: ["/:c-123:80/tcp"]\`

2. **Missing Port**
   - ❌ \`pathToContainer: ["/:c-123"]\`
   - ✅ \`pathToContainer: ["/:c-123:5601/tcp"]\`

3. **Invalid Path Format**
   - ❌ \`pathToApp: ["/app:a-123:extra"]\`
   - ✅ \`pathToApp: ["/app:a-123"]\`

## Examples by Service Type

### OpenSearch + Dashboard
\`\`\`json
{
  "hostname": "search.p-b9hpjf.project.space",
  "pathToContainer": [
    "/:c-opensearch:9200/tcp",
    "/dashboard:c-dashboard:5601/tcp"
  ]
}
\`\`\`
Access:
- OpenSearch API: \`https://search.p-b9hpjf.project.space/\`
- Dashboard: \`https://search.p-b9hpjf.project.space/dashboard\`

### Node.js Application
\`\`\`json
{
  "hostname": "app.example.com",
  "pathToApp": ["/:a-nodejs-app"],
  "pathToContainer": ["/api:c-api-service:3000/tcp"]
}
\`\`\`

### Static Website
\`\`\`json
{
  "hostname": "www.example.com",
  "pathToApp": ["/:a-static-site"],
  "pathToUrl": ["/blog:https://blog.example.com"]
}
\`\`\`

## Summary

Working with domains and virtual hosts in Mittwald involves:
1. Understanding the difference between apps (a-xxx) and containers (c-xxx)
2. Using the correct path mapping format for each type
3. Including required parameters (especially ports for containers)
4. Following naming conventions for clarity
5. Testing with project subdomains before using custom domains

Remember: Virtual hosts are the bridge between domain names and your services. Configure them correctly to ensure your applications are accessible and properly routed.
`;