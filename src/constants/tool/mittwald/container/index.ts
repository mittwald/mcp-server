/**
 * Container API tool definitions index
 * 
 * @module constants/tool/mittwald/container
 */

// Export all registry management tools
export {
  mittwald_container_create_registry,
  mittwald_container_list_registries,
  mittwald_container_get_registry,
  mittwald_container_update_registry,
  mittwald_container_delete_registry,
  mittwald_container_validate_registry_uri,
  mittwald_container_validate_registry_credentials,
} from './registry-management.js';

// Export all stack management tools
export {
  mittwald_container_list_stacks,
  mittwald_container_get_stack,
  mittwald_container_update_stack,
  mittwald_container_declare_stack,
} from './stack-management.js';

// Export all service management tools
export {
  mittwald_container_list_services,
  mittwald_container_get_service,
  mittwald_container_get_service_logs,
  mittwald_container_start_service,
  mittwald_container_stop_service,
  mittwald_container_restart_service,
  mittwald_container_recreate_service,
  mittwald_container_pull_image_for_service,
} from './service-management.js';

// Export all volume and config management tools
export {
  mittwald_container_list_volumes,
  mittwald_container_get_volume,
  mittwald_container_delete_volume,
  mittwald_container_get_container_image_config,
} from './volume-config-management.js';

// Export success messages
export const containerToolSuccessMessages = {
  // Registry messages
  createRegistry: "Successfully created container registry",
  listRegistries: "Successfully retrieved container registries",
  getRegistry: "Successfully retrieved container registry details",
  updateRegistry: "Successfully updated container registry",
  deleteRegistry: "Successfully deleted container registry",
  validateRegistryUri: "Registry URI validation complete",
  validateRegistryCredentials: "Registry credentials validation complete",
  
  // Stack messages
  listStacks: "Successfully retrieved container stacks",
  getStack: "Successfully retrieved container stack details",
  updateStack: "Successfully updated container stack",
  declareStack: "Successfully declared container stack state",
  
  // Service messages
  listServices: "Successfully retrieved container services",
  getService: "Successfully retrieved container service details",
  getServiceLogs: "Successfully retrieved service logs",
  startService: "Successfully started container service",
  stopService: "Successfully stopped container service",
  restartService: "Successfully restarted container service",
  recreateService: "Successfully recreated container service",
  pullImageForService: "Successfully pulled image and recreated service",
  
  // Volume messages
  listVolumes: "Successfully retrieved container volumes",
  getVolume: "Successfully retrieved container volume details",
  deleteVolume: "Successfully deleted container volume",
  getContainerImageConfig: "Successfully retrieved container image configuration",
};