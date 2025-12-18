import { AppInstaller } from "../lib/resources/app/Installer.js";

export const wordpressInstaller = new AppInstaller(
  "da3aa3ae-4b6b-4398-a4a8-ee8def827876",
  "WordPress",
  [
    "version",
    "host",
    "admin-user",
    "admin-email",
    "admin-pass",
    "site-title",
  ] as const,
);
