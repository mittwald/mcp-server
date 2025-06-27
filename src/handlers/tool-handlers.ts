/**
 * @file MCP Tool request handlers
 * @module handlers/tool-handlers
 * 
 * @remarks
 * This module implements the MCP tool handling functionality, managing
 * both tool listing and tool invocation. It serves as the main entry point
 * for all tool-related operations in the Reddit MCP server.
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools | MCP Tools Specification}
 */

import type {
  CallToolRequest,
  CallToolResult,
  ListToolsRequest,
  ListToolsResult,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TOOLS, TOOL_ERROR_MESSAGES } from '../constants/tools.js';
import { RedditService } from '../services/reddit/reddit-service.js';
<<<<<<< HEAD
import { getMittwaldClient } from '../services/mittwald/mittwald-client.js';
=======
import { getMittwaldClient } from '../services/mittwald/index.js';
>>>>>>> origin/feat/api-app
import { logger } from '../utils/logger.js';
import type { RedditAuthInfo, MCPToolContext } from '../types/request-context.js';
import type { ToolHandlerContext } from './tools/types.js';
import type { MittwaldToolHandlerContext } from './tools/mittwald/types.js';
import type {
  GetChannelArgs,
  GetPostArgs,
  GetNotificationsArgs,
  SearchRedditArgs,
  GetCommentArgs,
  MittwaldProjectListArgs,
  MittwaldProjectGetArgs,
  MittwaldProjectDeleteArgs,
  MittwaldProjectUpdateDescriptionArgs,
  MittwaldProjectUploadAvatarArgs,
  MittwaldProjectDeleteAvatarArgs,
  MittwaldProjectGetJwtArgs,
  MittwaldServerListProjectsArgs,
  MittwaldProjectMembershipListAllArgs,
  MittwaldProjectMembershipListArgs,
  MittwaldProjectMembershipGetSelfArgs,
  MittwaldProjectMembershipGetArgs,
  MittwaldProjectMembershipUpdateArgs,
  MittwaldProjectMembershipRemoveArgs,
  MittwaldProjectLeaveArgs,
  MittwaldProjectInviteListAllArgs,
  MittwaldProjectInviteListArgs,
  MittwaldProjectInviteCreateArgs,
  MittwaldProjectInviteGetArgs,
  MittwaldProjectInviteDeleteArgs,
  MittwaldProjectInviteAcceptArgs,
  MittwaldProjectInviteDeclineArgs,
  MittwaldProjectInviteResendArgs,
  MittwaldProjectTokenInviteGetArgs,
  MittwaldProjectGetStorageStatisticsArgs,
  MittwaldProjectUpdateStorageThresholdArgs,
  MittwaldProjectGetContractArgs,
  MittwaldProjectListOrdersArgs,
} from './tools/index.js';
import type {
  MittwaldAppListArgs,
  MittwaldAppGetArgs,
  MittwaldAppListVersionsArgs,
  MittwaldAppGetVersionArgs,
  MittwaldAppGetVersionUpdateCandidatesArgs,
  MittwaldAppInstallationListArgs,
  MittwaldAppInstallationGetArgs,
  MittwaldAppInstallationCreateArgs,
  MittwaldAppInstallationUpdateArgs,
  MittwaldAppInstallationDeleteArgs,
  MittwaldAppInstallationActionArgs,
  MittwaldAppInstallationCopyArgs,
  MittwaldAppInstallationGetStatusArgs,
  MittwaldAppInstallationGetMissingDependenciesArgs,
  MittwaldSystemSoftwareListArgs,
  MittwaldSystemSoftwareGetArgs,
  MittwaldSystemSoftwareListVersionsArgs,
  MittwaldSystemSoftwareGetVersionArgs,
  MittwaldAppInstallationGetSystemSoftwareArgs,
  MittwaldAppInstallationUpdateSystemSoftwareArgs
} from './tools/mittwald/app/index.js';
import {
  handleGetChannel,
  handleGetNotifications,
  handleGetPost,
  handleSearchReddit,
  handleGetComment,
  handleElicitationExample,
  handleSamplingExample,
  handleStructuredDataExample,
  handleLogging,
  handleValidationExample,
  // Mittwald mail handlers
  handleListMailAddresses,
  handleCreateMailAddress,
  handleGetMailAddress,
  handleDeleteMailAddress,
  handleUpdateMailAddressAddress,
  handleUpdateMailAddressPassword,
  handleUpdateMailAddressQuota,
  handleUpdateMailAddressForwardAddresses,
  handleUpdateMailAddressAutoresponder,
  handleUpdateMailAddressSpamProtection,
  handleUpdateMailAddressCatchAll,
  handleListDeliveryBoxes,
  handleCreateDeliveryBox,
  handleGetDeliveryBox,
  handleDeleteDeliveryBox,
  handleUpdateDeliveryBoxDescription,
  handleUpdateDeliveryBoxPassword,
  handleListProjectMailSettings,
  handleUpdateProjectMailSetting,
} from './tools/index.js';
import {
<<<<<<< HEAD
  handleProjectList,
  handleProjectGet,
  handleProjectDelete,
  handleProjectUpdateDescription,
  handleProjectUploadAvatar,
  handleProjectDeleteAvatar,
  handleProjectGetJwt,
  handleServerListProjects,
  handleProjectMembershipListAll,
  handleProjectMembershipList,
  handleProjectMembershipGetSelf,
  handleProjectMembershipGet,
  handleProjectMembershipUpdate,
  handleProjectMembershipRemove,
  handleProjectLeave,
  handleProjectInviteListAll,
  handleProjectInviteList,
  handleProjectInviteCreate,
  handleProjectInviteGet,
  handleProjectInviteDelete,
  handleProjectInviteAccept,
  handleProjectInviteDecline,
  handleProjectInviteResend,
  handleProjectTokenInviteGet,
  handleProjectGetStorageStatistics,
  handleProjectUpdateStorageThreshold,
  handleProjectGetContract,
  handleProjectListOrders,
} from './tools/mittwald/project/index.js';

// Import Mittwald User API handlers
import {
  handleAuthenticate,
  handleGetProfile,
  handleGetEmail,
  handleChangeEmail,
  handleChangePassword,
  handleListSessions,
  handleListApiTokens,
  handleCreateApiToken,
  handleMittwaldUserTool,
} from './tools/mittwald/user/index.js';

// Import Mittwald Domain API handlers
import {
  // Domain management
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
  // DNS and nameservers
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
  // Ownership and contacts
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
  // Types
  type DomainListArgs,
  type DomainGetArgs,
  type DomainDeleteArgs,
  type DomainCheckRegistrabilityArgs,
  type DomainUpdateProjectArgs,
  type DomainUpdateNameserversArgs,
  type DomainCreateAuthCodeArgs,
  type DomainUpdateAuthCodeArgs,
  type DomainResendEmailArgs,
  type DomainAbortDeclarationArgs,
  type DomainUpdateContactArgs,
  type DomainGetHandleFieldsArgs,
  type DomainGetScreenshotArgs,
  type DomainGetSupportedTldsArgs,
  type DomainGetContractArgs
} from './tools/mittwald/domain/index.js';

