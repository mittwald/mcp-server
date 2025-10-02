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
