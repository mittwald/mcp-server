import type { Resource } from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP Resource that provides an OpenSearch stack declaration example
 * Shows how to create a complete OpenSearch backend and dashboard frontend
 */
export const opensearchStackExampleResource: Resource = {
  uri: 'mittwald://opensearch-stack-example',
  name: 'OpenSearch Stack Declaration Example',
  description: 'Complete example showing how to declare an OpenSearch backend with dashboard frontend using mittwald_container_declare_stack',
  mimeType: 'text/markdown'
};

export const opensearchStackExampleContent = `# OpenSearch Stack Declaration Example

This example demonstrates how to use \`mittwald_container_declare_stack\` to create a complete OpenSearch deployment with both backend and frontend services.

## Stack Configuration

### Request Parameters

\`\`\`json
{
  "stackId": "<STACK_ID>",
  "desiredServices": {
    "opensearch": {
      "imageUri": "opensearchproject/opensearch:2.11.1",
      "description": "opensearch container",
      "ports": [
        {
          "containerPort": 9200,
          "protocol": "tcp"
        }
      ],
      "environment": {
        "cluster.name": "opensearch-cluster",
        "node.name": "opensearch-node1",
        "discovery.type": "single-node",
        "bootstrap.memory_lock": "false",
        "OPENSEARCH_JAVA_OPTS": "-Xms256m -Xmx256m",
        "DISABLE_INSTALL_DEMO_CONFIG": "true",
        "DISABLE_SECURITY_PLUGIN": "true",
        "network.host": "0.0.0.0"
      },
      "volumes": [
        {
          "name": "opensearch-data",
          "mountPath": "/usr/share/opensearch/data"
        }
      ]
    },
    "opensearch-dashboards": {
      "imageUri": "opensearchproject/opensearch-dashboards:2.11.1",
      "description": "opensearch-dashboards container",
      "ports": [
        {
          "containerPort": 5601,
          "protocol": "tcp"
        }
      ],
      "environment": {
        "OPENSEARCH_HOSTS": "http://opensearch:9200",
        "DISABLE_SECURITY_DASHBOARDS_PLUGIN": "true",
        "server.host": "0.0.0.0"
      }
    }
  },
  "desiredVolumes": {
    "opensearch-data": {
      "size": "1Gi"
    }
  }
}
\`\`\`

## Configuration Details

### OpenSearch Backend Service
- **Image**: \`opensearchproject/opensearch:2.11.1\`
- **Port**: 9200 (TCP)
- **Configuration**: Single-node cluster with security disabled for development
- **Memory**: 256MB heap size (suitable for development/testing)
- **Data**: Persistent volume mounted at \`/usr/share/opensearch/data\`

### OpenSearch Dashboards Frontend
- **Image**: \`opensearchproject/opensearch-dashboards:2.11.1\`
- **Port**: 5601 (TCP)
- **Configuration**: Connects to OpenSearch backend via internal networking
- **Security**: Disabled for development (matches backend configuration)

### Persistent Storage
- **Volume**: \`opensearch-data\` (1GB)
- **Purpose**: Stores OpenSearch indices and cluster data
- **Mount**: \`/usr/share/opensearch/data\` in the OpenSearch container

## Important Notes

### Security Configuration
This example disables OpenSearch security features (\`DISABLE_SECURITY_PLUGIN: "true"\`) for development purposes. In production:
- Enable security plugin
- Configure proper authentication
- Use HTTPS/TLS encryption
- Set up proper user roles and permissions

### Resource Requirements
- **Memory**: Configured for minimal resource usage (256MB heap)
- **Storage**: 1GB volume suitable for development/testing
- **Scaling**: Single-node configuration (not suitable for production)

### Network Communication
- Dashboard connects to OpenSearch using internal container name: \`http://opensearch:9200\`
- Both services bind to \`0.0.0.0\` to accept connections
- External access requires virtual host configuration

## Usage Tips

1. **Replace Placeholders**: Update \`<STACK_ID>\` with your actual stack identifier
2. **Adjust Resources**: Modify memory limits and storage size based on your needs
3. **Security**: Enable security features for production deployments
4. **Monitoring**: Consider adding logging and monitoring containers
5. **Backup**: Set up regular backups of the persistent volume

## Next Steps

After declaring the stack:
1. Create virtual hosts to expose services externally
2. Configure domain names for public access
3. Set up SSL certificates for HTTPS
4. Configure backup strategies for persistent data
5. Monitor resource usage and scale as needed
`;