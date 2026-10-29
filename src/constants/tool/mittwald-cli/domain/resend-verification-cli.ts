import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleDomainResendVerificationCli } from '../../../../handlers/tools/mittwald-cli/domain/resend-verification-cli.js';

const tool: Tool = {
  name: 'mittwald_domain_resend_verification',
  title: 'Resend Domain Verification Email',
  annotations: {
    title: 'Resend Domain Verification Email',
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },
  description:
    'Resend the email that asks the domain owner to verify their email address. It is sent from ' +
    'noreply@mittwald.de and must be confirmed within 7 days of registering the domain, otherwise the domain is suspended.',
  inputSchema: {
    type: 'object',
    properties: {
      domainId: {
        type: 'string',
        description: 'The domain ID (see mittwald_domain_list)',
      },
    },
    required: ['domainId'],
  },
};

const registration: ToolRegistration = {
  tool,
  handler: handleDomainResendVerificationCli,
  schema: tool.inputSchema,
};

export default registration;
