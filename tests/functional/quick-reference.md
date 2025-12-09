# Quick Reference Card - PHP Deployment

## Essential IDs
- **Project:** p-ucvxdj
- **App:** a-vglqpk
- **Database:** mysql_u6ig4z
- **Database User:** dbu_u6ig4z

## Database Connection
```
Host: mysql-u6ig4z.pg-s-igc7dy.db.project.host
Database: mysql_u6ig4z
Username: dbu_u6ig4z
Password: /6uufaaDwPoRMD+B8+xRHS/K0oPKUBThQsgPtIunOHo=
Port: 3306
```

## File Paths
```
Installation: /home/p-ucvxdj/html/php-8-2-application-qrkpa
Document Root: /home/p-ucvxdj/html/php-8-2-application-qrkpa/public
```

## Quick Commands
```bash
# SSH access
mw app ssh a-vglqpk

# phpMyAdmin
mw database mysql phpmyadmin mysql_u6ig4z

# Database shell
mw database mysql shell mysql_u6ig4z

# Upload files
mw app upload a-vglqpk <source>

# Download files
mw app download a-vglqpk
```

## Setup Domain
```bash
mw domain virtualhost create \
  --hostname <your-domain.com> \
  --path-to-installation /:a5cab29a-ac00-43e6-830e-225009cbae5e
```
