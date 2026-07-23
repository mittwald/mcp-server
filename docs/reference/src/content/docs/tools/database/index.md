---
title: Database Tools
description: Complete reference for database management tools
sidebar:
  label: Database
  order: 0
lastUpdated: 2026-07-23
---

## Database Tools

Reference documentation for all database management tools.

### Available Tools

| Tool | Description |
|------|-------------|
| [`mittwald_database_mysql_create`](./mysql-create) | Create a new MySQL database. |
| [`mittwald_database_mysql_delete`](./mysql-delete) | Delete a MySQL database. |
| [`mittwald_database_mysql_dump`](./mysql-dump) | Get a ready-to-run command that dumps a MySQL database via SSH and mysqldump into a local file. This tool does not create the dump itself - run the returned command locally. |
| [`mittwald_database_mysql_get`](./mysql-get) | Get a MySQL database. |
| [`mittwald_database_mysql_import`](./mysql-import) | Get a ready-to-run command that imports a local dump file into a MySQL database via SSH. This tool does not import anything itself - run the returned command locally. Note that running the returned command overwrites data in the target database. |
| [`mittwald_database_mysql_list`](./mysql-list) | List MySQL databases. |
| [`mittwald_database_mysql_phpmyadmin`](./mysql-phpmyadmin) | Get the phpMyAdmin URL for a MySQL database's main user. This tool does not open a browser - open the returned URL yourself. |
| [`mittwald_database_mysql_port_forward`](./mysql-port-forward) | Get a ready-to-run SSH port forwarding command that exposes a MySQL database on a local TCP port. This tool does not open the tunnel itself - run the returned command locally. |
| [`mittwald_database_mysql_user_create`](./mysql-user-create) | Create a new MySQL user for a database. |
| [`mittwald_database_mysql_user_delete`](./mysql-user-delete) | Delete an existing MySQL user. |
| [`mittwald_database_mysql_user_get`](./mysql-user-get) | Retrieve details for a specific MySQL user. |
| [`mittwald_database_mysql_user_list`](./mysql-user-list) | List MySQL users for a database. |
| [`mittwald_database_mysql_user_update`](./mysql-user-update) | Update properties of an existing MySQL user. |
| [`mittwald_database_mysql_versions`](./mysql-versions) | List available MySQL versions. |
| [`mittwald_database_redis_create`](./redis-create) | Provision a new Redis database within a project. |
| [`mittwald_database_redis_get`](./redis-get) | Retrieve details for a Redis database. |
| [`mittwald_database_redis_list`](./redis-list) | List Redis databases for a project. |
| [`mittwald_database_redis_versions`](./redis-versions) | List available Redis versions. |

