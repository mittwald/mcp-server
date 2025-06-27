// Export all project management tools
export * from './project-management.js';
export * from './project-membership.js';
export * from './project-invitation.js';
export * from './project-resources.js';

// Re-export all tools as an array for easy import
import {
  mittwald_project_list,
  mittwald_project_get,
  mittwald_project_delete,
  mittwald_project_update_description,
  mittwald_project_upload_avatar,
  mittwald_project_delete_avatar,
  mittwald_project_get_jwt,
  mittwald_server_list_projects,
} from './project-management.js';

import {
  mittwald_project_membership_list_all,
  mittwald_project_membership_list,
  mittwald_project_membership_get_self,
  mittwald_project_membership_get,
  mittwald_project_membership_update,
  mittwald_project_membership_remove,
  mittwald_project_leave,
} from './project-membership.js';

import {
  mittwald_project_invite_list_all,
  mittwald_project_invite_list,
  mittwald_project_invite_create,
  mittwald_project_invite_get,
  mittwald_project_invite_delete,
  mittwald_project_invite_accept,
  mittwald_project_invite_decline,
  mittwald_project_invite_resend,
  mittwald_project_token_invite_get,
} from './project-invitation.js';

import {
  mittwald_project_get_storage_statistics,
  mittwald_project_update_storage_threshold,
  mittwald_project_get_contract,
  mittwald_project_list_orders,
} from './project-resources.js';

export const MITTWALD_PROJECT_TOOLS = [
  // Project Management (8 tools)
  mittwald_project_list,
  mittwald_project_get,
  mittwald_project_delete,
  mittwald_project_update_description,
  mittwald_project_upload_avatar,
  mittwald_project_delete_avatar,
  mittwald_project_get_jwt,
  mittwald_server_list_projects,
  
  // Project Membership (7 tools)
  mittwald_project_membership_list_all,
  mittwald_project_membership_list,
  mittwald_project_membership_get_self,
  mittwald_project_membership_get,
  mittwald_project_membership_update,
  mittwald_project_membership_remove,
  mittwald_project_leave,
  
  // Project Invitation (9 tools)
  mittwald_project_invite_list_all,
  mittwald_project_invite_list,
  mittwald_project_invite_create,
  mittwald_project_invite_get,
  mittwald_project_invite_delete,
  mittwald_project_invite_accept,
  mittwald_project_invite_decline,
  mittwald_project_invite_resend,
  mittwald_project_token_invite_get,
  
  // Project Resources (4 tools)
  mittwald_project_get_storage_statistics,
  mittwald_project_update_storage_threshold,
  mittwald_project_get_contract,
  mittwald_project_list_orders,
];

// Total: 28 Project API tools