export * from './types.js';
export * from './elicitation-example.js';
export * from './logging.js';

export type {
  ToolHandler,
  ToolHandlerContext,
} from './types.js';

export { handleElicitationExample } from './elicitation-example.js';
export { handleLogging } from './logging.js';

// Agent-18 project handlers
export { handleProjectCreate } from './mittwald-cli/project/create.js';
export { handleProjectDelete } from './mittwald-cli/project/delete.js';
export { handleProjectGet } from './mittwald-cli/project/get.js';
export { handleProjectFilesystemUsage } from './mittwald-cli/project/filesystem-usage.js';
export { handleProjectInviteGet } from './mittwald-cli/project/invite-get.js';

// Agent 3 app install handlers
export { handleAppInstallJoomla } from './mittwald-cli/app/install/joomla.js';
export { handleAppInstallMatomo } from './mittwald-cli/app/install/matomo.js';
export { handleAppInstallNextcloud } from './mittwald-cli/app/install/nextcloud.js';
export { handleAppInstallShopware5 } from './mittwald-cli/app/install/shopware5.js';
export { handleAppInstallShopware6 } from './mittwald-cli/app/install/shopware6.js';
export { handleAppInstallTypo3 } from './mittwald-cli/app/install/typo3.js';
export { handleAppInstallWordpress } from './mittwald-cli/app/install/wordpress.js';

// Agent 14 domain handlers
export { handleDomainVirtualhostList } from './mittwald-cli/domain/virtualhost-list.js';

// Agent 14 extension handlers
export { handleExtension } from './mittwald-cli/extension/extension.js';
export { handleExtensionInstall } from './mittwald-cli/extension/install.js';
export { handleExtensionList } from './mittwald-cli/extension/list.js';
export { handleExtensionListInstalled } from './mittwald-cli/extension/list-installed.js';
export { handleExtensionUninstall } from './mittwald-cli/extension/uninstall.js';