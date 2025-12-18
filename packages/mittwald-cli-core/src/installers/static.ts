import { AppInstaller } from "../lib/resources/app/Installer.js";

export const staticInstaller = new AppInstaller(
  "d20baefd-81d2-42aa-bfba-9a3220ae839b",
  "custom static site",
  ["document-root", "site-title"] as const,
);
