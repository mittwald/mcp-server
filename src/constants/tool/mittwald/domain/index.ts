/**
 * @file Aggregates all Mittwald domain tool definitions
 * @module constants/tool/mittwald/domain/index
 */

// Export all domain management tools
export {
  mittwald_domain_list,
  mittwald_domain_get,
  mittwald_domain_delete,
  mittwald_domain_check_registrability,
  mittwald_domain_update_project
} from './domain-management.js';

// Export all DNS and nameserver tools
export {
  mittwald_domain_update_nameservers,
  mittwald_domain_create_auth_code,
  mittwald_domain_update_auth_code,
  mittwald_domain_resend_email,
  mittwald_domain_abort_declaration
} from './domain-dns.js';

// Export all ownership and contact tools
export {
  mittwald_domain_update_contact,
  mittwald_domain_get_handle_fields,
  mittwald_domain_get_screenshot,
  mittwald_domain_get_supported_tlds,
  mittwald_domain_get_contract
} from './domain-ownership.js';

// Aggregate all domain tools for easy import
import { mittwald_domain_list, mittwald_domain_get, mittwald_domain_delete, mittwald_domain_check_registrability, mittwald_domain_update_project } from './domain-management.js';
import { mittwald_domain_update_nameservers, mittwald_domain_create_auth_code, mittwald_domain_update_auth_code, mittwald_domain_resend_email, mittwald_domain_abort_declaration } from './domain-dns.js';
import { mittwald_domain_update_contact, mittwald_domain_get_handle_fields, mittwald_domain_get_screenshot, mittwald_domain_get_supported_tlds, mittwald_domain_get_contract } from './domain-ownership.js';

export const MITTWALD_DOMAIN_TOOLS = [
  // Domain management
  mittwald_domain_list,
  mittwald_domain_get,
  mittwald_domain_delete,
  mittwald_domain_check_registrability,
  mittwald_domain_update_project,
  
  // DNS and nameservers
  mittwald_domain_update_nameservers,
  mittwald_domain_create_auth_code,
  mittwald_domain_update_auth_code,
  mittwald_domain_resend_email,
  mittwald_domain_abort_declaration,
  
  // Ownership and contacts
  mittwald_domain_update_contact,
  mittwald_domain_get_handle_fields,
  mittwald_domain_get_screenshot,
  mittwald_domain_get_supported_tlds,
  mittwald_domain_get_contract
];