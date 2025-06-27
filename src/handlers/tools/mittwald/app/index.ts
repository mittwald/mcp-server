/**
 * Export all App API tool handlers
 * 
 * @module
 * This module exports all handler functions for the Mittwald App API tools
 */

// App management handlers
export {
  handleMittwaldAppList,
  handleMittwaldAppGet,
  type MittwaldAppListArgs,
  type MittwaldAppGetArgs
} from './app-management.js';

// App version handlers
export {
  handleMittwaldAppListVersions,
  handleMittwaldAppGetVersion,
  handleMittwaldAppGetVersionUpdateCandidates,
  type MittwaldAppListVersionsArgs,
  type MittwaldAppGetVersionArgs,
  type MittwaldAppGetVersionUpdateCandidatesArgs
} from './app-versions.js';

// App installation handlers
export {
  handleMittwaldAppInstallationList,
  handleMittwaldAppInstallationGet,
  handleMittwaldAppInstallationCreate,
  handleMittwaldAppInstallationUpdate,
  handleMittwaldAppInstallationDelete,
  type MittwaldAppInstallationListArgs,
  type MittwaldAppInstallationGetArgs,
  type MittwaldAppInstallationCreateArgs,
  type MittwaldAppInstallationUpdateArgs,
  type MittwaldAppInstallationDeleteArgs
} from './app-installations.js';

// App installation action handlers
export {
  handleMittwaldAppInstallationAction,
  handleMittwaldAppInstallationCopy,
  handleMittwaldAppInstallationGetStatus,
  handleMittwaldAppInstallationGetMissingDependencies,
  type MittwaldAppInstallationActionArgs,
  type MittwaldAppInstallationCopyArgs,
  type MittwaldAppInstallationGetStatusArgs,
  type MittwaldAppInstallationGetMissingDependenciesArgs
} from './app-actions.js';

// System software handlers
export {
  handleMittwaldSystemSoftwareList,
  handleMittwaldSystemSoftwareGet,
  handleMittwaldSystemSoftwareListVersions,
  handleMittwaldSystemSoftwareGetVersion,
  handleMittwaldAppInstallationGetSystemSoftware,
  handleMittwaldAppInstallationUpdateSystemSoftware,
  type MittwaldSystemSoftwareListArgs,
  type MittwaldSystemSoftwareGetArgs,
  type MittwaldSystemSoftwareListVersionsArgs,
  type MittwaldSystemSoftwareGetVersionArgs,
  type MittwaldAppInstallationGetSystemSoftwareArgs,
  type MittwaldAppInstallationUpdateSystemSoftwareArgs
} from './system-software.js';