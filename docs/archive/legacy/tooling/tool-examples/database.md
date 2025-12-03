# Database Tool Examples

## MySQL User Management

### Create MySQL User
```json
{
  "name": "mittwald_database_mysql_user_create",
  "arguments": {
    "databaseId": "mysql-12345",
    "description": "Application user",
    "accessLevel": "full"
  }
}
```

### List MySQL Users
```json
{
  "name": "mittwald_database_mysql_user_list",
  "arguments": {
    "databaseId": "mysql-12345"
  }
}
```

### ⚠️ Delete MySQL Database (DESTRUCTIVE)
```json
{
  "name": "mittwald_database_mysql_delete",
  "arguments": {
    "databaseId": "mysql-12345",
    "confirm": true
  }
}
```
**WARNING**: This permanently removes the database and its data. The `confirm: true` parameter is REQUIRED.

### ⚠️ Delete MySQL User (DESTRUCTIVE)
```json
{
  "name": "mittwald_database_mysql_user_delete",
  "arguments": {
    "userId": "mysql-user-abcde",
    "confirm": true
  }
}
```
**WARNING**: Removing a MySQL user revokes its credentials immediately. `confirm: true` must be provided.

## Redis Database Management

### Create Redis Database
```json
{
  "name": "mittwald_database_redis_create",
  "arguments": {
    "projectId": "p-12345",
    "version": "7.2",
    "description": "Application cache"
  }
}
```
