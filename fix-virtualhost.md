# Fix Virtual Host Configuration

## The Problem
The virtual host was created with the stack ID (`5455f22d-9c41-4405-804b-40e5a31945d8`) as the projectId instead of the actual project ID (`p-cz3ys3`). This causes the UI to show "Kein Ziel" (No Target) even though the API shows the configuration is correct.

## Steps to Fix

1. Delete the incorrectly configured virtual host:
```
mittwald_domain_virtualhost_delete
{
  "ingressId": "8330b201-cf94-468d-99eb-9caa98aed5e6",
  "force": true
}
```

2. Get the correct container ID for OpenSearch Dashboards:
```
mittwald_container_list_services
{
  "stackId": "5455f22d-9c41-4405-804b-40e5a31945d8"
}
```

3. Create the virtual host with the CORRECT project ID:
```
mittwald_domain_virtualhost_create
{
  "hostname": "opensearch-demo.mittwald.space",
  "projectId": "p-cz3ys3",
  "pathToContainer": ["/:CONTAINER_ID:5601/tcp"]
}
```

## Key Points
- Always use the project ID (e.g., `p-cz3ys3`), not the stack ID
- Container IDs should be the service container ID from the stack
- The format is `path:containerId:port/protocol`