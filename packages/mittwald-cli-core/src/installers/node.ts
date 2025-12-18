import { AppInstaller } from "../lib/resources/app/Installer.js";

export const nodeInstaller = new AppInstaller(
  "3e7f920b-a711-4d2f-9871-661e1b41a2f0",
  "custom Node.js",
  ["site-title", "entrypoint"] as const,
);

nodeInstaller.mutateFlags = (flags) => {
  (flags["entrypoint"].default as unknown) = "yarn start";
};
