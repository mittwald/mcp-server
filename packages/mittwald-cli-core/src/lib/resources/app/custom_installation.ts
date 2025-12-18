import { phpInstaller } from "../../../installers/php.js";
import { nodeInstaller } from "../../../installers/node.js";
import { pythonInstaller } from "../../../installers/python.js";

/**
 * Tests if an app installation is for a custom app (for example, a custom PHP
 * or Node.js app). These are treated differently in the UI.
 *
 * @param appId
 */
export function isCustomAppInstallation(appId: string): boolean {
  return [
    phpInstaller.appId,
    nodeInstaller.appId,
    pythonInstaller.appId,
  ].includes(appId);
}
