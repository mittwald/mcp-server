import { AppInstaller } from "../lib/resources/app/Installer.js";

export const typo3Installer = new AppInstaller(
  "352971cc-b96a-4a26-8651-b08d7c8a7357",
  "TYPO3",
  [
    "version",
    "host",
    "admin-user",
    "admin-email",
    "admin-pass",
    "site-title",
    "install-mode",
  ] as const,
);
