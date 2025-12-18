import { AppInstaller } from "../lib/resources/app/Installer.js";

export const phpInstaller = new AppInstaller(
  "34220303-cb87-4592-8a95-2eb20a97b2ac",
  "custom PHP",
  ["document-root", "site-title"] as const,
);
