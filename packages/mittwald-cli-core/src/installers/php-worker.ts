import { AppInstaller } from "../lib/resources/app/Installer.js";

export const phpWorkerInstaller = new AppInstaller(
  "fcac178a-e606-4460-a5fd-b3ad0ae7a3cc",
  "PHP worker",
  ["entrypoint", "site-title"] as const,
);
