# Mittwald Container Operations Summary

Based on the OpenAPI specification analysis, here are the container-related operations available:

## 1. Container Registry Operations

### Create Registry
- **Endpoint**: `POST /v2/projects/{projectId}/registries`
- **Operation ID**: `container-create-registry`
- **Description**: Create a Registry
- **Request Body**: `de.mittwald.v1.container.CreateRegistry`
  - `credentials`: Registry credentials
  - `description`: Registry description
  - `uri`: Registry URI

### List Registries
- **Endpoint**: `GET /v2/projects/{projectId}/registries`
- **Description**: List registries for a project

### Get Registry
- **Endpoint**: `GET /v2/registries/{registryId}`
- **Description**: Get registry details

### Update Registry
- **Endpoint**: `PATCH /v2/registries/{registryId}`
- **Description**: Update registry details

### Delete Registry
- **Endpoint**: `DELETE /v2/registries/{registryId}`
- **Description**: Delete a registry

### Validate Registry
- **Endpoint**: `POST /v2/actions/validate-container-registry-uri`
- **Operation ID**: `container-validate-container-registry-uri`
- **Description**: Validate a Registry's URI

- **Endpoint**: `POST /v2/registries/{registryId}/actions/validate-credentials`
- **Operation ID**: `container-validate-registry-credentials`
- **Description**: Validate a Registry's credentials

## 2. Stack Operations

### Declare Stack (Create/Update Services and Volumes)
- **Endpoint**: `PUT /v2/stacks/{stackId}`
- **Operation ID**: `container-declare-stack`
- **Description**: Declaratively create, update or delete Services or Volumes belonging to a Stack
- **Request Body**:
  ```json
  {
    "services": {
      "[service-name]": {
        "description": "MySQL DB",
        "image": "mysql",
        "ports": ["3306:3306/tcp"],
        "command": ["mysqld"],
        "entrypoint": ["docker-entrypoint.sh"],
        "envs": {
          "MYSQL_DATABASE": "my_db",
          "MYSQL_PASSWORD": "my_password"
        },
        "volumes": ["data:/var/lib/mysql:ro"]
      }
    },
    "volumes": {
      "[volume-name]": {
        // Volume configuration
      }
    }
  }
  ```

### Update Stack (Patch)
- **Endpoint**: `PATCH /v2/stacks/{stackId}`
- **Operation ID**: `container-update-stack`
- **Description**: Create, update or delete Services or Volumes belonging to a Stack

### Get Stack
- **Endpoint**: `GET /v2/stacks/{stackId}`
- **Description**: Get stack details

### List Stacks
- **Endpoint**: `GET /v2/projects/{projectId}/stacks`
- **Description**: List stacks for a project

## 3. Container Service Operations

### Get Service
- **Endpoint**: `GET /v2/stacks/{stackId}/services/{serviceId}`
- **Description**: Get service details

### Service Actions
- **Start Service**: `POST /v2/stacks/{stackId}/services/{serviceId}/actions/start`
  - Operation ID: `container-start-service`
  
- **Stop Service**: `POST /v2/stacks/{stackId}/services/{serviceId}/actions/stop`
  - Operation ID: `container-stop-service`
  
- **Restart Service**: `POST /v2/stacks/{stackId}/services/{serviceId}/actions/restart`
  - Operation ID: `container-restart-service`
  
- **Recreate Service**: `POST /v2/stacks/{stackId}/services/{serviceId}/actions/recreate`
  - Operation ID: `container-recreate-service`
  
- **Pull Image**: `POST /v2/stacks/{stackId}/services/{serviceId}/actions/pull`
  - Operation ID: `container-pull-image-for-service`
  - Description: Pulls the latest version of the Service's image and recreates the Service

### Get Service Logs
- **Endpoint**: `GET /v2/stacks/{stackId}/services/{serviceId}/logs`
- **Description**: Get service logs

## 4. Volume Operations

### List Volumes
- **Endpoint**: `GET /v2/projects/{projectId}/volumes`
- **Description**: List volumes for a project

### Get Volume
- **Endpoint**: `GET /v2/stacks/{stackId}/volumes/{volumeId}`
- **Description**: Get volume details

### Delete Volume
- **Endpoint**: `DELETE /v2/stacks/{stackId}/volumes/{volumeId}`
- **Description**: Delete a volume

## 5. Container Image Configuration

### Get Container Image Config
- **Endpoint**: `GET /v2/container-image-config`
- **Description**: Get container image configuration

## Key Data Models

### Service Status
- `running`
- `stopped`
- `restarting`
- `error`
- `creating`
- `starting`

### ServiceResponse
Contains:
- `id`: Service UUID
- `stackId`: Parent stack UUID
- `projectId`: Parent project UUID
- `description`: Service description
- `serviceName`: Service name
- `status`: Current status
- `statusSetAt`: Timestamp of last status change
- `deployedState`: Current deployed configuration
- `pendingState`: Pending configuration (if any)
- `requiresRecreate`: Boolean indicating if recreation is needed

## Important Notes

1. **Stack Creation**: There's no direct "create stack" endpoint. Stacks appear to be created implicitly when you first use the PUT endpoint on a stack ID, or they might be created through app installations.

2. **Declarative API**: The stack management uses a declarative approach where you describe the desired state, and the system handles the transitions.

3. **Async Operations**: Service status includes states like "creating" and "starting", indicating asynchronous operations. You may need to poll the service status after operations.

4. **Volume Management**: Volumes are managed as part of stacks. Removing a volume from a stack declaration detaches it, but deletion must be explicit.

5. **Authentication**: All endpoints require authentication via `de.mittwald.v1.commons.AccessToken`.

6. **Error Responses**: Standard error responses include 400 (validation), 403 (forbidden), 404 (not found), 429 (rate limit), and 500 (server error).