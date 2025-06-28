import { MittwaldTool } from "../../../../../types";

export const MITTWALD_DATABASE_MYSQL_GET_TOOL: MittwaldTool = {
  name: "mittwald_database_mysql_get",
  description: "Get a MySQLDatabase",
  input_schema: {
    type: "object",
    properties: {
      databaseId: {
        type: "string",
        description: "The ID or name of the database",
      },
      output: {
        type: "string",
        enum: ["txt", "json", "yaml"],
        description: "Output format",
        default: "txt",
      },
    },
    required: ["databaseId", "output"],
  },
};