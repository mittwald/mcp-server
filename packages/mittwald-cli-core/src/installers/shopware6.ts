import { AppInstaller } from "../lib/resources/app/Installer.js";

export const shopware6Installer = new AppInstaller(
  "12d54d05-7e55-4cf3-90c4-093516e0eaf8",
  "Shopware 6",
  [
    "version",
    "host",
    "admin-user",
    "admin-email",
    "admin-pass",
    "admin-firstname",
    "admin-lastname",
    "site-title",
    "shop-email",
    "shop-lang",
    "shop-currency",
  ] as const,
);
