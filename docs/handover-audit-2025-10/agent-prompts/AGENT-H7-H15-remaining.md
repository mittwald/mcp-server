# Agents H7-H15: Remaining Audit Prompts

This document contains the remaining audit agent specifications (H7-H15). Each agent should produce a comprehensive report following the standard format outlined in AUDIT-SCOPE.md.

---

## Agent H7: Dependency Audit

**Agent ID**: H7-Dependency-Audit
**Priority**: High
**Duration**: 1-2 hours

### Mission
Audit all npm dependencies for security, licenses, usage, and optimization opportunities.

### Key Tasks
1. **Unused Dependencies**:
   ```bash
   npx depcheck
   npm list --all | grep -E "UNMET|extraneous"
   ```

2. **Outdated Dependencies**:
   ```bash
   npm outdated
   npm audit
   ```

3. **Duplicate Dependencies**:
   ```bash
   npm ls <package-name> # Find duplicates
   ```

4. **License Scan** (covered by H3, cross-reference)

5. **Security Vulnerabilities** (covered by H2, cross-reference)

6. **Package Size Analysis**:
   ```bash
   npm ls --prod --depth=0
   # Identify large dependencies
   ```

### Deliverables
- Unused dependencies list with safe-to-remove categorization
- Outdated dependencies with update risk assessment
- Duplicate dependency resolution plan
- Package optimization recommendations
- Production vs dev dependency verification

**Output**: `AUDIT-H7-DEPENDENCY-REPORT.md`

---

## Agent H8: Build & Deployment Readiness

**Agent ID**: H8-Build-Deployment
**Priority**: Critical
**Duration**: 2-3 hours

### Mission
Verify build configuration, Docker setup, environment management, and deployment readiness for production handover.

### Key Tasks

1. **Build Configuration**:
   ```bash
   npm run build
   # Verify successful build
   # Check build output in build/
   ```

2. **TypeScript Configuration**:
   - tsconfig.json completeness
   - tsc-alias configuration
   - Type checking passes: `npm run type-check`

3. **Docker Configuration**:
   - Review Dockerfile, stdio.Dockerfile, openapi.Dockerfile
   - Review docker-compose.yml, docker-compose.prod.yml
   - Multi-stage builds
   - Security best practices (non-root user, minimal base image)
   - Build caching
   - Health checks defined

4. **Environment Variables**:
   - Compare .env.example vs actual usage in code
   - All required env vars documented
   - No defaults for secrets
   - Validation on startup

5. **Production Readiness**:
   - Graceful shutdown (SIGTERM handling)
   - Health check endpoints (/health, /ready)
   - Logging configuration (structured, levels)
   - Error handling completeness

6. **Deployment Scripts**:
   - Review scripts/ directory
   - Deployment automation
   - Database migration scripts (if any)
   - Rollback procedures

### Deliverables
- Build configuration assessment
- Docker security and optimization report
- Environment variable completeness checklist
- Production readiness score
- Deployment checklist

**Output**: `AUDIT-H8-BUILD-DEPLOYMENT-REPORT.md`

---

## Agent H9: API Contract Stability

**Agent ID**: H9-API-Contract
**Priority**: High
**Duration**: 1-2 hours

### Mission
Assess MCP tool API stability, versioning strategy, and breaking change risks for production deployment.

### Key Tasks

1. **MCP Tool Schema Stability**:
   ```bash
   find src/constants/tool -name "*.ts" | xargs grep "inputSchema"
   ```
   - Review all tool input schemas
   - Check for optional vs required parameters
   - Verify schema consistency

2. **OAuth API Stability**:
   - Endpoints: /authorize, /token, /callback, /logout
   - Request/response formats
   - Error responses standardized

3. **Breaking Changes**:
   - Git history review for API changes
   - Schema evolution tracking
   - Backward compatibility assessment

4. **Versioning Strategy**:
   - Is there an API version?
   - How are breaking changes handled?
   - Migration path for clients

5. **Response Format Consistency**:
   ```bash
   grep -r "formatToolResponse" src/handlers/
   ```
   - All handlers use standard format
   - Error responses consistent
   - Success responses consistent

6. **Documentation Accuracy**:
   - Do tool examples match actual schemas?
   - Are parameter types documented correctly?

### Deliverables
- API stability assessment
- Breaking change inventory
- Versioning recommendation
- Schema consistency report
- Documentation accuracy verification

**Output**: `AUDIT-H9-API-CONTRACT-REPORT.md`

---

## Agent H10: Performance & Scalability

**Agent ID**: H10-Performance
**Priority**: Medium
**Duration**: 2-3 hours

### Mission
Identify performance bottlenecks, assess scalability, and recommend optimizations for production load.

### Key Tasks

1. **Code Performance**:
   - Synchronous operations in async handlers
   - N+1 query patterns
   - Unnecessary loops
   - Memory leak risks

2. **Redis Usage**:
   ```bash
   grep -r "redis\|ioredis" src/ packages/
   ```
   - Connection pooling
   - Pipeline usage for bulk operations
   - Key expiration strategies
   - Session cleanup

