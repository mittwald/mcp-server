import type { Resource } from '@modelcontextprotocol/sdk/types.js';

export const containerVirtualhostGuideResource: Resource = {
  uri: 'guide://mittwald/container-virtualhost',
  name: 'Container Virtual Host Guide',
  description: 'Guide for creating virtual hosts (ingresses) for container services',
  mimeType: 'text/markdown',
};

export const containerVirtualhostGuideContent = `# Container Virtual Host Guide

## Overview

In Mittwald, you can expose container services to the internet using virtual hosts (ingresses). This is different from app installations which use a different ID format.

## Key Concepts

### ID Formats
- **App IDs**: Start with \`a-\` (e.g., \`a-3c96b5\`)
- **Container IDs**: Start with \`c-\` (e.g., \`c-f6kw84\`)
- **Container Service IDs**: Full UUIDs are also supported

### Creating Virtual Hosts for Containers

Use the \`mittwald_domain_virtualhost_create\` tool with the \`pathToContainer\` parameter:

\`\`\`json
{
  "hostname": "opensearch.p-b9hpjf.project.space",
  "pathToContainer": ["/:c-f6kw84:5601/tcp"],
  "projectId": "p-b9hpjf"
}
\`\`\`

### Format for pathToContainer

The format is: \`path:containerId:port/protocol\`

Examples:
- \`/:c-f6kw84:5601/tcp\` - Root path to OpenSearch Dashboard
- \`/api:c-abc123:8080/tcp\` - /api path to a service on port 8080
- \`/:3f7d4b6a-uuid:80/tcp\` - Using full UUID instead of short ID

### Common Container Ports

- **OpenSearch Dashboard**: 5601/tcp
- **Nginx**: 80/tcp or 443/tcp
- **Node.js apps**: Often 3000/tcp or 8080/tcp
- **Redis**: 6379/tcp
- **PostgreSQL**: 5432/tcp
- **MySQL**: 3306/tcp

### Important Notes

1. The container must have the specified port exposed in its configuration
2. The port format must include the protocol (tcp or udp)
3. You can mix different target types in one virtual host:
   - \`pathToApp\` for app installations
   - \`pathToContainer\` for container services
   - \`pathToUrl\` for external URLs

### Example: OpenSearch with Dashboard

\`\`\`json
{
  "hostname": "opensearch.yourdomain.com",
  "pathToContainer": [
    "/:c-opensearch:9200/tcp",
    "/dashboard:c-dashboard:5601/tcp"
  ]
}
\`\`\`

This exposes:
- OpenSearch API at the root path
- OpenSearch Dashboard at /dashboard

### Troubleshooting

If you get "Failed to create ingress: No ID returned":
1. Check that the container ID is correct
2. Verify the container is running
3. Ensure the port is exposed in the container configuration
4. Confirm you have permissions in the project
`;