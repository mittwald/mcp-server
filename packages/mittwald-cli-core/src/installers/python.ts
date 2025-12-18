import { AppInstaller } from "../lib/resources/app/Installer.js";

export const pythonInstaller = new AppInstaller(
  "be57d166-dae9-4480-bae2-da3f3c6f0a2e",
  "custom python site",
  ["site-title", "entrypoint"] as const,
);
