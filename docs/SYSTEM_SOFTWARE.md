# System Software in Mittwald Apps

## Overview

Mittwald allows installing **system software** (runtime dependencies and tools) alongside any app installation, including static apps. This enables apps to use tools like Composer, ImageMagick, PHP, Node.js, and more for build processes, image optimization, and runtime operations.

## Key Concepts

### What is System Software?

System software refers to runtime environments and tools that can be installed as dependencies of your app:
- **PHP** - Various PHP versions for runtime
- **Node.js** - JavaScript runtime for build tools or server-side JS
- **Python** - Python runtime
- **Ruby** - Ruby runtime
- **Composer** - PHP dependency manager
- **ImageMagick** - Image processing library
- **MySQL/MariaDB clients** - Database connectivity
- **Git** - Version control
- And many more...

### How It Works

1. **App Creation**: When creating any app (including static apps), system software can be specified
2. **Runtime Dependencies**: System software is available during build and runtime
3. **Version Management**: Each software has multiple versions with update policies
4. **Updates**: Software can be updated independently of the app

## MCP Tool Support

Our MCP server now fully supports system software management:

### 1. List Available System Software
```
Tool: mittwald_app_dependency_list
Parameters:
  - output: json|txt|yaml|csv|tsv (optional)
  
Example: List all available system software
```

### 2. Check Software Versions
```
Tool: mittwald_app_dependency_versions
Parameters:
  - systemsoftware: Software name or ID (required)
  - output: json|txt|yaml (optional)
  
Example: mittwald_app_dependency_versions --systemsoftware=composer
```

### 3. View Installed Software
```
Tool: mittwald_app_dependency_get
Parameters:
  - installationId: App installation ID (required)
  - output: json|txt|yaml (optional)
  
Example: See what's installed on an app
```

### 4. Update System Software
```
Tool: mittwald_app_dependency_update
Parameters:
  - installationId: App installation ID (required)
  - set: Array of software=version specs (required)
  - updatePolicy: none|inheritedFromApp|patchLevel|all (optional)
  
Example: 
mittwald_app_dependency_update \
  --installationId=<app-id> \
  --set composer=~2 \
  --set imagemagick=~7 \
  --updatePolicy=patchLevel
```

## Use Cases

### Static App with Build Tools

A static site that needs build tools:
```bash
# Create static app
mittwald_app_create_static --projectId=<id> --documentRoot=dist

# Add Node.js for build tools
mittwald_app_dependency_update \
  --installationId=<app-id> \
  --set nodejs=~20 \
  --set composer=~2
```

### PHP App with ImageMagick

A PHP app that processes images:
```bash
# Add ImageMagick to existing PHP app
mittwald_app_dependency_update \
  --installationId=<app-id> \
  --set imagemagick=~7 \
  --updatePolicy=patchLevel
```

### Python App with Multiple Dependencies

```bash
# Add multiple dependencies
mittwald_app_dependency_update \
  --installationId=<app-id> \
  --set python=~3.11 \
  --set nodejs=~18 \
  --set imagemagick=latest
```

## Version Specifiers

- **Exact version**: `composer=2.5.8`
- **Patch updates**: `composer=~2` (allows 2.x updates)
- **Latest version**: `composer=latest` or `composer=*`
- **Specific minor**: `nodejs=~20.10` (allows 20.10.x)

## Update Policies

- **none**: No automatic updates
- **inheritedFromApp**: Follow the app's update policy
- **patchLevel**: Only patch updates (2.5.1 → 2.5.2)
- **all**: All updates including major versions

## Important Notes

1. **App Type Agnostic**: System software can be installed on ANY app type, including static apps
2. **Build Time Access**: Software is available during deployment/build processes
3. **Runtime Access**: Software remains available during app runtime
4. **Independent Updates**: System software can be updated without updating the app
5. **Version Conflicts**: Some software versions may have conflicts - check compatibility

## Common Software IDs

While the handlers dynamically resolve names, here are some known IDs:
- PHP: `34220303-cb87-4592-8a95-2eb20a97b2ac`
- Node.js: `3e7f920b-a711-4d2f-9871-661e1b41a2f0`
- Python: `be57d166-dae9-4480-bae2-da3f3c6f0a2e`

Use `mittwald_app_dependency_list` to get the complete current list.

## Examples in Practice

### Static Site with Asset Pipeline
```bash
# Create a static site that uses Node.js for asset compilation
mittwald_app_create_static \
  --projectId=<project-id> \
  --documentRoot=public \
  --siteTitle="My Static Site"

# Add Node.js for webpack/gulp/etc
mittwald_app_dependency_update \
  --installationId=<app-id> \
  --set nodejs=~20 \
  --updatePolicy=patchLevel
```

### WordPress with Image Optimization
```bash
# Add ImageMagick to WordPress for better image handling
mittwald_app_dependency_update \
  --installationId=<wordpress-app-id> \
  --set imagemagick=~7 \
  --set composer=~2
```

This feature makes Mittwald apps highly flexible, allowing any app to have the system tools it needs for both build-time and runtime operations.