// Export all project management handlers
export * from './project-management.js';
export * from './project-membership.js';
export * from './project-invitation.js';
export * from './project-resources.js';

// Re-export handlers for easy import
export {
  handleProjectList,
  handleProjectGet,
  handleProjectDelete,
  handleProjectUpdateDescription,
  handleProjectUploadAvatar,
  handleProjectDeleteAvatar,
  handleProjectGetJwt,
  handleServerListProjects,
} from './project-management.js';

export {
  handleProjectMembershipListAll,
  handleProjectMembershipList,
  handleProjectMembershipGetSelf,
  handleProjectMembershipGet,
  handleProjectMembershipUpdate,
  handleProjectMembershipRemove,
  handleProjectLeave,
} from './project-membership.js';

export {
  handleProjectInviteListAll,
  handleProjectInviteList,
  handleProjectInviteCreate,
  handleProjectInviteGet,
  handleProjectInviteDelete,
  handleProjectInviteAccept,
  handleProjectInviteDecline,
  handleProjectInviteResend,
  handleProjectTokenInviteGet,
} from './project-invitation.js';

export {
  handleProjectGetStorageStatistics,
  handleProjectUpdateStorageThreshold,
  handleProjectGetContract,
  handleProjectListOrders,
} from './project-resources.js';