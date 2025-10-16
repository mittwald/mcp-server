# Credential Security Architecture

**Version**: 1.0
**Status**: 🟢 REQUIRED STANDARD
**Established**: 2025-10-02
**Based On**: Agent C3 database tools implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Multi-Tenant Security Challenge](#the-multi-tenant-security-challenge)
3. [Credential Leakage Vectors](#credential-leakage-vectors)
4. [Defense in Depth: Three-Layer Security Model](#defense-in-depth-three-layer-security-model)
5. [Integration with OAuth 2.1 Architecture](#integration-with-oauth-21-architecture)
6. [Multi-Tenant Attack Scenarios Prevented](#multi-tenant-attack-scenarios-prevented)
7. [Security Utilities Reference](#security-utilities-reference)
8. [Implementation Requirements](#implementation-requirements)
9. [Automated Enforcement](#automated-enforcement)
10. [Migration Guide for Existing Tools](#migration-guide-for-existing-tools)
11. [Compliance and Audit Considerations](#compliance-and-audit-considerations)

---

## Executive Summary

The Mittwald MCP Server is a **multi-tenant OAuth 2.1 system** where multiple users manage hosting infrastructure through AI assistants. Each user's session contains sensitive credentials (database passwords, API tokens, SSH keys) that must be protected from leakage across four critical surfaces:

1. **Redis session storage** (backups, monitoring)
2. **Log aggregation** (CloudWatch, Datadog)
3. **MCP client caches** (conversation history)
4. **Error traces** (debugging output)

This document establishes a **three-layer defense-in-depth security model** that prevents credential leakage in multi-tenant environments:

- **Layer 1**: Cryptographic credential generation using `crypto.randomBytes()`
- **Layer 2**: Automatic command redaction before logging
- **Layer 3**: Response sanitization (boolean flags, not values)

**All tools that handle passwords, tokens, API keys, or secrets MUST implement this standard.** Automated enforcement via ESLint and CI prevents regressions.

---

## The Multi-Tenant Security Challenge

### Architecture Overview

```
┌─────────────────┐
│ User (Tenant A) │
└────────┬────────┘
         │ OAuth 2.1 + PKCE
         ↓
┌─────────────────────────────────┐
│ OAuth Bridge                    │
│ (mittwald-oauth-server.fly.dev) │
└────────┬────────────────────────┘
         │ JWT with embedded Mittwald tokens
         ↓
┌─────────────────────────────────┐
│ MCP Server (Express.js)         │
│ - JWT verification              │
│ - Redis session storage         │
│ - 8-hour TTL, auto-refresh      │
└────────┬────────────────────────┘
         │ Session-aware CLI
         ↓
┌─────────────────────────────────┐
│ CLI Execution                   │
│ mw --token <user_token> [cmd]   │
└────────┬────────────────────────┘
         │ Per-user authentication
         ↓
┌─────────────────────────────────┐
│ Mittwald API                    │
│ (per-user resources)            │
└─────────────────────────────────┘
```

### Key Security Properties

| Property | Description | Security Implication |
|----------|-------------|---------------------|
| **Multi-tenant** | Each session belongs to a different Mittwald user | Credential isolation is critical |
| **OAuth 2.1** | Access tokens embedded in bridge JWTs | Protects API auth, NOT user-managed credentials |
| **Redis sessions** | 8-hour TTL with automatic token refresh | Session storage must not leak credentials |
| **Per-user CLI auth** | Every `mw` command uses `--token <user_token>` | CLI commands create credentials on user's behalf |
| **Shared infrastructure** | Logs, monitoring, backups shared across tenants | One tenant's data must not leak to another |

### The Credential Isolation Problem

**OAuth 2.1 protects**:
- ✅ User authentication (who is making the request)
- ✅ API authorization (what resources user can access)
- ✅ Token lifecycle (refresh, expiry, revocation)

**OAuth 2.1 DOES NOT protect**:
- ❌ Database passwords created BY the authenticated user
- ❌ API keys generated FOR the authenticated user
- ❌ SSH keys, mail passwords, FTP credentials managed by user

**Example**:
```typescript
// User A (authenticated via OAuth) creates a MySQL user
POST /mcp/tools/call
Authorization: Bearer <jwt_with_mittwald_tokens>

{
  "name": "mittwald_database_mysql_user_create",
  "arguments": {
    "databaseId": "mysql-12345",
    "password": "UserA-Secret-2025"  // ⚠️ NOT an OAuth token!
  }
}

// This password needs protection from:
// - Redis backups
// - Log aggregation
// - MCP client caches
// - Error traces
// - Support staff debugging other users
```

---

## Credential Leakage Vectors

### Vector 1: Redis Session Storage

**Problem**: Sessions persist in Redis for 8 hours with automatic backups.

```typescript
// ❌ VULNERABLE CODE
sessionManager.upsertSession({
  sessionId: 'sess-abc',
  mittwaldAccessToken: 'mwat_user_a...',
  databasePassword: 'UserA-Secret-2025'  // ❌ Stored in Redis
});
```

**Leakage Scenarios**:
- Daily Redis backup to S3 → passwords in backup files
- Redis monitoring (INFO STATS) → passwords in metrics
- Redis replication → passwords copied to replica nodes
- Session debugging → support staff sees passwords

**Impact**: Attacker with backup access gets ALL tenant credentials.

---

### Vector 2: CLI Command Metadata

**Problem**: CLI execution logs commands with full arguments.

```typescript
// ❌ VULNERABLE CODE
const result = await executeCli([
  'database', 'mysql', 'user', 'create',
  '--password', 'UserA-Secret-2025'
]);

logger.info('CLI executed', {
  command: result.meta.command
  // ❌ Logs: "mw database mysql user create --password UserA-Secret-2025"
});
```

**Leakage Scenarios**:
- CloudWatch/Datadog log aggregation → passwords in centralized logs
- Log search by support engineers → User B's engineer sees User A's password
- Log export for compliance → passwords in exported files
- Error tracking (Sentry) → passwords in error context

**Impact**: Shared log infrastructure exposes credentials across tenant boundaries.

---

### Vector 3: MCP Tool Responses

**Problem**: Tool responses returned to MCP clients contain full data.

```typescript
// ❌ VULNERABLE CODE
return formatToolResponse('success', 'User created', {
  userId: 'u-123',
  password: 'UserA-Secret-2025'  // ❌ Returned to client
});
```

**Leakage Scenarios**:
- Claude Code conversation history → password in cached responses
- ChatGPT conversation export → user exports JSON with passwords
- MCP client debugging → passwords in network inspector
- Response compression logs → passwords in middleware logs

**Impact**: Passwords persist in client-side caches and export files.

---

### Vector 4: Error Messages and Stack Traces

**Problem**: Errors include full context for debugging.

```typescript
// ❌ VULNERABLE CODE
try {
  await createDatabaseUser({
    databaseId: 'mysql-123',
    password: 'UserA-Secret-2025'
  });
} catch (error) {
  logger.error('User creation failed', {
    error: error.message,  // ❌ May contain "Invalid password: UserA-Secret-2025"
    args: { password: 'UserA-Secret-2025' }  // ❌ Full args logged
  });

  throw new Error(`Failed to create user: ${JSON.stringify(args)}`);
  // ❌ Stack trace contains password
}
```

**Leakage Scenarios**:
- Error tracking (Sentry, Rollbar) → passwords in error metadata
- Stack traces in logs → passwords in call context
- Retry logic logs → passwords repeated in retry attempts
- User-facing error messages → passwords shown to users

**Impact**: Debugging infrastructure becomes a credential disclosure vector.

---

## Defense in Depth: Three-Layer Security Model

### Overview

```
┌──────────────────────────────────────────────────────────────┐
│ Layer 1: Cryptographic Generation                           │
│ - Use crypto.randomBytes() for passwords/tokens             │
│ - Base64url encoding (URL-safe)                             │
│ - 24-character default (144 bits entropy)                   │
│ - Statistical uniqueness across all tenants                 │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ Layer 2: Command Redaction                                  │
│ - Sanitize CLI commands BEFORE logging                      │
│ - Replace --password secret → --password [REDACTED]         │
│ - Apply to ALL log points (info, error, debug)              │
│ - Shared log infrastructure safe for all tenants            │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ Layer 3: Response Sanitization                              │
│ - Convert password → passwordChanged: boolean                │
│ - Only return generated credentials (never echo user input) │
│ - Auto-redact metadata in tool responses                    │
│ - Redis sessions store flags, not values                    │
└──────────────────────────────────────────────────────────────┘
```

---

### Layer 1: Cryptographic Credential Generation

**Utility**: `src/utils/credential-generator.ts`

#### Implementation

```typescript
import { randomBytes } from 'node:crypto';

export interface GeneratePasswordOptions {
  length?: number;          // Default: 24
  minLength?: number;       // Default: 12
  encoding?: 'base64url' | 'hex' | 'base64';  // Default: 'base64url'
}

export interface GeneratedCredential {
  value: string;
  generated: boolean;
  length: number;
  encoding: string;
}

/**
 * Generate a cryptographically secure password.
 *
 * Uses Node.js crypto.randomBytes() for cryptographic randomness.
 * Base64url encoding ensures URL-safe characters without padding.
 *
 * @param options - Password generation options
 * @returns Generated credential details
 *
 * @example
 * const password = generateSecurePassword({ length: 32 });
 * console.log(password.value); // "dGhpc2lzYXNlY3VyZXBhc3N3b3Jk..."
 * console.log(password.generated); // true
 */
export function generateSecurePassword(
  options: GeneratePasswordOptions = {}
): GeneratedCredential {
  const {
    length = 24,
    minLength = 12,
    encoding = 'base64url'
  } = options;

  const targetLength = Math.max(minLength, length);
  let password = '';

  // Generate random bytes until we reach target length
  while (password.length < targetLength) {
    password += randomBytes(targetLength).toString(encoding);
  }

  return {
    value: password.slice(0, targetLength),
    generated: true,
    length: targetLength,
    encoding
  };
}

/**
 * Generate a secure API token (longer, hex-encoded).
 *
 * @param length - Token length (default: 64)
 * @returns Generated token details
 */
export function generateSecureToken(length: number = 64): GeneratedCredential {
  return generateSecurePassword({ length, encoding: 'hex' });
}
```

#### Multi-Tenant Guarantees

| Property | Guarantee | Math |
|----------|-----------|------|
| **Uniqueness** | Statistically unique across all tenants | 24-char base64url = 144 bits entropy |
| **Collision probability** | Negligible with millions of tenants | P(collision) with 1M tenants ≈ 1 in 10^33 |
| **Predictability** | Impossible (CSPRNG backed by OS entropy) | `/dev/urandom` on Linux, `CryptGenRandom` on Windows |
| **URL safety** | Safe in CLI args, URLs, headers | Base64url avoids `+`, `/`, `=` |

#### Usage Pattern

```typescript
// ✅ SECURE: Database password generation
import { generateSecurePassword } from '../../utils/credential-generator.js';

async function handleDatabaseUserCreate(args: {
  databaseId: string;
  password?: string;
}) {
  const passwordGenerated = !args.password;
  const password = args.password ?? generateSecurePassword({ length: 24 }).value;

  // Use password in CLI execution...

  return {
    userId: result.userId,
    password: passwordGenerated ? password : undefined,  // ✅ Only if generated
    passwordGenerated
  };
}
```

---

### Layer 2: Command Redaction Before Logging

**Utility**: `src/utils/credential-redactor.ts`

#### Implementation

```typescript
export interface RedactionPattern {
  pattern: RegExp;
  placeholder: string;
}

/**
 * Common credential patterns found in CLI commands.
 */
export const DEFAULT_CREDENTIAL_PATTERNS: RedactionPattern[] = [
  { pattern: /--password\s+\S+/g, placeholder: '--password [REDACTED]' },
  { pattern: /--token\s+\S+/g, placeholder: '--token [REDACTED]' },
  { pattern: /--api-key\s+\S+/g, placeholder: '--api-key [REDACTED]' },
  { pattern: /--secret\s+\S+/g, placeholder: '--secret [REDACTED]' },
  { pattern: /--access-token\s+\S+/g, placeholder: '--access-token [REDACTED]' },
  { pattern: /password=["']?[^"'\s]+["']?/gi, placeholder: 'password=[REDACTED]' },
  { pattern: /token=["']?[^"'\s]+["']?/gi, placeholder: 'token=[REDACTED]' },
];

export interface RedactCommandOptions {
  command: string;
  patterns?: RedactionPattern[];
  preserveLength?: boolean;  // Show "[REDACTED:16]" instead of "[REDACTED]"
}

/**
 * Redact credentials from CLI command strings before logging.
 *
 * @param options - Redaction options
 * @returns Sanitized command string safe for logging
 *
 * @example
 * const cmd = "mw database mysql user create --password secret123";
 * const safe = redactCredentialsFromCommand({ command: cmd });
 * console.log(safe); // "mw database mysql user create --password [REDACTED]"
 */
export function redactCredentialsFromCommand(
  options: RedactCommandOptions
): string {
  const {
    command,
    patterns = DEFAULT_CREDENTIAL_PATTERNS,
    preserveLength = false
  } = options;

  let sanitized = command;

  for (const { pattern, placeholder } of patterns) {
    if (preserveLength && pattern.test(sanitized)) {
      // Extract original length and show it
      const match = sanitized.match(pattern);
      if (match) {
        const originalLength = match[0].split(/\s+/)[1]?.length ?? 0;
        const lengthPlaceholder = placeholder.replace(
          '[REDACTED]',
          `[REDACTED:${originalLength}]`
        );
        sanitized = sanitized.replace(pattern, lengthPlaceholder);
      }
    } else {
      sanitized = sanitized.replace(pattern, placeholder);
    }
  }

  return sanitized;
}

/**
 * Redact credentials from tool response metadata.
 *
 * @param meta - Tool response metadata containing command
 * @returns Sanitized metadata
 */
export function redactMetadata(
  meta: { command?: string; [key: string]: unknown }
): typeof meta {
  if (!meta.command) {
    return meta;
  }

  return {
    ...meta,
    command: redactCredentialsFromCommand({ command: meta.command })
  };
}
```

#### Multi-Tenant Guarantees

| Scenario | Guarantee |
|----------|-----------|
| **Shared CloudWatch logs** | No tenant credentials visible |
| **Support engineer debugging** | Safe to search logs across all tenants |
| **Log export for compliance** | Exported files contain no passwords |
| **Monitoring dashboards** | Commands displayable without security risk |
| **Error tracking (Sentry)** | Error context safe to aggregate |

#### Usage Pattern

```typescript
// ✅ SECURE: CLI execution with auto-redaction
import { redactCredentialsFromCommand } from '../../utils/credential-redactor.js';

async function executeDatabaseCommand(argv: string[]) {
  const result = await executeCli(argv);

  // Redact BEFORE any logging
  const sanitizedCommand = redactCredentialsFromCommand({
    command: result.meta.command
  });

  logger.info('CLI executed', {
    command: sanitizedCommand,  // ✅ "mw ... --password [REDACTED]"
    durationMs: result.meta.durationMs
  });

  return result;
}
```

---

### Layer 3: Response Sanitization

**Utility**: `src/utils/credential-response.ts`

#### Implementation

```typescript
import { formatToolResponse } from './format-tool-response.js';
import { redactMetadata } from './credential-redactor.js';

export interface BuildUpdatedAttributesOptions {
  password?: string;
  token?: string;
  apiKey?: string;
  secret?: string;
  [key: string]: unknown;
}

/**
 * Build updated attributes object with credential flags (not values).
 *
 * SECURITY: Never include actual credential values in response data.
 * Use boolean flags to indicate whether credentials were changed.
 *
 * @param attributes - Update attributes
 * @returns Safe attributes object with credential flags
 *
 * @example
 * const attrs = buildUpdatedAttributes({
 *   description: "New desc",
 *   password: "secret123",
 *   accessLevel: "full"
 * });
 *
 * console.log(attrs);
 * // {
 * //   description: "New desc",
 * //   accessLevel: "full",
 * //   passwordChanged: true  // ✅ Boolean flag, not actual password
 * // }
 */
export function buildUpdatedAttributes(
  attributes: BuildUpdatedAttributesOptions
): Record<string, unknown> {
  const safe: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(attributes)) {
    // Convert credential fields to boolean flags
    if (key === 'password') {
      safe.passwordChanged = !!value;
    } else if (key === 'token') {
      safe.tokenChanged = !!value;
    } else if (key === 'apiKey') {
      safe.apiKeyChanged = !!value;
    } else if (key === 'secret') {
      safe.secretChanged = !!value;
    } else {
      // Safe to include non-credential values
      safe[key] = value;
    }
  }

  return safe;
}

/**
 * Build a secure tool response with redacted metadata.
 *
 * @param status - Response status
 * @param message - User-facing message
 * @param data - Response data (will sanitize credential fields)
 * @param meta - Metadata (will redact credentials from command)
 * @returns Formatted tool response
 */
export function buildSecureToolResponse(
  status: 'success' | 'error',
  message: string,
  data?: Record<string, unknown>,
  meta?: { command?: string; durationMs?: number; [key: string]: unknown }
) {
  // Redact credentials from metadata
  const sanitizedMeta = meta ? redactMetadata(meta) : undefined;

  // Remove credential values from data (if buildUpdatedAttributes not already used)
  const sanitizedData = data ? buildUpdatedAttributes(data) : undefined;

  return formatToolResponse(status, message, sanitizedData, sanitizedMeta);
}
```

#### Multi-Tenant Guarantees

| Storage Location | Guarantee |
|------------------|-----------|
| **Redis sessions** | Only boolean flags stored (`passwordChanged: true`) |
| **MCP client cache** | No credential values in conversation history |
| **Session backups** | Backup files contain no passwords |
| **Response logs** | Middleware can log responses safely |
| **Error traces** | Safe to include response data in errors |

#### Usage Pattern

```typescript
// ✅ SECURE: MySQL user update with auto-sanitization
import { buildSecureToolResponse } from '../../utils/credential-response.js';

async function handleDatabaseUserUpdate(args: {
  userId: string;
  password?: string;
  accessLevel?: string;
}) {
  const result = await executeCli([
    'database', 'mysql', 'user', 'update', args.userId,
    ...(args.password ? ['--password', args.password] : []),
    ...(args.accessLevel ? ['--access-level', args.accessLevel] : [])
  ]);

  return buildSecureToolResponse('success', 'User updated', {
    userId: args.userId,
    password: args.password,      // ✅ Auto-converted to passwordChanged: true
    accessLevel: args.accessLevel
  }, {
    command: result.meta.command,  // ✅ Auto-redacted
    durationMs: result.meta.durationMs
  });

  // Response data:
  // {
  //   userId: "u-123",
  //   passwordChanged: true,  // ✅ Boolean flag
  //   accessLevel: "full"
  // }
  //
  // Metadata:
  // {
  //   command: "mw database mysql user update u-123 --password [REDACTED] --access-level full",
  //   durationMs: 234
  // }
}
```

---

## Integration with OAuth 2.1 Architecture

### Credential Flow Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│ Step 1: User Authenticates (OAuth 2.1 + PKCE)                    │
└───────────────────────────────────────────────────────────────────┘
                              ↓
        ┌──────────────────────────────────────────┐
        │ Mittwald OAuth Server                    │
        │ - User login UI                          │
        │ - Consent screen                         │
        │ - Issues access token + refresh token    │
        └──────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────────┐
│ Step 2: OAuth Bridge Receives Tokens                             │
│                                                                   │
│ {                                                                 │
│   "access_token": "mwat_tenant_a_abc123...",  ← OAuth token     │
│   "refresh_token": "mwrt_tenant_a_def456...", ← OAuth token     │
│   "scope": "database:write mail:write"                           │
│ }                                                                 │
└───────────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────────┐
│ Step 3: Bridge Embeds Tokens in JWT                              │
│                                                                   │
│ {                                                                 │
│   "iss": "https://mittwald-oauth-server.fly.dev",                │
│   "sub": "tenant-a-user-123",                                    │
│   "mittwaldAccessToken": "mwat_tenant_a_abc123...", ← Embedded  │
│   "mittwaldRefreshToken": "mwrt_tenant_a_def456..." ← Embedded  │
│ }                                                                 │
└───────────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────────┐
│ Step 4: MCP Server Stores in Redis                               │
│                                                                   │
│ session:sess-abc = {                                              │
│   mittwaldAccessToken: "mwat_tenant_a_abc123...",                │
│   mittwaldRefreshToken: "mwrt_tenant_a_def456...",               │
│   scope: "database:write mail:write",                            │
│   expiresAt: 1696789200,                                         │
│   // ❌ NEVER store CLI-created passwords here                   │
│ }                                                                 │
└───────────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────────┐
│ Step 5: User Creates Database User (CLI Command)                 │
│                                                                   │
│ Tool call: mittwald_database_mysql_user_create                   │
│ {                                                                 │
│   "databaseId": "mysql-12345",                                   │
│   "password": undefined  ← Not provided, will generate          │
│ }                                                                 │
└───────────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────────┐
│ Step 6: Layer 1 - Generate Secure Password                       │
│                                                                   │
│ const pwd = generateSecurePassword({ length: 24 });              │
│ // pwd.value = "dGhpc2lzYXNlY3VyZXBhc3N3b3Jk"                   │
│ // 144 bits entropy, cryptographically unique                    │
└───────────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────────┐
│ Step 7: CLI Execution with OAuth Token                           │
│                                                                   │
│ mw database mysql user create \                                   │
│   --token mwat_tenant_a_abc123... \  ← OAuth token (API auth)   │
│   --database-id mysql-12345 \                                     │
│   --password dGhpc2lzYXNlY3VyZXBhc3N3b3Jk  ← Generated password │
└───────────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────────┐
│ Step 8: Layer 2 - Redact Before Logging                          │
│                                                                   │
│ logger.info('CLI executed', {                                     │
│   command: redactCredentialsFromCommand({                         │
│     command: result.meta.command                                  │
│   })                                                              │
│ });                                                               │
│                                                                   │
│ // Logs: "mw database mysql user create --token [REDACTED] \     │
│ //        --database-id mysql-12345 --password [REDACTED]"       │
└───────────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────────┐
│ Step 9: Layer 3 - Sanitize Response                              │
│                                                                   │
│ return buildSecureToolResponse('success', 'User created', {      │
│   userId: 'u-123',                                                │
│   password: pwd.value,  ← Only returned ONCE (generated)        │
│   passwordGenerated: true                                        │
│ }, {                                                              │
│   command: result.meta.command  ← Auto-redacted                 │
│ });                                                               │
│                                                                   │
│ // Response to client:                                            │
│ // {                                                              │
│ //   userId: "u-123",                                             │
│ //   password: "dGhpc2lzYXNlY3VyZXBhc3N3b3Jk",  ← Returned     │
│ //   passwordGenerated: true                                     │
│ // }                                                              │
│ //                                                                │
│ // Metadata (logged):                                             │
│ // {                                                              │
│ //   command: "mw ... --password [REDACTED]"  ← Redacted        │
│ // }                                                              │
└───────────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────────┐
│ Step 10: Subsequent Update (User-Provided Password)              │
│                                                                   │
│ Tool call: mittwald_database_mysql_user_update                   │
│ {                                                                 │
│   "userId": "u-123",                                              │
│   "password": "tenant-a-new-secret"  ← User provided            │
│ }                                                                 │
└───────────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────────┐
│ Step 11: Layer 3 - Never Echo User Password                      │
│                                                                   │
│ return buildSecureToolResponse('success', 'User updated', {      │
│   userId: 'u-123',                                                │
│   password: 'tenant-a-new-secret'  ← Converted to flag          │
│ });                                                               │
│                                                                   │
│ // Response to client:                                            │
│ // {                                                              │
│ //   userId: "u-123",                                             │
│ //   passwordChanged: true  ← Boolean flag, NOT password value  │
│ // }                                                              │
│ //                                                                │
│ // ✅ User-provided password NEVER echoed back                   │
└───────────────────────────────────────────────────────────────────┘
```

### OAuth Token vs. User-Managed Credentials

| Aspect | OAuth Access Token | Database Password | Mailbox Password | API Token | SSH Key |
|--------|-------------------|-------------------|------------------|-----------|---------|
| **Issued by** | Mittwald OAuth | User (via CLI) | User (via CLI) | User (via CLI) | User (via CLI) |
| **Protected by** | OAuth 2.1 spec | This standard | This standard | This standard | This standard |
| **Stored in session** | ✅ Yes (8h TTL) | ❌ No | ❌ No | ❌ No | ❌ No |
| **Logged in commands** | ✅ Redacted | ✅ Redacted | ✅ Redacted | ✅ Redacted | ✅ Redacted |
| **Returned in response** | ❌ No | ✅ If generated | ✅ If generated | ✅ If generated | ✅ If generated |
| **Multi-tenant isolation** | Per-user token | Layer 1+2+3 | Layer 1+2+3 | Layer 1+2+3 | Layer 1+2+3 |

**Key Insight**: OAuth 2.1 authenticates the USER making the request. This standard protects the CREDENTIALS created/managed by that user.

---

## Multi-Tenant Attack Scenarios Prevented

### Scenario 1: Redis Backup Exposure

**Attack**: Attacker gains access to daily Redis backup files stored in S3.

#### Without This Standard ❌

```typescript
// Tenant A creates database user
const result = await createDatabaseUser({
  databaseId: 'mysql-12345',
  password: 'TenantA-Secret-2025'
});

// Session stored in Redis
session:sess-abc = {
  mittwaldAccessToken: 'mwat_tenant_a...',
  databasePassword: 'TenantA-Secret-2025'  // ❌ VULNERABLE
}

// Daily backup to S3
// → s3://backups/redis-dump-2025-10-02.rdb contains password

// Attacker downloads backup
// → Extracts all session keys
// → Gets passwords for ALL tenants
```

**Impact**: Complete credential compromise for all tenants.

#### With This Standard ✅

```typescript
// Tenant A creates database user
const password = generateSecurePassword({ length: 24 }).value;
const result = await createDatabaseUser({
  databaseId: 'mysql-12345',
  password  // Used in CLI, not stored
});

// Session stored in Redis
session:sess-abc = {
  mittwaldAccessToken: 'mwat_tenant_a...',
  // ✅ NO password stored
}

// Response to client (ONLY ONCE)
{
  userId: 'u-123',
  password: password,  // ✅ Returned to user, not stored
  passwordGenerated: true
}

// Daily backup to S3
// → s3://backups/redis-dump-2025-10-02.rdb contains NO passwords

// Attacker downloads backup
// → Extracts session keys
// → Finds ONLY OAuth tokens (which expire in 8 hours)
// → NO database passwords
```

**Impact**: Attacker gets nothing useful (expired OAuth tokens).

---

### Scenario 2: Shared Log Infrastructure

**Attack**: Support engineer debugging Tenant B's issue searches CloudWatch logs.

#### Without This Standard ❌

```typescript
// Tenant A creates database user
logger.info('CLI executed', {
  command: 'mw database mysql user create --password TenantA-Secret-2025'
  // ❌ VULNERABLE
});

// CloudWatch log entry:
// 2025-10-02T10:00:00Z INFO CLI executed
//   command="mw database mysql user create --password TenantA-Secret-2025"

// Support engineer searches for "mysql user create"
// → Sees Tenant A's password in results
// → Now has unauthorized access to Tenant A's database
```

**Impact**: Cross-tenant credential disclosure via log search.

#### With This Standard ✅

```typescript
// Tenant A creates database user
const sanitizedCommand = redactCredentialsFromCommand({
  command: 'mw database mysql user create --password TenantA-Secret-2025'
});

logger.info('CLI executed', {
  command: sanitizedCommand  // ✅ SAFE
});

// CloudWatch log entry:
// 2025-10-02T10:00:00Z INFO CLI executed
//   command="mw database mysql user create --password [REDACTED]"

// Support engineer searches for "mysql user create"
// → Sees redacted command for ALL tenants
// → Cannot extract any passwords
```

**Impact**: No credential disclosure. Logs safe for shared viewing.

---

### Scenario 3: MCP Client Conversation Export

**Attack**: User exports Claude conversation to share with team, accidentally commits to GitHub.

#### Without This Standard ❌

```typescript
// User: "Create a database user for my app"
// Claude calls tool, gets response:
{
  userId: 'u-123',
  password: 'generated-secret-abc123'  // ❌ VULNERABLE
}

// Claude shows password to user (first time - OK)
// User: "Update the access level to readonly"
// Claude calls update tool, gets response:
{
  userId: 'u-123',
  password: 'user-provided-new-password',  // ❌ ECHOED BACK
  accessLevel: 'readonly'
}

// User exports conversation as JSON
// → Password appears TWICE in exported file
// → User adds to docs/ folder
// → Commits to GitHub
// → Password now public
```

**Impact**: Credential leakage via conversation export.

#### With This Standard ✅

```typescript
// User: "Create a database user for my app"
// Claude calls tool, gets response:
{
  userId: 'u-123',
  password: 'generated-secret-abc123',  // ✅ Returned ONLY ONCE
  passwordGenerated: true
}

// Claude shows password to user (first time - OK)

// User: "Update the access level to readonly"
// Claude calls update tool, gets response:
{
  userId: 'u-123',
  passwordChanged: false,  // ✅ Boolean flag
  accessLevel: 'readonly'
}

// User exports conversation as JSON
// → First password present (user needs to save it)
// → Update has NO password (only flag)
// → If committed to GitHub: only ONE exposure (initial generation)
// → User-provided passwords NEVER appear
```

**Impact**: Minimal exposure (generated password shown once). User-provided passwords never leaked.

---

### Scenario 4: Error Tracking Aggregation

**Attack**: Sentry/Rollbar aggregates errors across all tenants into single dashboard.

#### Without This Standard ❌

```typescript
// Tenant A's database creation fails
try {
  await createDatabaseUser({
    databaseId: 'mysql-invalid',
    password: 'TenantA-Secret-2025'
  });
} catch (error) {
  logger.error('User creation failed', {
    error: error.message,
    args: { password: 'TenantA-Secret-2025' }  // ❌ VULNERABLE
  });

  throw new Error(`Failed: ${JSON.stringify(args)}`);
  // ❌ Password in error message
}

// Sentry error:
// Error: Failed: {"databaseId":"mysql-invalid","password":"TenantA-Secret-2025"}
// Stack trace context includes args
// → All developers see password in Sentry dashboard
```

**Impact**: Tenant A's password visible to all developers with Sentry access.

#### With This Standard ✅

```typescript
// Tenant A's database creation fails
try {
  await createDatabaseUser({
    databaseId: 'mysql-invalid',
    password: 'TenantA-Secret-2025'
  });
} catch (error) {
  // Build safe error context
  const safeArgs = buildUpdatedAttributes({
    databaseId: 'mysql-invalid',
    password: 'TenantA-Secret-2025'
  });

  logger.error('User creation failed', {
    error: error.message,
    args: safeArgs  // ✅ { databaseId: "...", passwordChanged: true }
  });

  throw new Error(`Failed: ${JSON.stringify(safeArgs)}`);
  // ✅ Password NOT in error message
}

// Sentry error:
// Error: Failed: {"databaseId":"mysql-invalid","passwordChanged":true}
// Stack trace context has NO password
// → Developers see error without credential disclosure
```

**Impact**: No credential disclosure in error tracking.

---

## Security Utilities Reference

### `credential-generator.ts`

```typescript
import { generateSecurePassword, generateSecureToken } from './utils/credential-generator.js';

// Password (24 chars, base64url)
const pwd = generateSecurePassword({ length: 24 });
console.log(pwd.value);     // "dGhpc2lzYXNlY3VyZXBhc3N3b3Jk"
console.log(pwd.generated); // true
console.log(pwd.length);    // 24

// Token (64 chars, hex)
const token = generateSecureToken(64);
console.log(token.value);   // "3a5f7b2c9e..."
console.log(token.encoding); // "hex"
```

### `credential-redactor.ts`

```typescript
import {
  redactCredentialsFromCommand,
  redactMetadata
} from './utils/credential-redactor.js';

// Redact command
const safe = redactCredentialsFromCommand({
  command: 'mw user create --password secret --token abc123'
});
console.log(safe);
// "mw user create --password [REDACTED] --token [REDACTED]"

// Redact metadata object
const meta = redactMetadata({
  command: 'mw user create --password secret',
  durationMs: 234
});
console.log(meta.command);
// "mw user create --password [REDACTED]"
```

### `credential-response.ts`

```typescript
import {
  buildUpdatedAttributes,
  buildSecureToolResponse
} from './utils/credential-response.js';

// Sanitize attributes
const attrs = buildUpdatedAttributes({
  description: 'User',
  password: 'secret',
  accessLevel: 'full'
});
console.log(attrs);
// { description: "User", passwordChanged: true, accessLevel: "full" }

// Build secure response
const response = buildSecureToolResponse('success', 'User created', {
  userId: 'u-123',
  password: 'secret'
}, {
  command: 'mw user create --password secret',
  durationMs: 234
});
console.log(response.data);
// { userId: "u-123", passwordChanged: true }
console.log(response.meta.command);
// "mw user create --password [REDACTED]"
```

---

## Implementation Requirements

### Required Practices (Quick Reference)

#### 1. Generate Credentials Securely

**DO** ✅
```typescript
import { generateSecurePassword } from '../../utils/credential-generator.js';

const password = args.password ?? generateSecurePassword({ length: 24 }).value;
```

**DON'T** ❌
```typescript
const password = Math.random().toString(36);  // ❌ Not cryptographically secure
const password = 'password123';               // ❌ Hardcoded default
```

#### 2. Redact Credentials from Metadata

**DO** ✅
```typescript
import { buildSecureToolResponse } from '../../utils/credential-response.js';

return buildSecureToolResponse('success', message, data, {
  command: result.meta.command,  // ✅ Auto-redacted
  durationMs: result.meta.durationMs
});
```

**DON'T** ❌
```typescript
return formatToolResponse('success', message, data, {
  command: `mw user create --password ${password}`  // ❌ Leaks password
});
```

#### 3. Never Return Credential Values

**DO** ✅
```typescript
import { buildUpdatedAttributes } from '../../utils/credential-response.js';

const responseData = {
  userId: 'u-123',
  updatedAttributes: buildUpdatedAttributes(args)
};
```

**DON'T** ❌
```typescript
const responseData = {
  userId: 'u-123',
  password: args.password  // ❌ Password exposed in response
};
```

#### 4. Return Generated Credentials Only Once

```typescript
const passwordGenerated = !args.password;
const password = args.password ?? generateSecurePassword().value;

return buildSecureToolResponse('success', message, {
  userId,
  password: passwordGenerated ? password : undefined,  // ✅ Only if generated here
  passwordGenerated
});
```

#### 5. Validate Tests Check for Leakage

```typescript
it('sanitizes password in meta command', async () => {
  const response = await handleTool({ password: 'super-secret' });
  const payload = JSON.parse(response.content[0]?.text ?? '{}');

  expect(payload.meta.command).not.toContain('super-secret');
  expect(payload.meta.command).toContain('[REDACTED]');
  expect(payload.data.password).toBeUndefined();
});
```

### Mandatory for All Credential-Handling Tools

**A tool handles credentials if it**:
- Creates/updates passwords (database, mail, SFTP)
- Generates/manages API tokens
- Imports/creates SSH keys
- Handles secrets or encryption keys
- Takes password/token parameters

### Implementation Checklist

- [ ] **Use `generateSecurePassword()`** for password generation
  - ✅ Minimum 24 characters for passwords
  - ✅ Minimum 64 characters for API tokens
  - ✅ Never use `Math.random()` or hardcoded defaults

- [ ] **Use `buildSecureToolResponse()`** for responses with metadata
  - ✅ Auto-redacts `command` in metadata
  - ✅ Auto-converts credential fields to boolean flags
  - ✅ Prevents accidental credential leakage

- [ ] **Use `buildUpdatedAttributes()`** for update operations
  - ✅ Converts `password` → `passwordChanged: boolean`
  - ✅ Converts `token` → `tokenChanged: boolean`
  - ✅ Preserves non-credential fields

- [ ] **Never store credential values in sessions**
  - ❌ Do not add `password`, `token`, `apiKey` to session data
  - ✅ Only store flags like `passwordChanged: true`

- [ ] **Only return generated credentials once**
  - ✅ Return password if `passwordGenerated === true`
  - ❌ Never echo back user-provided passwords
  - ✅ Include `passwordGenerated` flag in response

- [ ] **Add tests validating credential redaction**
  - ✅ Test password not in `meta.command`
  - ✅ Test password not in `data` (only flag)
  - ✅ Test generated password returned once

- [ ] **Document which fields contain sensitive data**
  - ✅ Add JSDoc comments marking credential parameters
  - ✅ Update tool schema descriptions

### Code Example: Complete Implementation

```typescript
import { generateSecurePassword } from '../../utils/credential-generator.js';
import { buildSecureToolResponse } from '../../utils/credential-response.js';
import { invokeCliTool, CliToolError } from '../../tools/index.js';
import type { MittwaldCliToolHandler } from '../../types/mittwald/conversation.js';

interface CreateMailAddressArgs {
  projectId: string;
  address: string;
  /**
   * Mailbox password. If not provided, a secure password will be generated.
   * @security SENSITIVE - Do not log or store this value
   */
  password?: string;
}

export const handleMailAddressCreate: MittwaldCliToolHandler<CreateMailAddressArgs> = async (
  args,
  sessionId
) => {
  // ✅ Layer 1: Generate secure password if not provided
  const passwordGenerated = !args.password;
  const password = args.password ?? generateSecurePassword({ length: 32 }).value;

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_mail_address_create',
      argv: [
        'mail', 'address', 'create',
        '--project-id', args.projectId,
        '--address', args.address,
        '--password', password
      ],
      sessionId,
      parser: (stdout) => ({ addressId: stdout.trim() })
    });

    // ✅ Layer 3: Build secure response
    // - Auto-redacts command metadata
    // - Only returns password if generated
    // - Converts password to flag if user-provided
    return buildSecureToolResponse('success', 'Mail address created', {
      addressId: result.result.addressId,
      address: args.address,
      password: passwordGenerated ? password : undefined,  // ✅ Only if generated
      passwordGenerated
    }, {
      command: result.meta.command,  // ✅ Auto-redacted: --password [REDACTED]
      durationMs: result.meta.durationMs
    });

  } catch (error) {
    if (error instanceof CliToolError) {
      // ✅ Layer 2: Error context is safe (no password in args)
      return buildSecureToolResponse('error', 'Failed to create mail address', {
        exitCode: error.exitCode,
        stderr: error.stderr
      });
    }
    throw error;
  }
};
```

---

## Automated Enforcement

### ESLint Rule: `no-credential-leak`

**File**: `eslint-rules/no-credential-leak.js`

```javascript
/**
 * ESLint rule: no-credential-leak
 *
 * Detects potential credential leakage in code:
 * - Direct password/token values in responses
 * - Unredacted command metadata
 * - Hardcoded credentials
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent credential leakage in responses and logs',
      category: 'Security',
      recommended: true
    },
    messages: {
      directCredential: 'Do not include {{ field }} directly in response data. Use {{ field }}Changed: boolean instead.',
      unredactedCommand: 'Command metadata must be redacted. Use buildSecureToolResponse() or redactMetadata().',
      hardcodedCredential: 'Do not hardcode credential values. Use generateSecurePassword().'
    }
  },
  create(context) {
    return {
      // Detect: { password: args.password } in response objects
      ObjectExpression(node) {
        node.properties.forEach(prop => {
          if (prop.key?.name === 'password' ||
              prop.key?.name === 'token' ||
              prop.key?.name === 'apiKey' ||
              prop.key?.name === 'secret') {
            context.report({
              node: prop,
              messageId: 'directCredential',
              data: { field: prop.key.name }
            });
          }
        });
      },

      // Detect: command: result.meta.command (without redaction)
      Property(node) {
        if (node.key?.name === 'command' &&
            node.value?.type === 'MemberExpression' &&
            !context.getAncestors().some(n =>
              n.callee?.name === 'redactMetadata' ||
              n.callee?.name === 'buildSecureToolResponse'
            )) {
          context.report({
            node,
            messageId: 'unredactedCommand'
          });
        }
      },

      // Detect: const password = "hardcoded-value"
      VariableDeclarator(node) {
        if ((node.id?.name === 'password' ||
             node.id?.name === 'token' ||
             node.id?.name === 'apiKey') &&
            node.init?.type === 'Literal' &&
            typeof node.init.value === 'string') {
          context.report({
            node,
            messageId: 'hardcodedCredential'
          });
        }
      }
    };
  }
};
```

**Enable in `.eslintrc.js`**:

```javascript
module.exports = {
  rules: {
    'local/no-credential-leak': 'error'
  }
};
```

---

### CI Security Check

**File**: `.github/workflows/security-check.yml`

```yaml
name: Security Checks

on:
  pull_request:
    paths:
      - 'src/handlers/**'
      - 'src/utils/**'
  push:
    branches:
      - main

jobs:
  credential-leakage:
    name: Check for Credential Leakage
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run security test suite
        run: npm run test:security

      - name: Check for hardcoded credentials
        run: |
          if git grep -E "(password|token|api-key)\s*=\s*['\"][^'\"]+['\"]" src/; then
            echo "❌ Found hardcoded credentials in source code"
            exit 1
          fi
          echo "✅ No hardcoded credentials detected"

      - name: Lint for credential leaks
        run: npm run lint -- --rule local/no-credential-leak

      - name: Check session storage
        run: |
          if git grep -E "password:|token:|apiKey:" src/server/session-manager.ts; then
            echo "❌ Found credential storage in session manager"
            exit 1
          fi
          echo "✅ No credential values stored in sessions"
```

---

### Security Test Suite

**File**: `tests/security/credential-leakage.test.ts`

```typescript
import { describe, expect, it } from 'vitest';
import { redactCredentialsFromCommand } from '../../src/utils/credential-redactor.js';
import { buildUpdatedAttributes } from '../../src/utils/credential-response.js';
import { generateSecurePassword } from '../../src/utils/credential-generator.js';

describe('Credential Security Validation', () => {
  describe('Password Generation', () => {
    it('generates cryptographically secure passwords', () => {
      const pwd1 = generateSecurePassword({ length: 24 });
      const pwd2 = generateSecurePassword({ length: 24 });

      expect(pwd1.value).toHaveLength(24);
      expect(pwd2.value).toHaveLength(24);
      expect(pwd1.value).not.toBe(pwd2.value);  // Uniqueness
      expect(pwd1.generated).toBe(true);
    });

    it('enforces minimum length', () => {
      const pwd = generateSecurePassword({ length: 8, minLength: 12 });
      expect(pwd.value.length).toBeGreaterThanOrEqual(12);
    });
  });

  describe('Command Redaction', () => {
    it('redacts --password flags', () => {
      const cmd = 'mw user create --password secret123';
      const safe = redactCredentialsFromCommand({ command: cmd });

      expect(safe).toBe('mw user create --password [REDACTED]');
      expect(safe).not.toContain('secret123');
    });

    it('redacts multiple credentials in one command', () => {
      const cmd = 'mw user create --password pw123 --token tk456';
      const safe = redactCredentialsFromCommand({ command: cmd });

      expect(safe).not.toContain('pw123');
      expect(safe).not.toContain('tk456');
      expect(safe).toContain('[REDACTED]');
    });

    it('redacts password= query parameters', () => {
      const cmd = 'curl "https://api.example.com?password=secret"';
      const safe = redactCredentialsFromCommand({ command: cmd });

      expect(safe).toContain('password=[REDACTED]');
      expect(safe).not.toContain('secret');
    });
  });

  describe('Response Sanitization', () => {
    it('converts password to passwordChanged flag', () => {
      const attrs = buildUpdatedAttributes({
        password: 'secret',
        description: 'User'
      });

      expect(attrs.password).toBeUndefined();
      expect(attrs.passwordChanged).toBe(true);
      expect(attrs.description).toBe('User');
    });

    it('converts token to tokenChanged flag', () => {
      const attrs = buildUpdatedAttributes({
        token: 'abc123',
        name: 'API'
      });

      expect(attrs.token).toBeUndefined();
      expect(attrs.tokenChanged).toBe(true);
    });

    it('preserves non-credential fields', () => {
      const attrs = buildUpdatedAttributes({
        description: 'Test',
        accessLevel: 'full',
        password: 'secret'
      });

      expect(attrs.description).toBe('Test');
      expect(attrs.accessLevel).toBe('full');
      expect(attrs.passwordChanged).toBe(true);
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('generates unique passwords for different tenants', () => {
      const passwords = new Set<string>();

      for (let i = 0; i < 1000; i++) {
        const pwd = generateSecurePassword({ length: 24 });
        passwords.add(pwd.value);
      }

      // All 1000 passwords should be unique
      expect(passwords.size).toBe(1000);
    });

    it('redacts credentials uniformly across tenants', () => {
      const tenantACmd = 'mw user create --password TenantA-Secret';
      const tenantBCmd = 'mw user create --password TenantB-Secret';

      const safeA = redactCredentialsFromCommand({ command: tenantACmd });
      const safeB = redactCredentialsFromCommand({ command: tenantBCmd });

      // Both should have identical redaction pattern
      expect(safeA).toBe(safeB);
      expect(safeA).toBe('mw user create --password [REDACTED]');
    });
  });
});
```

**Add to `package.json`**:

```json
{
  "scripts": {
    "test:security": "vitest run tests/security"
  }
}
```

---

## Migration Guide for Existing Tools

See [docs/migrations/credential-security-migration-2025-10.md](./migrations/credential-security-migration-2025-10.md) for detailed migration instructions for existing tools that handle credentials.

**Quick Summary**:

1. **Identify tools**: `git grep -l "password\|token\|api-key" src/handlers/`
2. **Update password generation**: Replace `Math.random()` with `generateSecurePassword()`
3. **Update response building**: Replace `formatToolResponse()` with `buildSecureToolResponse()`
4. **Update tests**: Add credential leakage validation
5. **Verify**: Run `npm run test:security`

---

## Compliance and Audit Considerations

### GDPR Compliance

| Requirement | How This Standard Helps |
|-------------|------------------------|
| **Right to erasure** | Credentials not stored in sessions → nothing to erase beyond OAuth tokens |
| **Data minimization** | Only boolean flags stored, not actual credential values |
| **Security of processing** | Cryptographic generation, redaction, sanitization |
| **Data breach notification** | Log/backup exposure does not leak credentials → reduced breach scope |

### SOC 2 Type II Compliance

| Control | Implementation |
|---------|----------------|
| **CC6.1 - Logical access** | Credential redaction prevents unauthorized disclosure via logs |
| **CC6.6 - Encryption** | Cryptographic password generation (144 bits entropy) |
| **CC6.7 - Transmission** | Credentials only transmitted once (generation response) |
| **CC7.2 - System monitoring** | Safe logging (redacted commands) enables monitoring without risk |

### Audit Evidence

**What auditors can verify**:

1. **Automated prevention**: ESLint rule + CI checks prevent credential leakage
2. **Test coverage**: Security test suite validates all three layers
3. **Code review**: Pull requests blocked by CI if leakage detected
4. **Session storage**: Redis backups contain no credential values
5. **Log aggregation**: CloudWatch/Datadog logs show `[REDACTED]` uniformly

**Audit-friendly log examples**:

```
✅ PASS: "mw database mysql user create --password [REDACTED]"
✅ PASS: { passwordChanged: true, accessLevel: "full" }
✅ PASS: Session data: { mittwaldAccessToken: "...", scope: "..." }

❌ FAIL: "mw database mysql user create --password secret123"
❌ FAIL: { password: "secret123", accessLevel: "full" }
❌ FAIL: Session data: { password: "secret123" }
```

---

## References

### Internal Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - OAuth 2.1 bridge and session management
- [LLM_CONTEXT.md](./LLM_CONTEXT.md) - Complete project overview
- [docs/agent-prompts/STANDARD-S1-credential-security.md](./agent-prompts/STANDARD-S1-credential-security.md) - Agent implementation guide
- [docs/agent-reviews/AGENT-C3-REVIEW.md](./agent-reviews/AGENT-C3-REVIEW.md) - Original security pattern review

### External Standards

- [OAuth 2.1 Specification](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-07)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [NIST SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html) - Digital Identity Guidelines

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-02 | Initial standard based on Agent C3 implementation |

---

## Contact

**Questions or Security Concerns**:
- Open issue with label: `security` + `credential-leak`
- Do NOT commit credentials to report them
- Rotate affected credentials immediately if discovered

---

**This standard is REQUIRED for all tools that handle passwords, tokens, API keys, or secrets. No exceptions.**
