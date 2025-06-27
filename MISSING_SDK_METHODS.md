# Missing SDK Methods Documentation

Based on the migration work by all agents, the following SDK methods are missing or have changed in the Mittwald SDK v4.169.0:

## User API - Missing Methods

### Authentication
- `authenticateWithSessionToken()` - **DOES NOT EXIST**
  - Workaround: Using `refreshSession()` as alternative
  - Impact: Session token authentication feature compromised

### User Information
- `getSelf()` - **DOES NOT EXIST**
  - Workaround: Use `getUser({ userId })` with userId from `checkToken()`
  - Impact: Requires additional API call to get current user

### Email
- `resendEmailVerification()` - **DOES NOT EXIST**
  - Workaround: None - feature must be removed
  - Impact: Users cannot resend verification emails

### Profile
- `updateUser()` - **DOES NOT EXIST**
  - Workaround: May use `updateAccount()` but different structure
  - Impact: User profile update functionality limited
  
- `getPersonalInformation()` - **DOES NOT EXIST**
  - Workaround: None identified
  - Impact: Cannot retrieve personal information

### Support
- `getSupportCode()` - **DOES NOT EXIST**
  - Workaround: None
  - Impact: Support code feature must be removed

### Sessions
- `refreshSessions()` (plural) - **DOES NOT EXIST**
  - Workaround: Only `refreshSession()` (singular) exists
  - Impact: Cannot refresh all sessions at once

## Parameter Changes

### Authentication
- `authenticateMfa()` - Now requires email and password in addition to multiFactorCode
- `authenticateWithAccessTokenRetrievalKey()` - Now requires userId parameter
- `confirmPasswordReset()` - May require userId parameter

### Email
- `verifyEmail()` - Now requires email parameter in addition to token
- `changeEmail()` - Password no longer required in data payload

### Profile
- `updatePersonalInformation()` - Requires wrapping data in `person` object
- `deleteUser()` - Now requires userId parameter

### Phone
- `verifyPhoneNumber()` - Parameter renamed from `verificationCode` to `code`

## Response Property Changes
- `response.data.expiresAt` → `response.data.expires`
- Authentication responses don't include `authenticationToken` for MFA

## Other API Issues

### Marketplace
- Many parameter structure changes (see Agent 2's findings)
- Property name mismatches in requests/responses

### Container/Notification/Conversation
- Generally well-aligned with SDK (minimal issues)

### Database/SSH
- Method names generally correct
- Some parameter structure differences

### Mail/Domain
- Methods exist but with different parameter structures
- Response handling needs updates

### Project/Customer/App
- Most methods exist with correct names
- Parameter structures need adjustment

## Recommendations

1. **Remove Features**: For methods that don't exist and have no workaround
   - `resendEmailVerification`
   - `getSupportCode`
   - `getPersonalInformation`

2. **Implement Workarounds**: For critical missing methods
   - `getSelf()` → Implement helper using `checkToken()` + `getUser()`
   - `authenticateWithSessionToken()` → Use `refreshSession()` with documentation

3. **Update Documentation**: Clearly document which features are not available

4. **Request SDK Updates**: Submit feature requests to Mittwald for missing critical methods

5. **Type Safety**: Continue using typed API to catch future breaking changes early