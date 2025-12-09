# PHP Application Deployment Summary

**Date:** 2025-12-05
**Status:** Deployment Complete ✓

## Overview
Successfully deployed a PHP 8.4 application with MySQL 8.0 database on Mittwald hosting platform.

---

## Project Details

### Server Information
- **Server ID:** s-igc7dy (cf24e9ff-21e8-4895-82ef-47354868a861)
- **Server Name:** MCP Server Dev
- **Machine Type:** shared.xlarge (2 CPU, 4Gi memory)
- **Storage:** 50Gi
- **Cluster:** isenstedt
- **Region:** isenstedt.m3.services

### Project Information
- **Project ID:** p-ucvxdj (d4e105c6-2a8a-4f83-8e56-200642cbf0a1)
- **Project Name:** PHP App Project
- **Status:** ready
- **Created:** 2025-12-05

---

## PHP Application Details

### Installation Information
- **App Installation ID:** a-vglqpk (a5cab29a-ac00-43e6-830e-225009cbae5e)
- **App Short ID:** a-vglqpk
- **App Name:** PHP
- **Site Title:** PHP 8.2 Application
- **Status:** custom application (ready)

### File System Paths
- **Installation Path:** `/home/p-ucvxdj/html/php-8-2-application-qrkpa`
- **Document Root:** `/public` (relative to installation path)
- **Full Document Root:** `/home/p-ucvxdj/html/php-8-2-application-qrkpa/public`

### System Software Versions
- **PHP:** 8.4.13 (update policy: patchLevel)
- **Composer:** 2.7.7 (update policy: patchLevel)
- **MySQL Client:** 8.0.40 (update policy: patchLevel)

### Access Methods

#### SSH/SFTP Access
- **Hostname:** ssh.isenstedt.project.host
- **Quick Connect:** `mw app ssh a-vglqpk`

#### File Operations
```bash
# Download app files
mw app download a-vglqpk

# Upload files
mw app upload a-vglqpk <local-file>

# Get app details
mw app get a-vglqpk
```

---

## MySQL Database Details

### Database Information
- **Database ID:** mysql_u6ig4z (9a516ed3-9144-4c11-848a-ef25f9bcff80)
- **Database Short ID:** mysql_u6ig4z
- **Database Name:** mysql_u6ig4z
- **Description:** PHP App Database
- **Version:** MySQL 8.0
- **Status:** ready

### Connection Details
- **Internal Hostname:** mysql-u6ig4z.pg-s-igc7dy.db.project.host
- **External Hostname:** mysql.isenstedt.project.host
- **Port:** 3306 (standard MySQL port)

### Character Set Configuration
- **Character Set:** utf8mb4
- **Collation:** utf8mb4_unicode_ci

### Database User
- **User ID:** 8bc140f5-6f8f-4e5e-a063-f8c6097f2bb8
- **Username:** dbu_u6ig4z
- **Password:** `/6uufaaDwPoRMD+B8+xRHS/K0oPKUBThQsgPtIunOHo=`
- **Access Level:** full
- **Main User:** yes
- **Enabled:** yes
- **External Access:** no (internal only)
- **Status:** ready

---

## Connection Information for PHP Application

### Database Connection Parameters

```php
<?php
// Database connection settings
define('DB_HOST', 'mysql-u6ig4z.pg-s-igc7dy.db.project.host');
define('DB_NAME', 'mysql_u6ig4z');
define('DB_USER', 'dbu_u6ig4z');
define('DB_PASSWORD', '/6uufaaDwPoRMD+B8+xRHS/K0oPKUBThQsgPtIunOHo=');
define('DB_PORT', 3306);
define('DB_CHARSET', 'utf8mb4');

// PDO connection example
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASSWORD, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}
?>
```

### Environment Variables (.env)
```env
DB_CONNECTION=mysql
DB_HOST=mysql-u6ig4z.pg-s-igc7dy.db.project.host
DB_PORT=3306
DB_DATABASE=mysql_u6ig4z
DB_USERNAME=dbu_u6ig4z
DB_PASSWORD=/6uufaaDwPoRMD+B8+xRHS/K0oPKUBThQsgPtIunOHo=
DB_CHARSET=utf8mb4
DB_COLLATION=utf8mb4_unicode_ci
```

