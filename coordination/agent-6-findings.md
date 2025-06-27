# Agent 6 Findings - Project, Customer & App APIs

## Project API Method Mappings

### Old Pattern → New Pattern
```typescript
// Project Management
client.api.project.listProjects() → client.project.listProjects()
client.api.project.getProject() → client.project.getProject()
client.api.project.deleteProject() → client.project.deleteProject()
client.api.project.updateProjectDescription() → client.project.updateProjectDescription()
client.api.project.requestProjectAvatarUpload() → client.project.requestProjectAvatarUpload()
client.api.project.deleteProjectAvatar() → client.project.deleteProjectAvatar()

// Project Invitations
client.api.project.createProjectInvite() → client.project.createProjectInvite()
client.api.project.listProjectInvites() → client.project.listProjectInvites()
client.api.project.getProjectInvite() → client.project.getProjectInvite()
client.api.project.deleteProjectInvite() → client.project.deleteProjectInvite()
client.api.project.resendProjectInviteMail() → client.project.resendProjectInviteMail()
client.api.project.listInvitesForProject() → client.project.listInvitesForProject()
client.api.project.acceptProjectInvite() → client.project.acceptProjectInvite()
client.api.project.declineProjectInvite() → client.project.declineProjectInvite()

// Project Memberships
client.api.project.listMembershipsForProject() → client.project.listMembershipsForProject()
client.api.project.createProjectMembership() → Not found, may need to use invites
client.api.project.getProjectMembership() → client.project.getProjectMembership()
client.api.project.updateProjectMembership() → client.project.updateProjectMembership()
client.api.project.deleteProjectMembership() → client.project.deleteProjectMembership()
client.api.project.listProjectMemberships() → client.project.listProjectMemberships()

// Project Resources
client.api.projectFileSystem.getDirectories() → client.projectFileSystem.getDirectories()
client.api.projectFileSystem.getFileContent() → client.projectFileSystem.getFileContent()
client.api.projectFileSystem.getDiskUsage() → client.projectFileSystem.getDiskUsage()
client.api.projectFileSystem.getFileSystemUsers() → client.projectFileSystem.getFileSystemUsers()
client.api.projectFileSystem.getJwt() → client.projectFileSystem.getJwt()
```

## Customer API Method Mappings

### Old Pattern → New Pattern
```typescript
// Customer Management
client.api.customer.listCustomers() → client.customer.listCustomers()
client.api.customer.createCustomer() → client.customer.createCustomer()
client.api.customer.getCustomer() → client.customer.getCustomer()
client.api.customer.updateCustomer() → client.customer.updateCustomer()
client.api.customer.deleteCustomer() → client.customer.deleteCustomer()
client.api.customer.requestCustomerAvatarUpload() → client.customer.requestAvatarUpload()
client.api.customer.removeAvatar() → client.customer.removeAvatar()
client.api.customer.isCustomerLegallyCompetent() → client.customer.isCustomerLegallyCompetent()

// Customer Invitations
client.api.customer.createCustomerInvite() → client.customer.createCustomerInvite()
client.api.customer.listCustomerInvites() → client.customer.listCustomerInvites()
client.api.customer.getCustomerInvite() → client.customer.getCustomerInvite()
client.api.customer.deleteCustomerInvite() → client.customer.deleteCustomerInvite()
client.api.customer.resendCustomerInviteMail() → client.customer.resendCustomerInviteMail()
client.api.customer.listInvitesForCustomer() → client.customer.listInvitesForCustomer()
client.api.customer.acceptCustomerInvite() → client.customer.acceptCustomerInvite()
client.api.customer.declineCustomerInvite() → client.customer.declineCustomerInvite()

// Customer Memberships
client.api.customer.listMembershipsForCustomer() → client.customer.listMembershipsForCustomer()
client.api.customer.getCustomerMembership() → client.customer.getCustomerMembership()
client.api.customer.updateCustomerMembership() → client.customer.updateCustomerMembership()
client.api.customer.deleteCustomerMembership() → client.customer.deleteCustomerMembership()
client.api.customer.listCustomerMemberships() → client.customer.listCustomerMemberships()

// Customer Contracts
client.api.contract.listContracts() → client.contract.listContracts()
client.api.contract.getContract() → client.contract.getContract()
client.api.contract.getContractContent() → Not found, needs investigation
```

## App API Method Mappings

### Old Pattern → New Pattern
```typescript
// App Management
client.api.app.listApps() → client.app.listApps()
client.api.app.getApp() → client.app.getApp()
client.api.app.listAppversions() → client.app.listAppversions()
client.api.app.getAppversion() → client.app.getAppversion()

// App Installations
client.api.app.listAppinstallations() → client.app.listAppinstallations()
client.api.app.getAppinstallation() → client.app.getAppinstallation()
client.api.app.requestAppinstallation() → client.app.requestAppinstallation()
client.api.app.patchAppinstallation() → client.app.patchAppinstallation()
client.api.app.uninstallAppinstallation() → client.app.uninstallAppinstallation()
client.api.app.requestAppinstallationCopy() → client.app.requestAppinstallationCopy()

// App Actions
client.api.app.executeAction() → client.app.executeAction()
client.api.app.retrieveStatus() → client.app.retrieveStatus()

// App Databases
client.api.app.linkDatabase() → client.app.linkDatabase()
client.api.app.unlinkDatabase() → client.app.unlinkDatabase()
client.api.app.setDatabaseUsers() → client.app.setDatabaseUsers()
client.api.app.replaceDatabase() → client.app.replaceDatabase()

// System Software
client.api.app.listSystemsoftwares() → client.app.listSystemsoftwares()
client.api.app.getSystemsoftware() → client.app.getSystemsoftware()
client.api.app.listSystemsoftwareversions() → client.app.listSystemsoftwareversions()
client.api.app.getSystemsoftwareversion() → client.app.getSystemsoftwareversion()
client.api.app.getInstalledSystemsoftwareForAppinstallation() → client.app.getInstalledSystemsoftwareForAppinstallation()
```

## Common Status Code Patterns

```typescript
// Old pattern
response.status === 200

// New pattern
String(response.status).startsWith('2')
```

## Key Issues Found

1. All modules use `client.api.*` which needs to be changed to `client.*` (removing the `.api` part)
2. Status checks need to handle multiple success codes (2xx)
3. Some methods may have parameter structure changes
4. Import issues with '@modelcontextprotocol/sdk/types.js' in constants files
5. Response data types need proper handling:
   - Use Array.isArray() to check if response.data is an array
   - Use type assertions (as Type) for single object responses
   - The response.data is a union type that varies by status code