// Mittwald marketplace handlers
import {
  handleMittwaldContributorList,
  handleMittwaldContributorGet,
  handleMittwaldContributorGetExtensions,
  handleMittwaldExtensionList,
  handleMittwaldExtensionGet,
  handleMittwaldExtensionCreate,
  handleMittwaldExtensionUpdate,
  handleMittwaldExtensionDelete,
  handleMittwaldExtensionPublish,
  handleMittwaldExtensionUpdateContext,
  handleMittwaldExtensionUploadLogo,
  handleMittwaldExtensionDeleteLogo,
  handleMittwaldExtensionUploadAsset,
  handleMittwaldExtensionDeleteAsset,
  handleMittwaldExtensionCreateSecret,
  handleMittwaldExtensionDeleteSecret,
  handleMittwaldExtensionRequestVerification,
  handleMittwaldExtensionInstanceList,
  handleMittwaldExtensionInstanceGet,
  handleMittwaldExtensionInstanceCreate,
  handleMittwaldExtensionInstanceDelete,
  handleMittwaldExtensionInstanceEnable,
  handleMittwaldExtensionInstanceDisable,
  handleMittwaldExtensionInstanceUpdateScopes,
  handleMittwaldExtensionInstanceCreateRetrievalKey,
  handleMittwaldExtensionInstanceCreateToken,
  handleMittwaldExtensionInstanceUpdateSecret,
  handleMittwaldExtensionInstanceAuthenticateSession,
  handleMittwaldMarketplaceListScopes,
  handleMittwaldMarketplaceGetPublicKey,
  handleMittwaldMarketplaceGetWebhookPublicKey,
  handleMittwaldMarketplaceGetCustomerExtension,
  handleMittwaldMarketplaceGetProjectExtension,
  handleMittwaldMarketplaceDryRunWebhook,
} from './tools/mittwald/marketplace/index.js';

// Import Mittwald Customer handlers
import * as CustomerHandlers from './tools/mittwald/customer/index.js';

import {
  handleMySQLDatabaseList,
  handleMySQLDatabaseCreate,
  handleMySQLDatabaseGet,
  handleMySQLDatabaseDelete,
  handleMySQLDatabaseUpdateDescription,
  handleMySQLDatabaseUpdateCharset,
  handleMySQLUserList,
  handleMySQLUserCreate,
  handleMySQLUserGet,
  handleMySQLUserUpdate,
  handleMySQLUserDelete,
  handleMySQLUserUpdatePassword,
  handleMySQLUserEnable,
  handleMySQLUserDisable,
  handleMySQLUserGetPhpMyAdminUrl,
  handleRedisDatabaseList,
  handleRedisDatabaseCreate,
  handleRedisDatabaseGet,
  handleRedisDatabaseDelete,
  handleRedisDatabaseUpdateDescription,
  handleRedisDatabaseUpdateConfiguration,
  handleRedisGetVersions,
  handleAppDatabaseUpdate,
  handleAppDatabaseReplace,
  handleAppDatabaseLink,
  handleAppDatabaseUnlink,
  handleAppDatabaseSetUsers
} from './tools/mittwald/database/index.js';

// Mittwald tool handlers
import * as ConversationHandlers from './tools/mittwald/conversation/index.js';
import * as NotificationHandlers from './tools/mittwald/notification/index.js';

// Mittwald tool argument types
import type {
  ConversationListArgs,
  ConversationCreateArgs,
  ConversationGetArgs,
  ConversationUpdateArgs,
  ConversationMessageListArgs,
  ConversationMessageCreateArgs,
  ConversationMessageUpdateArgs,
  ConversationMembersGetArgs,
  ConversationStatusSetArgs,
  ConversationFileUploadRequestArgs,
  ConversationFileAccessTokenArgs,
} from '../types/mittwald/conversation.js';
import type {
  NotificationListArgs,
  NotificationUnreadCountsArgs,
  NotificationMarkAllReadArgs,
  NotificationMarkReadArgs,
} from '../types/mittwald/notification.js';

// Import all Mittwald handlers and types
import {
  // Cronjob handlers and types
  handleMittwaldCronjobList,
  handleMittwaldCronjobCreate,
  handleMittwaldCronjobGet,
  handleMittwaldCronjobUpdate,
  handleMittwaldCronjobDelete,
  handleMittwaldCronjobUpdateAppId,
  handleMittwaldCronjobTrigger,
  handleMittwaldCronjobListExecutions,
  handleMittwaldCronjobGetExecution,
  handleMittwaldCronjobAbortExecution,
  type MittwaldCronjobListArgs,
  type MittwaldCronjobCreateArgs,
  type MittwaldCronjobGetArgs,
  type MittwaldCronjobUpdateArgs,
  type MittwaldCronjobDeleteArgs,
  type MittwaldCronjobUpdateAppIdArgs,
  type MittwaldCronjobTriggerArgs,
  type MittwaldCronjobListExecutionsArgs,
  type MittwaldCronjobGetExecutionArgs,
  type MittwaldCronjobAbortExecutionArgs,
  // Filesystem handlers and types
  handleMittwaldFilesystemListDirectories,
  handleMittwaldFilesystemGetDiskUsage,
  handleMittwaldFilesystemGetFileContent,
  handleMittwaldFilesystemGetJWT,
  handleMittwaldFilesystemListFiles,
  type MittwaldFilesystemListDirectoriesArgs,
  type MittwaldFilesystemGetDiskUsageArgs,
  type MittwaldFilesystemGetFileContentArgs,
  type MittwaldFilesystemGetJWTArgs,
  type MittwaldFilesystemListFilesArgs,
  // File handlers and types
  handleMittwaldFileCreate,
  handleMittwaldFileGetMeta,
  handleMittwaldFileGet,
  handleMittwaldFileGetWithName,
  handleMittwaldFileGetUploadTokenRules,
  handleMittwaldFileGetUploadTypeRules,
  handleMittwaldConversationRequestFileUpload,
  handleMittwaldConversationGetFileAccessToken,
  handleMittwaldInvoiceGetFileAccessToken,
  handleMittwaldDeprecatedFileGetTokenRules,
  handleMittwaldDeprecatedFileGetTypeRules,
  type MittwaldFileCreateArgs,
  type MittwaldFileGetMetaArgs,
  type MittwaldFileGetArgs,
  type MittwaldFileGetWithNameArgs,
  type MittwaldFileGetUploadTokenRulesArgs,
  type MittwaldFileGetUploadTypeRulesArgs,
  type MittwaldConversationRequestFileUploadArgs,
  type MittwaldConversationGetFileAccessTokenArgs,
  type MittwaldInvoiceGetFileAccessTokenArgs,
  type MittwaldDeprecatedFileGetTokenRulesArgs,
  type MittwaldDeprecatedFileGetTypeRulesArgs
} from './tools/mittwald/index.js';
=======
  handleMittwaldAppList,
  handleMittwaldAppGet,
  handleMittwaldAppListVersions,
  handleMittwaldAppGetVersion,
  handleMittwaldAppGetVersionUpdateCandidates,
  handleMittwaldAppInstallationList,
  handleMittwaldAppInstallationGet,
  handleMittwaldAppInstallationCreate,
  handleMittwaldAppInstallationUpdate,
  handleMittwaldAppInstallationDelete,
  handleMittwaldAppInstallationAction,
  handleMittwaldAppInstallationCopy,
  handleMittwaldAppInstallationGetStatus,
  handleMittwaldAppInstallationGetMissingDependencies,
  handleMittwaldSystemSoftwareList,
  handleMittwaldSystemSoftwareGet,
  handleMittwaldSystemSoftwareListVersions,
  handleMittwaldSystemSoftwareGetVersion,
  handleMittwaldAppInstallationGetSystemSoftware,
  handleMittwaldAppInstallationUpdateSystemSoftware,
} from './tools/mittwald/app/index.js';
>>>>>>> origin/feat/api-app

