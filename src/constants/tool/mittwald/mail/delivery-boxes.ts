import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mail_list_delivery_boxes: Tool = {
  name: "mail_list_delivery_boxes",
  description: "List all delivery boxes for a project",
  inputSchema: {
    type: "object",
    required: ["projectId"],
    properties: {
      projectId: {
        type: "string",
        description: "The project ID to list delivery boxes for",
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 100,
        default: 50,
        description: "Maximum number of results to return",
      },
      skip: {
        type: "integer",
        minimum: 0,
        default: 0,
        description: "Number of results to skip for pagination",
      },
    },
  },
  _meta: {
    title: "List Delivery Boxes",
    hidden: false,
    type: "server",
  },
};

export const mail_create_delivery_box: Tool = {
  name: "mail_create_delivery_box",
  description: "Create a new delivery box for a project",
  inputSchema: {
    type: "object",
    required: ["projectId", "description", "password"],
    properties: {
      projectId: {
        type: "string",
        description: "The project ID to create the delivery box in",
      },
      description: {
        type: "string",
        description: "Description of the delivery box",
      },
      password: {
        type: "string",
        description: "Password for the delivery box",
      },
    },
  },
  _meta: {
    title: "Create Delivery Box",
    hidden: false,
    type: "server",
  },
};

export const mail_get_delivery_box: Tool = {
  name: "mail_get_delivery_box",
  description: "Get details of a specific delivery box",
  inputSchema: {
    type: "object",
    required: ["deliveryBoxId"],
    properties: {
      deliveryBoxId: {
        type: "string",
        description: "The delivery box ID",
      },
    },
  },
  _meta: {
    title: "Get Delivery Box",
    hidden: false,
    type: "server",
  },
};

export const mail_delete_delivery_box: Tool = {
  name: "mail_delete_delivery_box",
  description: "Delete a delivery box",
  inputSchema: {
    type: "object",
    required: ["deliveryBoxId"],
    properties: {
      deliveryBoxId: {
        type: "string",
        description: "The delivery box ID to delete",
      },
    },
  },
  _meta: {
    title: "Delete Delivery Box",
    hidden: false,
    type: "server",
  },
};

export const mail_update_delivery_box_description: Tool = {
  name: "mail_update_delivery_box_description",
  description: "Update the description of a delivery box",
  inputSchema: {
    type: "object",
    required: ["deliveryBoxId", "description"],
    properties: {
      deliveryBoxId: {
        type: "string",
        description: "The delivery box ID to update",
      },
      description: {
        type: "string",
        description: "The new description",
      },
    },
  },
  _meta: {
    title: "Update Delivery Box Description",
    hidden: false,
    type: "server",
  },
};

export const mail_update_delivery_box_password: Tool = {
  name: "mail_update_delivery_box_password",
  description: "Update the password of a delivery box",
  inputSchema: {
    type: "object",
    required: ["deliveryBoxId", "password"],
    properties: {
      deliveryBoxId: {
        type: "string",
        description: "The delivery box ID to update",
      },
      password: {
        type: "string",
        description: "The new password",
      },
    },
  },
  _meta: {
    title: "Update Delivery Box Password",
    hidden: false,
    type: "server",
  },
};

// Success messages for handlers
export const deliveryBoxesSuccessMessages = {
  list: "Successfully retrieved delivery boxes",
  create: "Successfully created delivery box",
  get: "Successfully retrieved delivery box details",
  delete: "Successfully deleted delivery box",
  updateDescription: "Successfully updated delivery box description",
  updatePassword: "Successfully updated delivery box password",
};