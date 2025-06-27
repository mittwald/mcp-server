# Agent 5 - Mail & Domain API TypeScript Fix Findings

## Mail API Method Mappings

### Mail Address Operations
- `client.api.mail.listMailAddresses()` → `client.mail.listMailAddresses()`
- `client.api.mail.createMailAddress()` → `client.mail.createMailAddress()`
- `client.api.mail.getMailAddress()` → `client.mail.getMailAddress()`
- `client.api.mail.deleteMailAddress()` → `client.mail.deleteMailAddress()`
- `client.api.mail.updateMailAddressAddress()` → `client.mail.updateMailAddressAddress()`
- `client.api.mail.updateMailAddressPassword()` → `client.mail.updateMailAddressPassword()`
- `client.api.mail.updateMailAddressQuota()` → `client.mail.updateMailAddressQuota()`
- `client.api.mail.updateMailAddressForwardAddresses()` → `client.mail.updateMailAddressForwardAddresses()`
- `client.api.mail.updateMailAddressAutoresponder()` → `client.mail.updateMailAddressAutoresponder()`
- `client.api.mail.updateMailAddressSpamProtection()` → `client.mail.updateMailAddressSpamProtection()`
- `client.api.mail.updateMailAddressCatchAll()` → `client.mail.updateMailAddressCatchAll()`

### Delivery Box Operations
- `client.api.mail.listDeliveryBoxes()` → `client.mail.listDeliveryBoxes()`
- `client.api.mail.createDeliverybox()` → `client.mail.createDeliverybox()` (note lowercase 'b')
- `client.api.mail.getDeliveryBox()` → `client.mail.getDeliveryBox()`
- `client.api.mail.deleteDeliveryBox()` → `client.mail.deleteDeliveryBox()`
- `client.api.mail.updateDeliveryBoxDescription()` → `client.mail.updateDeliveryBoxDescription()`
- `client.api.mail.updateDeliveryBoxPassword()` → `client.mail.updateDeliveryBoxPassword()`

### Mail Settings Operations
- `client.api.mail.listProjectMailSettings()` → `client.mail.listProjectMailSettings()`
- `client.api.mail.updateProjectMailSetting()` → `client.mail.updateProjectMailSetting()`

## Domain API Method Mappings

### Core Domain Operations
- `client.api.domain.listDomains()` → `client.domain.listDomains()`
- `client.api.domain.getDomain()` → `client.domain.getDomain()`
- `client.api.domain.deleteDomain()` → `client.domain.deleteDomain()`
- `client.api.domain.updateDomainProjectId()` → `client.domain.updateDomainProjectId()`

### Domain DNS/Nameserver Operations
- `client.api.domain.updateDomainNameservers()` → `client.domain.updateDomainNameservers()`
- `client.api.domain.createDomainAuthCode()` → `client.domain.createDomainAuthCode()`
- `client.api.domain.updateDomainAuthCode()` → `client.domain.updateDomainAuthCode()`
- `client.api.domain.resendDomainEmail()` → `client.domain.resendDomainEmail()`
- `client.api.domain.abortDomainDeclaration()` → `client.domain.abortDomainDeclaration()`

### Domain Management Operations
- `client.api.domain.checkDomainRegistrability()` → `client.domain.checkDomainRegistrability()`
- `client.api.domain.checkDomainTransferability()` → `client.domain.checkDomainTransferability()`
- `client.api.domain.updateDomainContact()` → `client.domain.updateDomainContact()`

### Domain Ownership Operations
- `client.api.domain.suggest()` → `client.domain.suggest()`
- `client.api.domain.listTlds()` → `client.domain.listTlds()`
- `client.api.domain.listTldContactSchemas()` → `client.domain.listTldContactSchemas()`

## Common Migration Patterns

1. **Remove `.api` from client calls**: All methods are now directly on the namespace (e.g., `client.mail.*` instead of `client.api.mail.*`)

2. **Status checks need updating**: Change from exact status checks to string prefix checks:
   ```typescript
   // Old
   response.status === 200
   
   // New
   String(response.status).startsWith('2')
   ```

3. **Client access pattern**: When using the wrapped MittwaldClient:
   ```typescript
   // Old
   mittwaldClient.api.mail.listMailAddresses()
   
   // New (both work, typedApi is preferred for clarity)
   mittwaldClient.api.mail.listMailAddresses()
   mittwaldClient.typedApi.mail.listMailAddresses()
   ```

## Notes
- The typed SDK is accessed directly on the client object (e.g., `client.mail`, `client.domain`)
- Method names remain mostly the same, just the access path changes
- Be careful with `createDeliverybox` - it has a lowercase 'b' in the method name