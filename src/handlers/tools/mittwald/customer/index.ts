/**
 * @file Index for all Mittwald Customer API handlers
 * @module handlers/tools/mittwald/customer
 */

// Customer Management Handlers
export {
  handleCustomerList,
  handleCustomerGet,
  handleCustomerCreate,
  handleCustomerUpdate,
  handleCustomerDelete,
  handleCustomerIsLegallyCompetent
} from './customer-management.js';

// Customer Profile Handlers
export {
  handleCustomerUploadAvatar,
  handleCustomerDeleteAvatar,
  handleCustomerListMemberships,
  handleCustomerLeave,
  handleCustomerGetWallet,
  handleCustomerCreateWallet,
  handleCustomerCreateRecommendationSuggestion
} from './customer-profile.js';

// Customer Invitation Handlers
export {
  handleCustomerListInvites,
  handleCustomerCreateInvite,
  handleCustomerAcceptInvite
} from './customer-invitations.js';

// Customer Contract Handlers
export {
  handleCustomerListContracts,
  handleCustomerGetLeadFyndrContract
} from './customer-contracts.js';

// Customer Miscellaneous Handlers
export {
  handleCustomerGetConversationPreferences,
  handleCustomerGetExtensionInstance,
  handleCustomerGetInvoiceSettings,
  handleCustomerUpdateInvoiceSettings,
  handleCustomerListInvoices,
  handleCustomerGetInvoice,
  handleCustomerGetInvoiceFileAccessToken,
  handleCustomerListOrders
} from './customer-misc.js';