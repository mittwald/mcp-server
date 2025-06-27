# Agent 1 - User & Auth APIs Findings

## API Method Mappings

### Authentication Methods
- `client.api.user.authenticate()` → `client.typedApi.user.authenticate()`
- `client.api.user.authenticateMfa()` → `client.typedApi.user.authenticateMfa()`
  - Note: MFA now requires email and password in addition to multiFactorCode
- `client.api.user.authenticateWithSessionToken()` → **DOES NOT EXIST**
  - Using `client.typedApi.user.refreshSession()` as alternative
- `client.api.user.authenticateWithTokenRetrievalKey()` → `client.typedApi.user.authenticateWithAccessTokenRetrievalKey()`
  - Note: Now requires userId parameter

### User Information Methods
- `client.api.user.getSelf()` → **DOES NOT EXIST**
  - Need to use `client.typedApi.user.getUser({ userId })` with userId from checkToken
- `client.api.user.getOwnEmail()` → `client.typedApi.user.getOwnEmail()`
- `client.api.user.getUser()` → `client.typedApi.user.getUser()`

### Email Methods
- `client.api.user.changeEmail()` → `client.typedApi.user.changeEmail()`
  - Note: Password not required in data payload anymore
- `client.api.user.verifyEmail()` → `client.typedApi.user.verifyEmail()`
  - Note: Now requires email parameter in addition to token
- `client.api.user.resendEmailVerification()` → **DOES NOT EXIST**

### Password Methods
- `client.api.user.changePassword()` → `client.typedApi.user.changePassword()`
- `client.api.user.getPasswordUpdatedAt()` → `client.typedApi.user.getPasswordUpdatedAt()`
- `client.api.user.initPasswordReset()` → `client.typedApi.user.initPasswordReset()`
- `client.api.user.confirmPasswordReset()` → `client.typedApi.user.confirmPasswordReset()`
  - Note: May require userId parameter

### Profile Methods
- `client.api.user.updateUser()` → **DOES NOT EXIST**
  - May need to use `client.typedApi.user.updateAccount()`
- `client.api.user.getPersonalInformation()` → **DOES NOT EXIST**
  - May need different approach
- `client.api.user.updatePersonalInformation()` → `client.typedApi.user.updatePersonalInformation()`
  - Note: Requires wrapping data in `person` object
- `client.api.user.deleteSelf()` → `client.typedApi.user.deleteUser({ userId })`
  - Note: Requires userId parameter

### Session Methods
- `client.api.user.listSessions()` → `client.typedApi.user.listSessions()`
- `client.api.user.getSession()` → `client.typedApi.user.getSession()`
- `client.api.user.refreshSessions()` → **DOES NOT EXIST**
  - Only `client.typedApi.user.refreshSession()` for individual sessions
- `client.api.user.terminateSession()` → `client.typedApi.user.terminateSession()`

### API Token Methods
- `client.api.user.listApiTokens()` → `client.typedApi.user.listApiTokens()`
- `client.api.user.getApiToken()` → `client.typedApi.user.getApiToken()`
- `client.api.user.createApiToken()` → `client.typedApi.user.createApiToken()`
- `client.api.user.updateApiToken()` → `client.typedApi.user.editApiToken()`
- `client.api.user.deleteApiToken()` → `client.typedApi.user.deleteApiToken()`

### Other Methods in unified-handler.ts
- `client.api.user.listSshKeys()` → `client.typedApi.user.listSshKeys()`
- `client.api.user.createSshKey()` → `client.typedApi.user.createSshKey()`
- `client.api.user.deleteSshKey()` → `client.typedApi.user.deleteSshKey()`
- `client.api.user.getMfaStatus()` → `client.typedApi.user.getMfaStatus()`
- `client.api.user.initMfa()` → `client.typedApi.user.initMfa()`
- `client.api.user.createFeedback()` → `client.typedApi.user.createFeedback()`
- `client.api.user.getSupportCode()` → **DOES NOT EXIST**
- `client.api.user.addPhone()` → `client.typedApi.user.addPhoneNumber()`
- `client.api.user.verifyPhone()` → `client.typedApi.user.verifyPhoneNumber()`
  - Note: Parameter name changed from `verificationCode` to `code`

## Common Patterns

1. **Status Code Checks**: Changed from `response.status === 200` to `String(response.status).startsWith('2')` to handle multiple success codes
2. **Response Properties**: 
   - `response.data.expiresAt` → `response.data.expires`
   - Authentication responses don't include `authenticationToken` for MFA
3. **Missing Methods**: Several methods don't exist in the typed API and require workarounds or removal
4. **Type Casting**: Some responses need `as any` casting due to type mismatches

## Remaining Issues

Several methods that existed in the untyped API don't have direct equivalents in the typed API, requiring either workarounds or feature removal.

## Important Note for Coordinator

**While I fixed all compilation errors in the User & Auth modules, there are architectural decisions needed:**

1. **Missing Methods**: Several methods don't exist in the typed API:
   - `authenticateWithSessionToken` - currently using `refreshSession` as workaround
   - `getSelf` - requires userId from checkToken first
   - `resendEmailVerification` - no equivalent, currently throws error
   - `updateUser` - may need to use `updateAccount` instead
   - `getPersonalInformation` - no direct equivalent
   - `getSupportCode` - doesn't exist

2. **Type Mismatches**: Some responses had to be cast to `any` due to type incompatibilities between expected and actual response structures.

3. **Parameter Changes**: Several methods now require additional parameters (e.g., userId, email) that weren't needed before.

**These issues may require team discussion on whether to:**
- Remove features that aren't supported
- Find alternative implementations
- Request updates to the SDK
- Create compatibility wrappers