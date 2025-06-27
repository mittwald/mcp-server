/**
 * @file Mittwald MCP tool handlers aggregation
 * @module handlers/tools/mittwald
 * 
 * @remarks
 * This module exports all Mittwald MCP tool handlers for cronjob, filesystem, and file operations.
 */

// Cronjob handlers
export {
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
  type MittwaldCronjobAbortExecutionArgs
} from './cronjob/index.js';

// Filesystem handlers
export {
  handleMittwaldFilesystemListDirectories,
  handleMittwaldFilesystemGetDiskUsage,
  handleMittwaldFilesystemGetFileContent,
  handleMittwaldFilesystemGetJWT,
  handleMittwaldFilesystemListFiles,
  type MittwaldFilesystemListDirectoriesArgs,
  type MittwaldFilesystemGetDiskUsageArgs,
  type MittwaldFilesystemGetFileContentArgs,
  type MittwaldFilesystemGetJWTArgs,
  type MittwaldFilesystemListFilesArgs
} from './filesystem/index.js';

// File handlers
export {
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
} from './file/index.js';