/**
 * Zod schemas for tool validation
 */
const ToolSchemas = {
  search_reddit: z.object({
    query: z.string().min(1).max(500).describe("Search query"),
    subreddit: z.string().optional().describe("Specific subreddit to search (optional)"),
    sort: z.enum(["relevance", "hot", "new", "top"]).default("relevance").describe("Sort order for results"),
    time: z.enum(["hour", "day", "week", "month", "year", "all"]).default("all").describe("Time filter for results"),
    limit: z.number().int().min(1).max(100).default(25).describe("Maximum number of results")
  }),
  
  get_channel: z.object({
    subreddit: z.string().min(1).describe("Name of the subreddit (without r/ prefix)"),
    sort: z.enum(["hot", "new", "controversial"]).default("hot").describe("Sort order for posts")
  }),
  
  get_post: z.object({
    id: z.string().describe("The unique identifier of the post to retrieve")
  }),
  
  get_notifications: z.object({
    filter: z.enum(["all", "unread", "messages", "comments", "mentions"]).optional().describe("Filter notifications"),
    limit: z.number().int().min(1).max(100).default(25).describe("Maximum number of notifications"),
    markRead: z.boolean().optional().describe("Mark notifications as read"),
    excludeIds: z.array(z.string()).optional().describe("IDs to exclude"),
    excludeTypes: z.array(z.enum(["comment_reply", "post_reply", "username_mention", "message", "other"])).optional().describe("Types to exclude"),
    excludeSubreddits: z.array(z.string()).optional().describe("Subreddits to exclude"),
    after: z.string().optional().describe("Cursor for pagination"),
    before: z.string().optional().describe("Cursor for pagination")
  }),
  
  get_comment: z.object({
    id: z.string().describe("The unique identifier of the comment"),
    includeThread: z.boolean().optional().describe("Include full comment thread")
  }),
  
  elicitation_example: z.object({
    type: z.enum(["input", "confirm", "choice"]).describe("Type of elicitation"),
    prompt: z.string().describe("Prompt to show to user"),
    options: z.array(z.string()).optional().describe("Options for choice type")
  }),
  
  sampling_example: z.object({
    taskType: z.enum(['summarize', 'generate', 'analyze', 'translate']).describe("The type of sampling task to demonstrate"),
    content: z.string().describe("Input content for the sampling task"),
    targetLanguage: z.string().optional().describe("Target language for translation tasks"),
    style: z.enum(['formal', 'casual', 'technical', 'creative']).optional().describe("Style preferences for generation tasks")
  }),
  
  structured_data_example: z.object({
    dataType: z.enum(['user', 'analytics', 'weather', 'product']).describe('The type of structured data to return'),
    id: z.string().optional().describe('Optional ID to fetch specific data'),
    includeNested: z.boolean().optional().default(false).describe('Whether to include nested data structures'),
    simulateError: z.boolean().optional().default(false).describe('Whether to simulate validation errors for testing')
  }).strict(),
  
  mcp_logging: z.object({
    level: z.enum(["debug", "info", "warning", "error"]).describe("Log level"),
    message: z.string().describe("Message to log"),
    data: z.unknown().optional().describe("Optional additional data")
  }),
  
  validation_example: z.object({
    name: z.string().min(2).max(50).regex(/^[a-zA-Z ]+$/).describe("Name (letters and spaces only, 2-50 chars)"),
    age: z.number().int().min(0).max(150).describe("Age in years (0-150)"),
    email: z.string().email().describe("Valid email address"),
    role: z.enum(["user", "admin", "moderator"]).describe("User role"),
    preferences: z.object({
      theme: z.enum(["light", "dark", "auto"]).optional().default("auto"),
      notifications: z.boolean().optional().default(true)
    }).optional(),
    tags: z.array(z.string().min(1)).min(0).max(10).optional().describe("List of tags (max 10, unique)")
  }),

<<<<<<< HEAD
  // Mittwald User API Schemas
  mittwald_user_authenticate: z.object({
    email: z.string().email().describe("User's email address"),
    password: z.string().describe("User's password")
  }),
  
  mittwald_user_get_profile: z.object({}),
  mittwald_user_get_email: z.object({}),
  mittwald_user_list_sessions: z.object({}),
  mittwald_user_list_api_tokens: z.object({}),
  mittwald_user_list_ssh_keys: z.object({}),
  mittwald_user_get_mfa_status: z.object({}),
  
  mittwald_user_change_email: z.object({
    email: z.string().email().describe("New email address"),
    password: z.string().describe("Current password for verification")
  }),
  
  mittwald_user_change_password: z.object({
    oldPassword: z.string().describe("Current password"),
    newPassword: z.string().describe("New password")
  }),
  
  mittwald_user_create_api_token: z.object({
    name: z.string().describe("API token name"),
    description: z.string().optional().describe("Optional description"),
    expiresAt: z.string().optional().describe("Optional expiration date")
  }),
  
  mittwald_user_create_ssh_key: z.object({
    publicKey: z.string().describe("SSH public key"),
    comment: z.string().optional().describe("Optional comment")
  }),
  
  mittwald_user_create_feedback: z.object({
    subject: z.string().describe("Feedback subject"),
    message: z.string().describe("Feedback message"),
    type: z.enum(["bug", "feature", "improvement", "other"]).optional()
  }),

  // Mittwald Project API schemas
  mittwald_project_list: z.object({
    customerId: z.string().optional().describe("Filter projects by customer ID"),
    serverId: z.string().optional().describe("Filter projects by server ID"),
    limit: z.number().int().min(1).max(100).default(50).optional().describe("Maximum number of results"),
    skip: z.number().int().min(0).default(0).optional().describe("Number of results to skip")
  }),

  mittwald_project_get: z.object({
    projectId: z.string().describe("The project ID")
  }),

  mittwald_project_delete: z.object({
    projectId: z.string().describe("The project ID to delete")
  }),

  mittwald_project_update_description: z.object({
    projectId: z.string().describe("The project ID"),
    description: z.string().describe("The new project description")
  }),

  mittwald_project_upload_avatar: z.object({
    projectId: z.string().describe("The project ID"),
    fileContent: z.string().describe("Base64 encoded file content"),
    filename: z.string().describe("The filename including extension"),
    contentType: z.string().default("image/png").optional().describe("MIME type of the file")
  }),

  mittwald_project_delete_avatar: z.object({
    projectId: z.string().describe("The project ID")
  }),

  mittwald_project_get_jwt: z.object({
    projectId: z.string().describe("The project ID")
  }),

  mittwald_server_list_projects: z.object({
    serverId: z.string().describe("The server ID"),
    limit: z.number().int().min(1).max(100).default(50).optional().describe("Maximum number of results"),
    skip: z.number().int().min(0).default(0).optional().describe("Number of results to skip")
  }),

  mittwald_project_membership_list_all: z.object({
    userId: z.string().optional().describe("Filter memberships by user ID"),
    limit: z.number().int().min(1).max(100).default(50).optional().describe("Maximum number of results"),
    skip: z.number().int().min(0).default(0).optional().describe("Number of results to skip")
  }),

  mittwald_project_membership_list: z.object({
    projectId: z.string().describe("The project ID"),
    limit: z.number().int().min(1).max(100).default(50).optional().describe("Maximum number of results"),
    skip: z.number().int().min(0).default(0).optional().describe("Number of results to skip")
  }),

  mittwald_project_membership_get_self: z.object({
    projectId: z.string().describe("The project ID")
  }),

  mittwald_project_membership_get: z.object({
    membershipId: z.string().describe("The membership ID")
  }),

  mittwald_project_membership_update: z.object({
    membershipId: z.string().describe("The membership ID"),
    role: z.enum(["owner", "member"]).optional().describe("The new role for the membership"),
    expiresAt: z.string().optional().describe("ISO 8601 datetime when the membership should expire")
  }),

  mittwald_project_membership_remove: z.object({
    membershipId: z.string().describe("The membership ID to remove")
  }),

  mittwald_project_leave: z.object({
    projectId: z.string().describe("The project ID to leave")
  }),

  mittwald_project_invite_list_all: z.object({
    limit: z.number().int().min(1).max(100).default(50).optional().describe("Maximum number of results"),
    skip: z.number().int().min(0).default(0).optional().describe("Number of results to skip")
  }),

  mittwald_project_invite_list: z.object({
    projectId: z.string().describe("The project ID"),
    limit: z.number().int().min(1).max(100).default(50).optional().describe("Maximum number of results"),
    skip: z.number().int().min(0).default(0).optional().describe("Number of results to skip")
  }),

  mittwald_project_invite_create: z.object({
    projectId: z.string().describe("The project ID"),
    mailAddress: z.string().email().describe("Email address of the person to invite"),
    role: z.enum(["owner", "member"]).describe("The role to assign to the invited member"),
    membershipExpiresAt: z.string().optional().describe("ISO 8601 datetime when the membership should expire"),
    message: z.string().optional().describe("Custom message to include in the invitation email"),
    language: z.enum(["de", "en"]).default("en").optional().describe("Language for the invitation email")
  }),

  mittwald_project_invite_get: z.object({
    inviteId: z.string().describe("The invitation ID")
  }),

  mittwald_project_invite_delete: z.object({
    inviteId: z.string().describe("The invitation ID to delete")
  }),

  mittwald_project_invite_accept: z.object({
    inviteId: z.string().describe("The invitation ID to accept")
  }),

  mittwald_project_invite_decline: z.object({
    inviteId: z.string().describe("The invitation ID to decline")
  }),

  mittwald_project_invite_resend: z.object({
    inviteId: z.string().describe("The invitation ID to resend")
  }),

  mittwald_project_token_invite_get: z.object({
    token: z.string().describe("The invitation token")
  }),

  mittwald_project_get_storage_statistics: z.object({
    projectId: z.string().describe("The project ID")
  }),

  mittwald_project_update_storage_threshold: z.object({
    projectId: z.string().describe("The project ID"),
    enabled: z.boolean().describe("Whether storage notifications are enabled"),
    thresholdPercentage: z.number().int().min(1).max(100).describe("Storage usage percentage that triggers a notification")
  }),

  mittwald_project_get_contract: z.object({
    projectId: z.string().describe("The project ID")
  }),

  mittwald_project_list_orders: z.object({
    projectId: z.string().describe("The project ID"),
    limit: z.number().int().min(1).max(100).default(50).optional().describe("Maximum number of results"),
    skip: z.number().int().min(0).default(0).optional().describe("Number of results to skip")
  }),
  
  // Mittwald Domain tools
  mittwald_domain_list: DomainListArgsSchema,
  mittwald_domain_get: DomainGetArgsSchema,
  mittwald_domain_delete: DomainDeleteArgsSchema,
  mittwald_domain_check_registrability: DomainCheckRegistrabilityArgsSchema,
  mittwald_domain_update_project: DomainUpdateProjectArgsSchema,
  mittwald_domain_update_nameservers: DomainUpdateNameserversArgsSchema,
  mittwald_domain_create_auth_code: DomainCreateAuthCodeArgsSchema,
  mittwald_domain_update_auth_code: DomainUpdateAuthCodeArgsSchema,
  mittwald_domain_resend_email: DomainResendEmailArgsSchema,
  mittwald_domain_abort_declaration: DomainAbortDeclarationArgsSchema,
  mittwald_domain_update_contact: DomainUpdateContactArgsSchema,
  mittwald_domain_get_handle_fields: DomainGetHandleFieldsArgsSchema,
  mittwald_domain_get_screenshot: DomainGetScreenshotArgsSchema,
  mittwald_domain_get_supported_tlds: DomainGetSupportedTldsArgsSchema,
  mittwald_domain_get_contract: DomainGetContractArgsSchema
=======
  // Mittwald App API schemas
  mittwald_app_list: z.object({
    limit: z.number().int().min(1).max(1000).optional().default(100).describe("Maximum number of apps to return"),
    skip: z.number().int().min(0).optional().default(0).describe("Number of apps to skip (for pagination)")
  }),

  mittwald_app_get: z.object({
    appId: z.string().uuid().describe("The UUID of the app to retrieve")
  }),

  mittwald_app_list_versions: z.object({
    appId: z.string().uuid().describe("The UUID of the app to list versions for"),
    recommended: z.boolean().optional().default(false).describe("Filter to only show recommended versions")
  }),

  mittwald_app_get_version: z.object({
    appId: z.string().uuid().describe("The UUID of the app"),
    appVersionId: z.string().uuid().describe("The UUID of the app version to retrieve")
  }),

  mittwald_app_get_version_update_candidates: z.object({
    appId: z.string().uuid().describe("The UUID of the app"),
    baseAppVersionId: z.string().uuid().describe("The UUID of the current app version to find updates for")
  }),

  // Mittwald App Installation schemas
  mittwald_app_installation_list: z.object({
    projectId: z.string().uuid().describe("The UUID of the project to list app installations for"),
    limit: z.number().int().min(1).max(1000).optional().default(100).describe("Maximum number of app installations to return"),
    skip: z.number().int().min(0).optional().default(0).describe("Number of app installations to skip (for pagination)")
  }),

  mittwald_app_installation_get: z.object({
    appInstallationId: z.string().uuid().describe("The UUID of the app installation to retrieve")
  }),

  mittwald_app_installation_create: z.object({
    appId: z.string().uuid().describe("The UUID of the app to install"),
    projectId: z.string().uuid().describe("The UUID of the project to install the app in"),
    description: z.string().min(1).describe("Human-readable description for this app installation"),
    appVersionId: z.string().uuid().optional().describe("The UUID of the specific app version to install"),
    updatePolicy: z.enum(["none", "patchLevel", "all"]).optional().default("patchLevel").describe("Automatic update policy"),
    userInputs: z.array(z.object({
      name: z.string(),
      value: z.string()
    })).optional().describe("Configuration values for app installation")
  }),

  mittwald_app_installation_update: z.object({
    appInstallationId: z.string().uuid().describe("The UUID of the app installation to update"),
    description: z.string().optional().describe("New description for the app installation"),
    appVersionId: z.string().uuid().optional().describe("The UUID of the app version to update to"),
    updatePolicy: z.enum(["none", "patchLevel", "all"]).optional().describe("New automatic update policy"),
    customDocumentRoot: z.string().optional().describe("Custom document root path"),
    userInputs: z.array(z.object({
      name: z.string(),
      value: z.string()
    })).optional().describe("Updated configuration values")
  }),

  mittwald_app_installation_delete: z.object({
    appInstallationId: z.string().uuid().describe("The UUID of the app installation to delete")
  }),

  mittwald_app_installation_action: z.object({
    appInstallationId: z.string().uuid().describe("The UUID of the app installation to perform the action on"),
    action: z.enum(["start", "stop", "restart"]).describe("The action to perform on the app installation")
  }),

  mittwald_app_installation_copy: z.object({
    appInstallationId: z.string().uuid().describe("The UUID of the app installation to copy"),
    description: z.string().min(1).describe("Description for the new copied app installation"),
    projectId: z.string().uuid().describe("The UUID of the target project to copy the installation to")
  }),

  mittwald_app_installation_get_status: z.object({
    appInstallationId: z.string().uuid().describe("The UUID of the app installation to get status for")
  }),

  mittwald_app_installation_get_missing_dependencies: z.object({
    appInstallationId: z.string().uuid().describe("The UUID of the app installation to check dependencies for")
  }),

  // Mittwald System Software schemas
  mittwald_system_software_list: z.object({
    limit: z.number().int().min(1).max(1000).optional().default(100).describe("Maximum number of system software packages to return"),
    skip: z.number().int().min(0).optional().default(0).describe("Number of system software packages to skip")
  }),

  mittwald_system_software_get: z.object({
    systemSoftwareId: z.string().uuid().describe("The UUID of the system software package to retrieve")
  }),

  mittwald_system_software_list_versions: z.object({
    systemSoftwareId: z.string().uuid().describe("The UUID of the system software to list versions for"),
    recommended: z.boolean().optional().default(false).describe("Filter to only show recommended versions")
  }),

  mittwald_system_software_get_version: z.object({
    systemSoftwareId: z.string().uuid().describe("The UUID of the system software"),
    systemSoftwareVersionId: z.string().uuid().describe("The UUID of the system software version to retrieve")
  }),

  mittwald_app_installation_get_system_software: z.object({
    appInstallationId: z.string().uuid().describe("The UUID of the app installation to get system software for")
  }),

  mittwald_app_installation_update_system_software: z.object({
    appInstallationId: z.string().uuid().describe("The UUID of the app installation to update system software for"),
    systemSoftware: z.array(z.object({
      systemSoftwareId: z.string().uuid(),
      systemSoftwareVersionId: z.string().uuid(),
      updatePolicy: z.enum(["none", "inheritedFromApp", "patchLevel", "all"])
    })).min(1).describe("List of system software to update")
  })
>>>>>>> origin/feat/api-app
};