3. **Logging Performance**:
   - Excessive logging in hot paths
   - Log levels appropriate
   - Structured logging efficiency

4. **Concurrent Request Handling**:
   - Express/Koa async handler patterns
   - Race condition risks
   - Mutex usage where needed

5. **CLI Execution**:
   - Sequential vs parallel opportunities
   - Timeout handling
   - Resource cleanup

6. **Scalability Concerns**:
   - Stateless design (scales horizontally?)
   - Shared state issues
   - Database connection limits
   - Redis connection limits

### Deliverables
- Performance bottleneck inventory
- Scalability assessment
- Optimization recommendations (prioritized)
- Load testing recommendations
- Resource limit guidance

**Output**: `AUDIT-H10-PERFORMANCE-REPORT.md`

---

## Agent H11: Error Handling & Resilience

**Agent ID**: H11-Error-Handling
**Priority**: High
**Duration**: 1-2 hours

### Mission
Audit error handling completeness, resilience patterns, and failure recovery mechanisms.

### Key Tasks

1. **Error Handling Coverage**:
   ```bash
   grep -r "try.*catch" src/ | wc -l
   grep -r "throw" src/ | wc -l
   grep -r "reject" src/ | wc -l
   ```
   - All async operations wrapped
   - Errors properly caught and handled
   - No silent failures

2. **Error Types**:
   - Network errors
   - API errors (Mittwald API)
   - Validation errors
   - Authentication errors
   - Database errors (Redis)

3. **Resilience Patterns**:
   - Retry logic (where appropriate)
   - Circuit breaker (if needed)
   - Timeout configuration
   - Graceful degradation

4. **Error Logging**:
   ```bash
   grep -r "logger.error" src/
   ```
   - All errors logged with context
   - Stack traces included
   - User ID, session ID logged
   - No PII in logs

5. **User-Facing Errors**:
   - Error messages clear and actionable
   - No internal details exposed
   - Consistent error format

6. **Recovery Mechanisms**:
   - Token refresh on 401
   - Retry on transient failures
   - Session recovery
   - Connection pool recovery

### Deliverables
- Error handling coverage report
- Missing error handling (critical paths)
- Resilience gap analysis
- Error message audit
- Recovery mechanism verification

**Output**: `AUDIT-H11-ERROR-HANDLING-REPORT.md`

---

## Agent H12: Configuration Management

**Agent ID**: H12-Configuration
**Priority**: High
**Duration**: 1-2 hours

### Mission
Audit environment variable usage, configuration file organization, secrets management, and multi-environment support.

### Key Tasks

1. **Environment Variables**:
   ```bash
   grep -r "process.env" src/ packages/
   cat .env.example
   ```
   - All env vars in .env.example
   - Descriptions provided
   - Required vs optional clear
   - Default values appropriate

2. **Secrets Management**:
   - No hardcoded secrets
   - JWT_SECRET from env
   - API keys from env
   - Database credentials from env

3. **Configuration Validation**:
   ```bash
   grep -r "process.env" src/index.ts src/server/
   ```
   - Startup validation of required env vars
   - Type checking (Zod or similar)
   - Fail fast if misconfigured

4. **Config File Organization**:
   ```bash
   ls -la config/
   ```
   - mittwald-scopes.json reviewed
   - mw-cli-exclusions.json reviewed
   - Schema files validated

5. **Multi-Environment Support**:
   - Development config
   - Production config
   - Test config
   - Clear separation

6. **Configuration Documentation**:
   - All env vars documented
   - Example values provided
   - Security notes included

### Deliverables
- Environment variable completeness report
- Secrets exposure risks
- Configuration validation assessment
- Multi-environment support verification
- Documentation completeness

**Output**: `AUDIT-H12-CONFIGURATION-REPORT.md`

---

## Agent H13: OAuth Bridge Specific Audit

**Agent ID**: H13-OAuth-Bridge
**Priority**: Critical
**Duration**: 2-3 hours

### Mission
Deep dive audit of OAuth 2.1 + PKCE implementation in packages/oauth-bridge/ for security, correctness, and production readiness.

### Key Tasks

1. **OAuth 2.1 Compliance**:
   - PKCE (RFC 7636) compliance
   - State parameter (CSRF protection)
   - Redirect URI validation
   - Authorization code flow correctness

2. **PKCE Verification**:
   ```bash
   grep -r "code_challenge\|code_verifier" packages/oauth-bridge/
   ```
   - code_challenge = base64url(sha256(code_verifier))
   - code_challenge_method = "S256"
   - code_verifier length (43-128 chars)
   - Storage and verification correct

3. **JWT Security**:
   ```bash
   grep -r "jwt.sign\|jwt.verify" packages/oauth-bridge/
   ```
   - Algorithm: HS256 only
   - Secret from env
   - Expiration set (8 hours)
   - Signature verification before trust
   - Payload contains embedded Mittwald tokens

4. **Session Management**:
   - Redis connection handling
   - 8-hour TTL enforcement
   - Automatic token refresh
   - Session cleanup on logout
   - Concurrent session handling

