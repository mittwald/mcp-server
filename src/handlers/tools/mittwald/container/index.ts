/**
 * Container API handlers index
 * 
 * @module handlers/tools/mittwald/container
 */

// Export all registry management handlers
export {
  handleCreateRegistry,
  handleListRegistries,
  handleGetRegistry,
  handleUpdateRegistry,
  handleDeleteRegistry,
  handleValidateRegistryUri,
  handleValidateRegistryCredentials,
} from './registry-management.js';

// Export all stack management handlers
export {
  handleListStacks,
  handleGetStack,
  handleUpdateStack,
  handleDeclareStack,
} from './stack-management.js';

// Export all service management handlers
export {
  handleListServices,
  handleGetService,
  handleGetServiceLogs,
  handleStartService,
  handleStopService,
  handleRestartService,
  handleRecreateService,
  handlePullImageForService,
} from './service-management.js';

// Export all volume and config management handlers
export {
  handleListVolumes,
  handleGetVolume,
  handleDeleteVolume,
  handleGetContainerImageConfig,
} from './volume-config-management.js';