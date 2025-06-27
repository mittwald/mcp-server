# Agent 2 - Marketplace API Method Mappings

## API Method Mappings (client.api → client.marketplace)

### Extension Management
- `client.api.marketplace.listExtensions()` → `client.marketplace.extensionListExtensions()`
- `client.api.marketplace.getExtension()` → `client.marketplace.extensionGetExtension()`
- `client.api.marketplace.createExtension()` → `client.marketplace.extensionRegisterExtension()`
- `client.api.marketplace.updateExtension()` → `client.marketplace.extensionPatchExtension()`
- `client.api.marketplace.deleteExtension()` → `client.marketplace.extensionDeleteExtension()`
- `client.api.marketplace.updateExtensionPublished()` → `client.marketplace.extensionSetExtensionPublishedState()`
- `client.api.marketplace.updateExtensionContext()` → `client.marketplace.extensionChangeContext()`
- `client.api.marketplace.uploadExtensionLogo()` → `client.marketplace.extensionRequestLogoUpload()`
- `client.api.marketplace.deleteExtensionLogo()` → `client.marketplace.extensionRemoveLogo()`
- `client.api.marketplace.uploadExtensionAsset()` → `client.marketplace.extensionRequestAssetUpload()`
- `client.api.marketplace.deleteExtensionAsset()` → `client.marketplace.extensionRemoveAsset()`
- `client.api.marketplace.createExtensionSecret()` → `client.marketplace.extensionGenerateExtensionSecret()`
- `client.api.marketplace.deleteExtensionSecret()` → `client.marketplace.extensionInvalidateExtensionSecret()`
- `client.api.marketplace.requestExtensionVerification()` → `client.marketplace.extensionRequestExtensionVerification()`

### Extension Instance Management
- `client.api.marketplace.createExtensionInstance()` → `client.marketplace.extensionCreateExtensionInstance()`
- `client.api.marketplace.deleteExtensionInstance()` → `client.marketplace.extensionDeleteExtensionInstance()`
- `client.api.marketplace.enableExtensionInstance()` → `client.marketplace.extensionEnableExtensionInstance()`
- `client.api.marketplace.disableExtensionInstance()` → `client.marketplace.extensionDisableExtensionInstance()`
- `client.api.marketplace.updateExtensionInstanceScopes()` → `client.marketplace.extensionConsentToExtensionScopes()`
- `client.api.marketplace.createAccessTokenRetrievalKey()` → `client.marketplace.extensionCreateRetrievalKey()`
- `client.api.marketplace.createExtensionInstanceToken()` → `client.marketplace.extensionGenerateSessionToken()`
- `client.api.marketplace.updateExtensionInstanceSecret()` → `client.marketplace.contributorRotateSecretForExtensionInstance()`
- `client.api.marketplace.authenticateExtensionInstanceSession()` → `client.marketplace.extensionAuthenticateInstance()`
- `client.typedApi.marketplace.listExtensionInstances()` → `client.marketplace.extensionListExtensionInstances()`
- `client.typedApi.marketplace.getExtensionInstance()` → `client.marketplace.extensionGetExtensionInstance()`

### Marketplace Utilities
- `client.api.marketplace.listScopes()` → `client.marketplace.extensionListScopes()`
- `client.api.marketplace.getPublicKey()` → `client.marketplace.extensionGetPublicKey()`
- `client.api.marketplace.getWebhookPublicKey()` → `client.marketplace.extensionGetPublicKey()` (same method)
- `client.api.marketplace.getCustomerExtension()` → `client.marketplace.extensionGetExtensionInstanceForCustomer()`
- `client.api.marketplace.getProjectExtension()` → `client.marketplace.extensionGetExtensionInstanceForProject()`
- `client.api.marketplace.dryRunExtensionWebhook()` → `client.marketplace.extensionDryRunWebhook()`

### Contributor Management
- `client.typedApi.marketplace.extensionListContributors()` → `client.marketplace.extensionListContributors()`
- `client.typedApi.marketplace.extensionGetContributor()` → `client.marketplace.extensionGetContributor()`
- `client.typedApi.marketplace.extensionListExtensions()` → `client.marketplace.extensionListExtensions()` (with contributorId filter)

## Key Changes
1. All methods are now prefixed with category names (extension, contributor, customer)
2. Method names are more specific and descriptive
3. No more generic `api` surface - everything is typed through specific namespaces
4. Status code checks need to handle string status codes (use `String(response.status).startsWith('2')`)
5. The `marketplace` namespace is directly on the client, not under `api` or `typedApi`

## Summary of Work Completed
- Fixed all TypeScript compilation errors in marketplace modules (~31 errors)
- Migrated from untyped `api` surface to properly typed SDK methods
- Updated status code checks to handle string responses
- Verified all marketplace handlers are using the correct SDK v4.169.0 method names

## CRITICAL ISSUE DISCOVERED
The `MittwaldClient` wrapper class doesn't expose the `marketplace` property directly. 
All marketplace methods must be accessed through `client.api.marketplace` not `client.marketplace`.
This affects ALL the changes made above!