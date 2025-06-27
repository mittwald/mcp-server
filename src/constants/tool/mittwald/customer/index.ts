/**
 * @file Index for all Mittwald Customer API tool definitions
 * @module constants/tool/mittwald/customer
 */

// Customer Management Tools
export {
  mittwald_customer_list,
  mittwald_customer_get,
  mittwald_customer_create,
  mittwald_customer_update,
  mittwald_customer_delete,
  mittwald_customer_is_legally_competent
} from './customer-management.js';

// Customer Profile Tools
export {
  mittwald_customer_upload_avatar,
  mittwald_customer_delete_avatar,
  mittwald_customer_list_memberships,
  mittwald_customer_leave,
  mittwald_customer_get_wallet,
  mittwald_customer_create_wallet,
  mittwald_customer_create_recommendation_suggestion
} from './customer-profile.js';

// Customer Invitation Tools
export {
  mittwald_customer_list_invites,
  mittwald_customer_create_invite,
  mittwald_customer_accept_invite
} from './customer-invitations.js';

// Customer Contract Tools
export {
  mittwald_customer_list_contracts,
  mittwald_customer_get_lead_fyndr_contract
} from './customer-contracts.js';

// Customer Miscellaneous Tools
export {
  mittwald_customer_get_conversation_preferences,
  mittwald_customer_get_extension_instance,
  mittwald_customer_get_invoice_settings,
  mittwald_customer_update_invoice_settings,
  mittwald_customer_list_invoices,
  mittwald_customer_get_invoice,
  mittwald_customer_get_invoice_file_access_token,
  mittwald_customer_list_orders
} from './customer-misc.js';