import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import globals from "globals";

import noCredentialLeakRule from "./eslint-rules/no-credential-leak.js";

export default [
  eslint.configs.recommended,
  {
    ignores: [
      "build/**/*",
      "node_modules/**/*",
      "coverage/**/*",
      "tests/test-connection-logging.js",
      "tests/test-mcp-client.cjs",
      "tests/test-ssl-trust.cjs",
      "jest.setup.ts",
    ],
  },
  {
    files: ["**/*.js", "**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        ...globals.jest,
        process: true,
        console: true,
        Buffer: true,
        fetch: true,
        Headers: true,
        Blob: true,
        setImmediate: true,
        RequestInfo: true,
        RequestInit: true,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      local: {
        rules: {
          "no-credential-leak": noCredentialLeakRule,
        },
      },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-namespace": [
        "error",
        {
          allowDeclarations: true,
        },
      ],
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: [
                "**/utils/cli-wrapper",
                "**/utils/cli-wrapper.js",
              ],
              message:
                "Route CLI calls through the shared adapter instead of importing cli-wrapper directly.",
            },
          ],
        },
      ],
      "no-console": "off",
      "no-undef": "off",
      "no-dupe-keys": "off",
    },
  },
  {
    files: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/__tests__/**/*.ts",
      "**/__mocks__/**/*.ts",
      "scripts/**/*",
      "src/handlers/**/*",
      "src/services/**/*",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
      "local/no-credential-leak": "off",
    },
  },
  {
    files: ["src/handlers/tools/**/*.{ts,js}", "src/handlers/**/*-cli.ts"],
    rules: {
      "local/no-credential-leak": "error",
    },
  },
];
