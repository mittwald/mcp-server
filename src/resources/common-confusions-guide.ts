import type { Resource } from '@modelcontextprotocol/sdk/types.js';

export const commonConfusionsGuideResource: Resource = {
  uri: 'guide://mittwald/common-confusions',
  name: 'Common Confusions Guide',
  description: 'Quick reference for common parameter names and ID formats that cause confusion',
  mimeType: 'text/markdown',
};

export const commonConfusionsGuideContent = `# Common Confusions Guide

## Quick Reference for Tricky Parameters

### 1. Virtual Host Parameter Names

**DELETE Virtual Host:**
\`\`\`json
{
  "tool": "mittwald_domain_virtualhost_delete",
  "args": {
    "virtualHostId": "de437996-118c-4437-adea-567f170afb70",  // ✅ CORRECT
    // "ingressId": "..."  // ❌ WRONG - This will fail!
    "force": true
  }
}
\`\`\`

**GET Virtual Host:**
\`\`\`json
{
  "tool": "mittwald_domain_virtualhost_get",
  "args": {
    "ingressId": "de437996-118c-4437-adea-567f170afb70",  // ✅ CORRECT
    // "virtualHostId": "..."  // ❌ WRONG - This will fail!
    "output": "json"
  }
}
\`\`\`

### 2. ID Format Quick Reference

| Service Type | ID Format | Example | Used For |
|-------------|-----------|---------|----------|
| Apps | \`a-XXXXXX\` | \`a-3c96b5\` | WordPress, Node.js, etc. |
| Containers | \`c-XXXXXX\` | \`c-f6kw84\` | OpenSearch, custom containers |
| Projects | \`p-XXXXXX\` | \`p-b9hpjf\` | Project identification |
| Virtual Hosts | UUID | \`de437996-118c-4437-adea-567f170afb70\` | Ingress/Virtual host IDs |

### 3. Container Virtual Host Creation

**WRONG - Using pathToApp for containers:**
\`\`\`json
{
  "hostname": "opensearch.p-b9hpjf.project.space",
  "pathToApp": ["/:c-f6kw84"]  // ❌ Container ID in app field!
}
\`\`\`

**CORRECT - Using pathToContainer with port:**
\`\`\`json
{
  "hostname": "opensearch.p-b9hpjf.project.space",
  "pathToContainer": ["/:c-f6kw84:5601/tcp"]  // ✅ Includes port!
}
\`\`\`

### 4. Common Port Numbers

| Service | Default Port | Example |
|---------|--------------|---------|
| OpenSearch Dashboard | 5601 | \`/:c-xxx:5601/tcp\` |
| OpenSearch API | 9200 | \`/:c-xxx:9200/tcp\` |
| Nginx | 80/443 | \`/:c-xxx:80/tcp\` |
| Node.js | 3000 | \`/:c-xxx:3000/tcp\` |
| Redis | 6379 | \`/:c-xxx:6379/tcp\` |

### 5. Error Messages Decoder

**"Invalid app ID format: c-xxxxx"**
- You're using a container ID where an app ID is expected
- Solution: Use \`pathToContainer\` instead of \`pathToApp\`

**"Invalid arguments for tool mittwald_domain_virtualhost_delete: ingressId Required"**
- You used \`ingressId\` but the parameter is \`virtualHostId\`
- Solution: Use \`virtualHostId\` for delete operations

**"Failed to create ingress: No ID returned"**
- The container/app might not exist
- Port might not be exposed
- Project permissions issue

### 6. When to Use Which Parameter

| Task | Parameter | Format |
|------|-----------|--------|
| Create virtual host for app | \`pathToApp\` | \`["/:a-123456"]\` |
| Create virtual host for container | \`pathToContainer\` | \`["/:c-123456:port/tcp"]\` |
| Create redirect | \`pathToUrl\` | \`["/:https://example.com"]\` |
| Delete virtual host | \`virtualHostId\` | \`"uuid-string"\` |
| Get virtual host | \`ingressId\` | \`"uuid-string"\` |

### 7. Full Working Examples

**OpenSearch with Dashboard:**
\`\`\`json
{
  "tool": "mittwald_domain_virtualhost_create",
  "args": {
    "hostname": "search.myproject.project.space",
    "pathToContainer": [
      "/:c-opensearch:9200/tcp",         // API on root
      "/dashboard:c-dashboard:5601/tcp"  // Dashboard on /dashboard
    ],
    "projectId": "p-b9hpjf"
  }
}
\`\`\`

**Mixed Services:**
\`\`\`json
{
  "tool": "mittwald_domain_virtualhost_create",
  "args": {
    "hostname": "myservice.com",
    "pathToApp": ["/blog:a-wordpress"],           // WordPress blog
    "pathToContainer": ["/api:c-api:3000/tcp"],   // API container
    "pathToUrl": ["/docs:https://docs.myservice.com"]  // External docs
  }
}
\`\`\`

## Remember

1. Always include ports for containers: \`:port/protocol\`
2. Check parameter names carefully - they're not always consistent
3. Container IDs start with \`c-\`, App IDs with \`a-\`
4. Virtual host IDs are full UUIDs, not short IDs
5. When in doubt, check the error message - it often tells you exactly what's wrong
`;