---

## Database Management

### Access phpMyAdmin
```bash
mw database mysql phpmyadmin mysql_u6ig4z
```

### Create Database Dump
```bash
mw database mysql dump mysql_u6ig4z > backup.sql
```

### Import Database Dump
```bash
mw database mysql import mysql_u6ig4z < backup.sql
```

### Port Forwarding (Local Access)
```bash
# Forward MySQL port to local machine
mw database mysql port-forward mysql_u6ig4z
```

### MySQL Shell Access
```bash
mw database mysql shell mysql_u6ig4z
```

---

## Next Steps

### 1. Set Up Virtual Host (Domain)
To make your application accessible via a domain:

```bash
# Replace <your-domain.com> with your actual domain
mw domain virtualhost create \
  --hostname <your-domain.com> \
  --path-to-installation /:a5cab29a-ac00-43e6-830e-225009cbae5e
```

### 2. Upload Your Application Files
```bash
# Upload your application files to the installation path
mw app upload a-vglqpk /path/to/your/local/files
```

### 3. Configure Your Application
1. SSH into the application: `mw app ssh a-vglqpk`
2. Navigate to your document root: `cd /home/p-ucvxdj/html/php-8-2-application-qrkpa/public`
3. Create your PHP application files
4. Configure database connection using the credentials above

### 4. Test Database Connection
Create a test file at `/home/p-ucvxdj/html/php-8-2-application-qrkpa/public/test-db.php`:

```php
<?php
$host = 'mysql-u6ig4z.pg-s-igc7dy.db.project.host';
$db = 'mysql_u6ig4z';
$user = 'dbu_u6ig4z';
$pass = '/6uufaaDwPoRMD+B8+xRHS/K0oPKUBThQsgPtIunOHo=';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    echo "✓ Database connection successful!<br>";
    echo "MySQL Version: " . $pdo->getAttribute(PDO::ATTR_SERVER_VERSION);
} catch (PDOException $e) {
    echo "✗ Connection failed: " . $e->getMessage();
}
?>
```

---

## Useful Commands Reference

### Application Management
```bash
# List all apps in project
mw app list --project-id p-ucvxdj

# Get app details
mw app get a-vglqpk

# SSH into app
mw app ssh a-vglqpk

# Download app files
mw app download a-vglqpk

# Upload files to app
mw app upload a-vglqpk <source>
```

### Database Management
```bash
# List databases
mw database list --project-id p-ucvxdj

# Get database details
mw database mysql get mysql_u6ig4z

# List database users
mw database mysql user list --database-id mysql_u6ig4z

# Access phpMyAdmin
mw database mysql phpmyadmin mysql_u6ig4z

# Create backup
mw database mysql dump mysql_u6ig4z > backup.sql

# MySQL shell
mw database mysql shell mysql_u6ig4z
```

### Project Management
```bash
# List all projects
mw project list

# Get project details
mw project get p-ucvxdj
```

---

## Security Notes

1. **Database Password:** The database password is stored in this document for reference. Consider storing it securely and using environment variables in production.

2. **External Access:** Database external access is currently disabled (for security). Only internal project access is allowed.

3. **User Permissions:** The database user has "full" access level to the database.

4. **SSH Access:** Use the Mittwald CLI for secure SSH access to your application.

---

## Support & Documentation

- **Mittwald CLI Documentation:** https://github.com/mittwald/cli
- **Mittwald API Documentation:** https://api.mittwald.de/v2/docs
- **Support Issues:** https://github.com/mittwald/cli/issues

---

## Summary

✓ Server: s-igc7dy (MCP Server Dev)
✓ Project: p-ucvxdj (PHP App Project)
✓ PHP App: a-vglqpk (PHP 8.4.13)
✓ MySQL Database: mysql_u6ig4z (MySQL 8.0)
✓ Database User: dbu_u6ig4z (full access)

**All resources are ready and operational!**