/**
 * Type mapping of tool names to their argument types.
 * 
 * @remarks
 * This type ensures type safety when dispatching tool calls
 * to their respective handlers.
 */
type ToolArgs = {
  get_channel: GetChannelArgs;
  get_post: GetPostArgs;
  get_notifications: GetNotificationsArgs;
  search_reddit: SearchRedditArgs;
  get_comment: GetCommentArgs;
  elicitation_example: any; // Example tools use any for flexibility
  sampling_example: any;
  structured_data_example: any;
  mcp_logging: { level: 'debug' | 'info' | 'warning' | 'error'; message: string; data?: any };
  validation_example: any;
<<<<<<< HEAD
  // Mittwald Project API tools
  mittwald_project_list: MittwaldProjectListArgs;
  mittwald_project_get: MittwaldProjectGetArgs;
  mittwald_project_delete: MittwaldProjectDeleteArgs;
  mittwald_project_update_description: MittwaldProjectUpdateDescriptionArgs;
  mittwald_project_upload_avatar: MittwaldProjectUploadAvatarArgs;
  mittwald_project_delete_avatar: MittwaldProjectDeleteAvatarArgs;
  mittwald_project_get_jwt: MittwaldProjectGetJwtArgs;
  mittwald_server_list_projects: MittwaldServerListProjectsArgs;
  mittwald_project_membership_list_all: MittwaldProjectMembershipListAllArgs;
  mittwald_project_membership_list: MittwaldProjectMembershipListArgs;
  mittwald_project_membership_get_self: MittwaldProjectMembershipGetSelfArgs;
  mittwald_project_membership_get: MittwaldProjectMembershipGetArgs;
  mittwald_project_membership_update: MittwaldProjectMembershipUpdateArgs;
  mittwald_project_membership_remove: MittwaldProjectMembershipRemoveArgs;
  mittwald_project_leave: MittwaldProjectLeaveArgs;
  mittwald_project_invite_list_all: MittwaldProjectInviteListAllArgs;
  mittwald_project_invite_list: MittwaldProjectInviteListArgs;
  mittwald_project_invite_create: MittwaldProjectInviteCreateArgs;
  mittwald_project_invite_get: MittwaldProjectInviteGetArgs;
  mittwald_project_invite_delete: MittwaldProjectInviteDeleteArgs;
  mittwald_project_invite_accept: MittwaldProjectInviteAcceptArgs;
  mittwald_project_invite_decline: MittwaldProjectInviteDeclineArgs;
  mittwald_project_invite_resend: MittwaldProjectInviteResendArgs;
  mittwald_project_token_invite_get: MittwaldProjectTokenInviteGetArgs;
  mittwald_project_get_storage_statistics: MittwaldProjectGetStorageStatisticsArgs;
  mittwald_project_update_storage_threshold: MittwaldProjectUpdateStorageThresholdArgs;
  mittwald_project_get_contract: MittwaldProjectGetContractArgs;
  mittwald_project_list_orders: MittwaldProjectListOrdersArgs;
  // Mittwald Domain tools
  mittwald_domain_list: DomainListArgs;
  mittwald_domain_get: DomainGetArgs;
  mittwald_domain_delete: DomainDeleteArgs;
  mittwald_domain_check_registrability: DomainCheckRegistrabilityArgs;
  mittwald_domain_update_project: DomainUpdateProjectArgs;
  mittwald_domain_update_nameservers: DomainUpdateNameserversArgs;
  mittwald_domain_create_auth_code: DomainCreateAuthCodeArgs;
  mittwald_domain_update_auth_code: DomainUpdateAuthCodeArgs;
  mittwald_domain_resend_email: DomainResendEmailArgs;
  mittwald_domain_abort_declaration: DomainAbortDeclarationArgs;
  mittwald_domain_update_contact: DomainUpdateContactArgs;
  mittwald_domain_get_handle_fields: DomainGetHandleFieldsArgs;
  mittwald_domain_get_screenshot: DomainGetScreenshotArgs;
  mittwald_domain_get_supported_tlds: DomainGetSupportedTldsArgs;
  mittwald_domain_get_contract: DomainGetContractArgs;
=======
  // Mittwald App API tools
  mittwald_app_list: MittwaldAppListArgs;
  mittwald_app_get: MittwaldAppGetArgs;
  mittwald_app_list_versions: MittwaldAppListVersionsArgs;
  mittwald_app_get_version: MittwaldAppGetVersionArgs;
  mittwald_app_get_version_update_candidates: MittwaldAppGetVersionUpdateCandidatesArgs;
  // Mittwald App Installation tools
  mittwald_app_installation_list: MittwaldAppInstallationListArgs;
  mittwald_app_installation_get: MittwaldAppInstallationGetArgs;
  mittwald_app_installation_create: MittwaldAppInstallationCreateArgs;
  mittwald_app_installation_update: MittwaldAppInstallationUpdateArgs;
  mittwald_app_installation_delete: MittwaldAppInstallationDeleteArgs;
  mittwald_app_installation_action: MittwaldAppInstallationActionArgs;
  mittwald_app_installation_copy: MittwaldAppInstallationCopyArgs;
  mittwald_app_installation_get_status: MittwaldAppInstallationGetStatusArgs;
  mittwald_app_installation_get_missing_dependencies: MittwaldAppInstallationGetMissingDependenciesArgs;
  // Mittwald System Software tools
  mittwald_system_software_list: MittwaldSystemSoftwareListArgs;
  mittwald_system_software_get: MittwaldSystemSoftwareGetArgs;
  mittwald_system_software_list_versions: MittwaldSystemSoftwareListVersionsArgs;
  mittwald_system_software_get_version: MittwaldSystemSoftwareGetVersionArgs;
  mittwald_app_installation_get_system_software: MittwaldAppInstallationGetSystemSoftwareArgs;
  mittwald_app_installation_update_system_software: MittwaldAppInstallationUpdateSystemSoftwareArgs;
>>>>>>> origin/feat/api-app
};

