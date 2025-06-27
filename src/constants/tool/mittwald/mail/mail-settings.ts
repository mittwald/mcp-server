import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mail_list_project_mail_settings: Tool = {
  name: "mail_list_project_mail_settings",
  description: "List mail settings for a project",
  inputSchema: {
    type: "object",
    required: ["projectId"],
    properties: {
      projectId: {
        type: "string",
        description: "The project ID to get mail settings for",
      },
    },
  },
  _meta: {
    title: "List Project Mail Settings",
    hidden: false,
    type: "server",
  },
};

export const mail_update_project_mail_setting: Tool = {
  name: "mail_update_project_mail_setting",
  description: "Update a specific mail setting for a project",
  inputSchema: {
    type: "object",
    required: ["projectId", "mailSetting", "value"],
    properties: {
      projectId: {
        type: "string",
        description: "The project ID to update mail settings for",
      },
      mailSetting: {
        type: "string",
        enum: ["blacklist", "whitelist"],
        description: "The mail setting to update",
      },
      value: {
        type: "array",
        items: {
          type: "string",
        },
        description: "List of email addresses or domains for the setting",
      },
    },
  },
  _meta: {
    title: "Update Project Mail Setting",
    hidden: false,
    type: "server",
  },
};

// Success messages for handlers
export const mailSettingsSuccessMessages = {
  list: "Successfully retrieved project mail settings",
  update: "Successfully updated project mail setting",
};