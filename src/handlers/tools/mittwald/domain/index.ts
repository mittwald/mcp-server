/**
 * @file Aggregates all Mittwald domain handler implementations
 * @module handlers/tools/mittwald/domain/index
 */

// Export all domain management handlers and schemas
export {
  handleDomainList,
  handleDomainGet,
  handleDomainDelete,
  handleDomainCheckRegistrability,
  handleDomainUpdateProject,
  DomainListArgsSchema,
  DomainGetArgsSchema,
  DomainDeleteArgsSchema,
  DomainCheckRegistrabilityArgsSchema,
  DomainUpdateProjectArgsSchema,
  type DomainListArgs,
  type DomainGetArgs,
  type DomainDeleteArgs,
  type DomainCheckRegistrabilityArgs,
  type DomainUpdateProjectArgs
} from './domain-management.js';

// Export all DNS and nameserver handlers and schemas
export {
  handleDomainUpdateNameservers,
  handleDomainCreateAuthCode,
  handleDomainUpdateAuthCode,
  handleDomainResendEmail,
  handleDomainAbortDeclaration,
  DomainUpdateNameserversArgsSchema,
  DomainCreateAuthCodeArgsSchema,
  DomainUpdateAuthCodeArgsSchema,
  DomainResendEmailArgsSchema,
  DomainAbortDeclarationArgsSchema,
  type DomainUpdateNameserversArgs,
  type DomainCreateAuthCodeArgs,
  type DomainUpdateAuthCodeArgs,
  type DomainResendEmailArgs,
  type DomainAbortDeclarationArgs
} from './domain-dns.js';

// Export all ownership and contact handlers and schemas
export {
  handleDomainUpdateContact,
  handleDomainGetHandleFields,
  handleDomainGetScreenshot,
  handleDomainGetSupportedTlds,
  handleDomainGetContract,
  DomainUpdateContactArgsSchema,
  DomainGetHandleFieldsArgsSchema,
  DomainGetScreenshotArgsSchema,
  DomainGetSupportedTldsArgsSchema,
  DomainGetContractArgsSchema,
  type DomainUpdateContactArgs,
  type DomainGetHandleFieldsArgs,
  type DomainGetScreenshotArgs,
  type DomainGetSupportedTldsArgs,
  type DomainGetContractArgs
} from './domain-ownership.js';