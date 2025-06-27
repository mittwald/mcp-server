# Agent 4 - Database & SSH/Backup API TypeScript Fix

## Your Assignment
Fix TypeScript errors in Database and SSH/Backup APIs.

### Modules to Fix:
- `src/handlers/tools/mittwald/database/`
  - app-database.ts
  - mysql.ts
  - mysql-users.ts
  - redis.ts
- `src/handlers/tools/mittwald/ssh-backup/`
  - backups.ts
  - backup-schedules.ts
  - ssh-keys.ts
  - ssh-users.ts
  - sftp-users.ts

## Working Directory
```bash
cd /Users/robert/Code/Mittwald/agent-fix-4-database-ssh
```

## Expected API Structure

### Database APIs
- MySQL database operations
- Redis database operations
- Database user management
- App-specific database functions

### SSH/Backup APIs
- SSH key management
- SSH user creation/management
- SFTP user operations
- Backup creation and scheduling
- Backup restoration

## Common Patterns to Fix
1. Method namespace: `client.api.*` → `client.typedApi.database.*`
2. SSH methods: likely under `client.typedApi.sshsftpuser.*` or similar
3. Backup methods: check for `backup` namespace

## Discovery Process
```bash
node
> const { MittwaldAPIV2Client } = require('@mittwald/api-client');
> const client = MittwaldAPIV2Client.newWithToken('dummy');

# Find database namespaces
> Object.keys(client).filter(k => k.includes('database'))
> Object.keys(client).filter(k => k.includes('mysql'))
> Object.keys(client).filter(k => k.includes('redis'))

# Find SSH/backup namespaces  
> Object.keys(client).filter(k => k.includes('ssh'))
> Object.keys(client).filter(k => k.includes('backup'))
> Object.keys(client).filter(k => k.includes('sftp'))
```

## Database-Specific Issues
- Connection string formats
- User permission structures
- Database creation parameters

## SSH/Backup-Specific Issues
- Key format parameters
- Backup schedule structures
- SFTP vs SSH user differences

## Validation Commands
```bash
# Test database modules
npx tsc --noEmit src/handlers/tools/mittwald/database/*.ts

# Test SSH/backup modules
npx tsc --noEmit src/handlers/tools/mittwald/ssh-backup/*.ts

# Full test
npm run build
```

## Document Your Findings
Create `coordination/agent-4-findings.md` with:
- Complete namespace mappings
- Parameter structure changes
- Any methods that don't exist in SDK
- Workarounds for missing functionality