5. **Token Refresh**:
   - Refresh token flow implemented
   - Refresh before expiration
   - Error handling if refresh fails
   - Token rotation

6. **Error Handling in OAuth Flows**:
   - Invalid authorization code
   - Expired state parameter
   - CSRF attack prevention
   - Invalid redirect URI
   - Mittwald API errors

7. **Security Headers**:
   - Helmet configuration
   - CORS configuration
   - Cookie security (httpOnly, secure, sameSite)

### Deliverables
- OAuth 2.1 compliance report
- PKCE implementation verification
- JWT security assessment
- Session management audit
- Error handling completeness
- Security posture score

**Output**: `AUDIT-H13-OAUTH-BRIDGE-REPORT.md`

---

## Agent H14: MCP Server Specific Audit

**Agent ID**: H14-MCP-Server
**Priority**: High
**Duration**: 2-3 hours

### Mission
Audit MCP protocol implementation, tool registration, handler consistency, and integration quality.

### Key Tasks

1. **MCP Protocol Compliance**:
   - Tool registration format
   - Request/response format
   - Error format
   - Compliance with @modelcontextprotocol/sdk

2. **Tool Registration**:
   ```bash
   grep -r "registerTool\|tools.list" src/
   ```
   - All 175 tools registered
   - Tool metadata complete (name, description, inputSchema)
   - Schema validation works

3. **Tool Handler Consistency**:
   - All use cli-adapter pattern (0 cli-wrapper imports)
   - All use formatToolResponse
   - All use sessionContext for auth
   - Consistent error handling

4. **CLI Adapter Pattern**:
   ```bash
   grep -r "invokeCliTool" src/handlers/
   grep -r "cli-wrapper" src/ # Should be 0
   ```
   - Pattern used consistently
   - Command preparation for interactive commands
   - Proper error handling

5. **Session Management**:
   - SessionContext used everywhere
   - Token validation
   - Session expiration handling
   - User/project context resolution

6. **Logging & Audit Trail**:
   - All operations logged
   - SessionId and userId in logs
   - Destructive operations have audit trail
   - Log levels appropriate

7. **Integration with OAuth Bridge**:
   - JWT validation
   - Token refresh handling
   - Session coordination

### Deliverables
- MCP protocol compliance assessment
- Tool registration completeness (175/175)
- Handler consistency report
- CLI adapter pattern verification (0 cli-wrapper imports)
- Session management audit
- Logging completeness

**Output**: `AUDIT-H14-MCP-SERVER-REPORT.md`

---

## Agent H15: Git History & Repository Quality

**Agent ID**: H15-Git-History
**Priority**: Medium
**Duration**: 1-2 hours

### Mission
Audit git repository quality, commit messages, sensitive data exposure, and repository hygiene.

### Key Tasks

1. **Commit Message Quality**:
   ```bash
   git log --oneline | head -50
   ```
   - Conventional commits format?
   - Descriptive messages
   - Reference issues/PRs

2. **Sensitive Data in History**:
   ```bash
   git log -p | grep -E "password|secret|api.?key|token" -i
   git log --all --full-history -- .env
   ```
   - No credentials committed
   - No .env in history
   - No API keys

3. **Branch Strategy**:
   ```bash
   git branch -a
   ```
   - Clean branch structure
   - No orphaned branches
   - Main branch clear

4. **Tag Usage**:
   ```bash
   git tag
   ```
   - Releases tagged?
   - Version tagging strategy

5. **Large Files in History**:
   ```bash
   git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | awk '/^blob/ {print substr($0,6)}' | sort -n -k 2 | tail -20
   ```
   - Files > 1MB in history
   - Should they be in repo?

6. **Repository Size**:
   ```bash
   du -sh .git
   ```
   - Size reasonable?
   - Cleanup needed?

7. **Commit Granularity**:
   - Too many tiny commits?
   - Monolithic commits?
   - Good logical separation?

8. **Git Hygiene**:
   - .gitignore comprehensive
   - .gitattributes if needed
   - No committed build artifacts

### Deliverables
- Commit quality assessment
- Sensitive data exposure report (CRITICAL if found)
- Repository size and cleanup recommendations
- Branch and tag strategy verification
- Git hygiene score

**Output**: `AUDIT-H15-GIT-HISTORY-REPORT.md`

---

## Standard Output Format (All Agents H7-H15)

Each agent must produce:

1. **Executive Summary** (2-3 paragraphs)
2. **Methodology** (how audit conducted)
3. **Findings** (categorized by severity: Critical, High, Medium, Low)
4. **Specific Issues** (with file:line references)
5. **Recommendations** (actionable, prioritized)
6. **Metrics** (quantified findings)
7. **References** (git commits, docs, standards)

---

## Success Criteria (All Agents)

- ✅ Comprehensive audit completed
- ✅ All findings documented with specific references
- ✅ Issues categorized by severity and impact
- ✅ Actionable recommendations provided
- ✅ Metrics quantified
- ✅ Production-blocking issues clearly identified

---

**Status**: Ready for execution
**Dependencies**: Can run in parallel
