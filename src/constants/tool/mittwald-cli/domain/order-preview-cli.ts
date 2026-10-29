import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleDomainOrderPreviewCli } from '../../../../handlers/tools/mittwald-cli/domain/order-preview-cli.js';

const tool: Tool = {
  name: 'mittwald_domain_order_preview',
  title: 'Preview Domain Order',
  annotations: {
    title: 'Preview Domain Order',
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  },
  description:
    'Prepare the registration (or transfer) of a domain without ordering anything. Validates the owner details, ' +
    'returns an order overview with price and contract duration, and a confirmationToken for mittwald_domain_order. ' +
    'Always show the overview to the user, including the note about the verification email, before ordering. ' +
    'Ask the user for the owner details; do not make them up.',
  inputSchema: {
    type: 'object',
    properties: {
      domain: {
        type: 'string',
        description: 'Fully qualified domain name, e.g. example.de',
      },
      projectId: {
        type: 'string',
        description: 'ID of the project the domain will belong to',
      },
      authCode: {
        type: 'string',
        description: 'Auth code from the current registrar; only for transferring a domain that is already registered',
      },
      owner: {
        type: 'object',
        description: 'Domain owner. The owner is the legal holder of the domain and responsible for it.',
        properties: {
          type: {
            type: 'string',
            enum: ['person', 'organization'],
            description: 'Whether the owner is a private person or an organization (company, association, ...)',
          },
          name: {
            type: 'string',
            description: 'First and last name of the owner, or of the contact person for organizations',
          },
          company: {
            type: 'string',
            description: 'Company name; required for organizations, optional for persons',
          },
          email: {
            type: 'string',
            description: 'Email address of the owner; verification emails are sent here',
          },
          street: {
            type: 'string',
            description: 'Street and house number',
          },
          postalCode: {
            type: 'string',
          },
          city: {
            type: 'string',
          },
          country: {
            type: 'string',
            description: 'ISO 3166-1 alpha-2 country code, e.g. DE',
          },
          phone: {
            type: 'string',
            description: 'Phone number in international format with country code, e.g. +49 5772 2930',
          },
        },
        required: ['type', 'name', 'email', 'street', 'postalCode', 'city', 'country', 'phone'],
      },
    },
    required: ['domain', 'projectId', 'owner'],
  },
};

const registration: ToolRegistration = {
  tool,
  handler: handleDomainOrderPreviewCli,
  schema: tool.inputSchema,
};

export default registration;