/**
 * Handles MCP tool listing requests.
 * 
 * @remarks
 * Returns all available tools sorted alphabetically by name.
 * This allows MCP clients to discover what tools are available
 * for interacting with Reddit.
 * 
 * @param _request - The tool listing request (currently unused)
 * @returns Promise resolving to the list of available tools
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools#listing-tools | Listing Tools}
 */
export async function handleListTools(_request: ListToolsRequest): Promise<ListToolsResult> {
  try {
    logger.info(`🔧 handleListTools called, TOOLS.length: ${TOOLS.length}`);
    const tools = [...TOOLS].sort((a, b) => a.name.localeCompare(b.name));
    logger.info(`✅ Returning ${tools.length} tools: ${tools.map(t => t.name).join(', ')}`);
    return { tools };
  } catch (error) {
    logger.error("Failed to list tools", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { tools: TOOLS };
  }
}

/**
 * Zod schema for validating Reddit credentials from AuthInfo.extra
 */
const RedditCredentialsSchema = z.object({
  redditAccessToken: z.string().min(1, "Reddit access token is required"),
  redditRefreshToken: z.string().min(1, "Reddit refresh token is required"),
  userId: z.string().min(1, "User ID is required"),
});

/**
 * Reddit authentication credentials structure.
 * 
 * @remarks
 * Contains the OAuth tokens and user ID needed to authenticate
 * requests to the Reddit API.
 */
interface RedditCredentials {
  /** OAuth2 access token for API requests */
  accessToken: string;
  /** OAuth2 refresh token for renewing access */
  refreshToken: string;
  /** Reddit user ID */
  userId: string;
}

/**
 * Extracts and validates Reddit credentials from AuthInfo.
 * 
 * @remarks
 * This function ensures that all required authentication data
 * is present before attempting to make Reddit API calls.
 * 
 * @param authInfo - Authentication information from the MCP context
 * @returns Validated Reddit credentials
 * @throws Error if required credentials are missing or invalid
 */
function extractAndValidateCredentials(authInfo: RedditAuthInfo): RedditCredentials {
  if (!authInfo.extra) {
    throw new Error("Authentication failed: Missing auth info");
  }

  try {
    const validated = RedditCredentialsSchema.parse(authInfo.extra);
    return {
      accessToken: validated.redditAccessToken,
      refreshToken: validated.redditRefreshToken,
      userId: validated.userId,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      logger.error("Reddit credentials validation failed", {
        errors: error.errors,
        authInfo: authInfo.extra,
      });
      throw new Error(`Authentication failed: ${errorMessages}`);
    }
    throw error;
  }
}

/**
 * Handles MCP tool invocation requests.
 * 
 * @remarks
 * This is the main dispatcher for tool calls. It:
 * 1. Validates the requested tool exists
 * 2. Extracts and validates authentication credentials
 * 3. Validates tool arguments against the tool's input schema
 * 4. Creates a Reddit service instance
 * 5. Dispatches to the appropriate tool handler
 * 6. Returns the tool result or error
 * 
 * Tools that require content generation (like create_post) will trigger
 * the sampling feature and return an async processing message.
 * 
 * @param request - The tool invocation request containing tool name and arguments
 * @param context - MCP context containing authentication and session information
 * @returns Promise resolving to the tool execution result
 * @throws Error if tool is unknown, auth fails, or execution fails
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools#calling-tools | Calling Tools}
 */
export async function handleToolCall(
  request: CallToolRequest,
  context: MCPToolContext,
): Promise<CallToolResult> {
  
  try {
    logger.info(`🔧 handleToolCall called for tool: ${request.params.name}`);
    
    // Check if this is a Mittwald tool (skip Reddit auth)
    const isMittwaldTool = request.params.name.startsWith('mittwald_');
    
    let handlerContext: ToolHandlerContext;
    
    if (isMittwaldTool) {
      // For Mittwald tools, create a minimal context without Reddit service
      handlerContext = {
        redditService: null as any, // Not used for Mittwald tools
        userId: 'mittwald-user',
        sessionId: context.sessionId,
        progressToken: request.params._meta?.progressToken,
      };
    } else {
      // Extract and validate Reddit credentials from AuthInfo for Reddit tools
      const credentials = extractAndValidateCredentials(context.authInfo);

      // Create Reddit service with validated tokens
      const redditService = new RedditService({
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
        username: credentials.userId, // Pass the Reddit username from OAuth
      });

<<<<<<< HEAD
      handlerContext = {
        redditService,
        userId: credentials.userId,
        sessionId: context.sessionId,
        progressToken: request.params._meta?.progressToken,
      };
    }

    // Create Mittwald service for Mittwald tools
    const mittwaldClient = getMittwaldClient();
    const mittwaldHandlerContext: MittwaldToolHandlerContext = {
      mittwaldClient,
      userId: credentials.userId,
      sessionId: context.sessionId,
      progressToken: request.params._meta?.progressToken,
    };

    // Create Mittwald client context for Mittwald tools
    const mittwaldClient = getMittwaldClient(CONFIG.MITTWALD_API_TOKEN);
    const mittwaldHandlerContext: MittwaldToolHandlerContext = {
      mittwaldClient,
=======
    const handlerContext: ToolHandlerContext = {
      redditService,
      mittwaldClient: getMittwaldClient(),
>>>>>>> origin/feat/api-app
      userId: credentials.userId,
      sessionId: context.sessionId,
      progressToken: request.params._meta?.progressToken,
    };

    if (!request.params.arguments) {
      logger.error("Tool call missing required arguments", { toolName: request.params?.name });
      throw new Error("Arguments are required");
    }

    const tool = TOOLS.find((t) => t.name === request.params.name);
    if (!tool) {
      logger.error("Unknown tool requested", { toolName: request.params.name });
      throw new Error(`${TOOL_ERROR_MESSAGES.UNKNOWN_TOOL} ${request.params.name}`);
    }


    // Validate arguments using Zod schema
    const toolName = request.params.name as keyof typeof ToolSchemas;
    const schema = ToolSchemas[toolName];
    
    if (!schema) {
      logger.error("No Zod schema found for tool", { toolName });
      throw new Error(`No validation schema found for tool: ${toolName}`);
    }
    
    let args: ToolArgs[keyof ToolArgs];
    try {
      const validatedArgs = schema.parse(request.params.arguments);
      args = validatedArgs as ToolArgs[keyof ToolArgs];
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error("Tool argument validation failed", { 
          toolName, 
          errors: error.errors,
          arguments: request.params.arguments 
        });
        throw new Error(`Invalid arguments for tool ${toolName}: ${JSON.stringify(error.errors)}`);
      }
      throw error;
    }


    let result: CallToolResult;

    switch (request.params.name) {
      case "get_channel":
        result = await handleGetChannel(args as GetChannelArgs, handlerContext);
        break;
      case "get_post":
        result = await handleGetPost(args as GetPostArgs, handlerContext);
        break;
      case "get_notifications":
        result = await handleGetNotifications(args as GetNotificationsArgs, handlerContext);
        break;
      case "get_comment":
        result = await handleGetComment(args as GetCommentArgs, handlerContext);
        break;
      case "search_reddit":
        result = await handleSearchReddit(args as SearchRedditArgs, handlerContext);
        break;
      case "elicitation_example":
        result = await handleElicitationExample(args, context);
        break;
      case "sampling_example":
        result = await handleSamplingExample(args, context);
        break;
      case "structured_data_example":
        result = await handleStructuredDataExample(args, context);
        break;
      case "mcp_logging":
        result = await handleLogging(args, handlerContext);
        break;
      case "validation_example":
        result = await handleValidationExample(args, handlerContext);
        break;
<<<<<<< HEAD
        
      // Mittwald User API tools
      case "mittwald_user_authenticate":
        result = await handleAuthenticate(args);
        break;
      case "mittwald_user_get_profile":
        result = await handleGetProfile();
        break;
      case "mittwald_user_get_email":
        result = await handleGetEmail();
        break;
      case "mittwald_user_change_email":
        result = await handleChangeEmail(args);
        break;
      case "mittwald_user_change_password":
        result = await handleChangePassword(args);
        break;
      case "mittwald_user_list_sessions":
        result = await handleListSessions();
        break;
      case "mittwald_user_list_api_tokens":
        result = await handleListApiTokens();
        break;
      case "mittwald_user_create_api_token":
        result = await handleCreateApiToken(args);
        break;
        
      // Handle other Mittwald tools with unified handler
      case "mittwald_user_list_ssh_keys":
      case "mittwald_user_create_ssh_key":
      case "mittwald_user_get_mfa_status":
      case "mittwald_user_create_feedback":
        result = await handleMittwaldUserTool(request.params.name, args);
        break;
      
      // Mittwald Project API cases
      case "mittwald_project_list":
        result = await handleProjectList(args as MittwaldProjectListArgs);
        break;
      case "mittwald_project_get":
        result = await handleProjectGet(args as MittwaldProjectGetArgs);
        break;
      case "mittwald_project_delete":
        result = await handleProjectDelete(args as MittwaldProjectDeleteArgs);
        break;
      case "mittwald_project_update_description":
        result = await handleProjectUpdateDescription(args as MittwaldProjectUpdateDescriptionArgs);
        break;
      case "mittwald_project_upload_avatar":
        result = await handleProjectUploadAvatar(args as MittwaldProjectUploadAvatarArgs);
        break;
      case "mittwald_project_delete_avatar":
        result = await handleProjectDeleteAvatar(args as MittwaldProjectDeleteAvatarArgs);
        break;
      case "mittwald_project_get_jwt":
        result = await handleProjectGetJwt(args as MittwaldProjectGetJwtArgs);
        break;
      case "mittwald_server_list_projects":
        result = await handleServerListProjects(args as MittwaldServerListProjectsArgs);
        break;
      case "mittwald_project_membership_list_all":
        result = await handleProjectMembershipListAll(args as MittwaldProjectMembershipListAllArgs);
        break;
      case "mittwald_project_membership_list":
        result = await handleProjectMembershipList(args as MittwaldProjectMembershipListArgs);
        break;
      case "mittwald_project_membership_get_self":
        result = await handleProjectMembershipGetSelf(args as MittwaldProjectMembershipGetSelfArgs);
        break;
      case "mittwald_project_membership_get":
        result = await handleProjectMembershipGet(args as MittwaldProjectMembershipGetArgs);
        break;
      case "mittwald_project_membership_update":
        result = await handleProjectMembershipUpdate(args as MittwaldProjectMembershipUpdateArgs);
        break;
      case "mittwald_project_membership_remove":
        result = await handleProjectMembershipRemove(args as MittwaldProjectMembershipRemoveArgs);
        break;
      case "mittwald_project_leave":
        result = await handleProjectLeave(args as MittwaldProjectLeaveArgs);
        break;
      case "mittwald_project_invite_list_all":
        result = await handleProjectInviteListAll(args as MittwaldProjectInviteListAllArgs);
        break;
      case "mittwald_project_invite_list":
        result = await handleProjectInviteList(args as MittwaldProjectInviteListArgs);
        break;
      case "mittwald_project_invite_create":
        result = await handleProjectInviteCreate(args as MittwaldProjectInviteCreateArgs);
        break;
      case "mittwald_project_invite_get":
        result = await handleProjectInviteGet(args as MittwaldProjectInviteGetArgs);
        break;
      case "mittwald_project_invite_delete":
        result = await handleProjectInviteDelete(args as MittwaldProjectInviteDeleteArgs);
        break;
      case "mittwald_project_invite_accept":
        result = await handleProjectInviteAccept(args as MittwaldProjectInviteAcceptArgs);
        break;
      case "mittwald_project_invite_decline":
        result = await handleProjectInviteDecline(args as MittwaldProjectInviteDeclineArgs);
        break;
      case "mittwald_project_invite_resend":
        result = await handleProjectInviteResend(args as MittwaldProjectInviteResendArgs);
        break;
      case "mittwald_project_token_invite_get":
        result = await handleProjectTokenInviteGet(args as MittwaldProjectTokenInviteGetArgs);
        break;
      case "mittwald_project_get_storage_statistics":
        result = await handleProjectGetStorageStatistics(args as MittwaldProjectGetStorageStatisticsArgs);
        break;
      case "mittwald_project_update_storage_threshold":
        result = await handleProjectUpdateStorageThreshold(args as MittwaldProjectUpdateStorageThresholdArgs);
        break;
      case "mittwald_project_get_contract":
        result = await handleProjectGetContract(args as MittwaldProjectGetContractArgs);
        break;
      case "mittwald_project_list_orders":
        result = await handleProjectListOrders(args as MittwaldProjectListOrdersArgs);
        break;
      
      // Mittwald Domain tools
      case "mittwald_domain_list":
        result = await handleDomainList(args as DomainListArgs, handlerContext);
        break;
      case "mittwald_domain_get":
        result = await handleDomainGet(args as DomainGetArgs, handlerContext);
        break;
      case "mittwald_domain_delete":
        result = await handleDomainDelete(args as DomainDeleteArgs, handlerContext);
        break;
      case "mittwald_domain_check_registrability":
        result = await handleDomainCheckRegistrability(args as DomainCheckRegistrabilityArgs, handlerContext);
        break;
      case "mittwald_domain_update_project":
        result = await handleDomainUpdateProject(args as DomainUpdateProjectArgs, handlerContext);
        break;
      case "mittwald_domain_update_nameservers":
        result = await handleDomainUpdateNameservers(args as DomainUpdateNameserversArgs, handlerContext);
        break;
      case "mittwald_domain_create_auth_code":
        result = await handleDomainCreateAuthCode(args as DomainCreateAuthCodeArgs, handlerContext);
        break;
      case "mittwald_domain_update_auth_code":
        result = await handleDomainUpdateAuthCode(args as DomainUpdateAuthCodeArgs, handlerContext);
        break;
      case "mittwald_domain_resend_email":
        result = await handleDomainResendEmail(args as DomainResendEmailArgs, handlerContext);
        break;
      case "mittwald_domain_abort_declaration":
        result = await handleDomainAbortDeclaration(args as DomainAbortDeclarationArgs, handlerContext);
        break;
      case "mittwald_domain_update_contact":
        result = await handleDomainUpdateContact(args as DomainUpdateContactArgs, handlerContext);
        break;
      case "mittwald_domain_get_handle_fields":
        result = await handleDomainGetHandleFields(args as DomainGetHandleFieldsArgs, handlerContext);
        break;
      case "mittwald_domain_get_screenshot":
        result = await handleDomainGetScreenshot(args as DomainGetScreenshotArgs, handlerContext);
        break;
      case "mittwald_domain_get_supported_tlds":
        result = await handleDomainGetSupportedTlds(args as DomainGetSupportedTldsArgs, handlerContext);
        break;
      case "mittwald_domain_get_contract":
        result = await handleDomainGetContract(args as DomainGetContractArgs, handlerContext);
        break;
=======
      
      // Mittwald App API tools
      case "mittwald_app_list":
        result = await handleMittwaldAppList(args as MittwaldAppListArgs, handlerContext);
        break;
      case "mittwald_app_get":
        result = await handleMittwaldAppGet(args as MittwaldAppGetArgs, handlerContext);
        break;
      case "mittwald_app_list_versions":
        result = await handleMittwaldAppListVersions(args as MittwaldAppListVersionsArgs, handlerContext);
        break;
      case "mittwald_app_get_version":
        result = await handleMittwaldAppGetVersion(args as MittwaldAppGetVersionArgs, handlerContext);
        break;
      case "mittwald_app_get_version_update_candidates":
        result = await handleMittwaldAppGetVersionUpdateCandidates(args as MittwaldAppGetVersionUpdateCandidatesArgs, handlerContext);
        break;
      
      // Mittwald App Installation tools
      case "mittwald_app_installation_list":
        result = await handleMittwaldAppInstallationList(args as MittwaldAppInstallationListArgs, handlerContext);
        break;
      case "mittwald_app_installation_get":
        result = await handleMittwaldAppInstallationGet(args as MittwaldAppInstallationGetArgs, handlerContext);
        break;
      case "mittwald_app_installation_create":
        result = await handleMittwaldAppInstallationCreate(args as MittwaldAppInstallationCreateArgs, handlerContext);
        break;
      case "mittwald_app_installation_update":
        result = await handleMittwaldAppInstallationUpdate(args as MittwaldAppInstallationUpdateArgs, handlerContext);
        break;
      case "mittwald_app_installation_delete":
        result = await handleMittwaldAppInstallationDelete(args as MittwaldAppInstallationDeleteArgs, handlerContext);
        break;
      case "mittwald_app_installation_action":
        result = await handleMittwaldAppInstallationAction(args as MittwaldAppInstallationActionArgs, handlerContext);
        break;
      case "mittwald_app_installation_copy":
        result = await handleMittwaldAppInstallationCopy(args as MittwaldAppInstallationCopyArgs, handlerContext);
        break;
      case "mittwald_app_installation_get_status":
        result = await handleMittwaldAppInstallationGetStatus(args as MittwaldAppInstallationGetStatusArgs, handlerContext);
        break;
      case "mittwald_app_installation_get_missing_dependencies":
        result = await handleMittwaldAppInstallationGetMissingDependencies(args as MittwaldAppInstallationGetMissingDependenciesArgs, handlerContext);
        break;
      
      // Mittwald System Software tools
      case "mittwald_system_software_list":
        result = await handleMittwaldSystemSoftwareList(args as MittwaldSystemSoftwareListArgs, handlerContext);
        break;
      case "mittwald_system_software_get":
        result = await handleMittwaldSystemSoftwareGet(args as MittwaldSystemSoftwareGetArgs, handlerContext);
        break;
      case "mittwald_system_software_list_versions":
        result = await handleMittwaldSystemSoftwareListVersions(args as MittwaldSystemSoftwareListVersionsArgs, handlerContext);
        break;
      case "mittwald_system_software_get_version":
        result = await handleMittwaldSystemSoftwareGetVersion(args as MittwaldSystemSoftwareGetVersionArgs, handlerContext);
        break;
      case "mittwald_app_installation_get_system_software":
        result = await handleMittwaldAppInstallationGetSystemSoftware(args as MittwaldAppInstallationGetSystemSoftwareArgs, handlerContext);
        break;
      case "mittwald_app_installation_update_system_software":
        result = await handleMittwaldAppInstallationUpdateSystemSoftware(args as MittwaldAppInstallationUpdateSystemSoftwareArgs, handlerContext);
        break;
      
>>>>>>> origin/feat/api-app
      default:
        logger.error("Unsupported tool in switch statement", { toolName: request.params.name });
        throw new Error(`${TOOL_ERROR_MESSAGES.UNKNOWN_TOOL} ${request.params.name}`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error("Tool call failed", {
      toolName: request.params?.name,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Re-throw the error to be handled by MCP framework
    throw error;
  }
}
