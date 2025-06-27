/**
 * @file Handler implementations for Mittwald domain DNS and nameserver tools
 * @module handlers/tools/mittwald/domain/domain-dns
 */

import { z } from 'zod';
import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse, type ToolHandler } from '../../types.js';
import { logger } from '../../../../utils/logger.js';

// Input schemas for validation
export const DomainUpdateNameserversArgsSchema = z.object({
  domainId: z.string().uuid(),
  nameservers: z.array(z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*(\.[a-zA-Z0-9][a-zA-Z0-9-]*)*$/))
    .min(2, "At least 2 nameservers required")
    .max(6, "Maximum 6 nameservers allowed")
});

export const DomainCreateAuthCodeArgsSchema = z.object({
  domainId: z.string().uuid()
});

export const DomainUpdateAuthCodeArgsSchema = z.object({
  domainId: z.string().uuid(),
  authCode: z.string().min(1)
});

export const DomainResendEmailArgsSchema = z.object({
  domainId: z.string().uuid()
});

export const DomainAbortDeclarationArgsSchema = z.object({
  domainId: z.string().uuid()
});

// Type definitions
export type DomainUpdateNameserversArgs = z.infer<typeof DomainUpdateNameserversArgsSchema>;
export type DomainCreateAuthCodeArgs = z.infer<typeof DomainCreateAuthCodeArgsSchema>;
export type DomainUpdateAuthCodeArgs = z.infer<typeof DomainUpdateAuthCodeArgsSchema>;
export type DomainResendEmailArgs = z.infer<typeof DomainResendEmailArgsSchema>;
export type DomainAbortDeclarationArgs = z.infer<typeof DomainAbortDeclarationArgsSchema>;

/**
 * Handler for updating domain nameservers
 */
export const handleDomainUpdateNameservers: ToolHandler<DomainUpdateNameserversArgs> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    logger.info('Updating domain nameservers', { domainId: args.domainId, nameservers: args.nameservers });
    
    const response = await client.typedApi.domain.updateDomainNameservers({
      domainId: args.domainId,
      data: {
        nameservers: args.nameservers as [string, string, ...string[]]
      }
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to update nameservers: ${response.status}`);
    }

    return formatToolResponse({
      message: `Successfully updated nameservers for domain`,
      result: {
        domainId: args.domainId,
        nameservers: args.nameservers,
        updated: true
      }
    });
  } catch (error) {
    logger.error('Failed to update domain nameservers', { error });
    return formatToolResponse({
      status: "error",
      message: `Failed to update nameservers: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for creating domain auth code
 */
export const handleDomainCreateAuthCode: ToolHandler<DomainCreateAuthCodeArgs> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    logger.info('Creating domain auth code', { domainId: args.domainId });
    
    const response = await client.typedApi.domain.createDomainAuthCode({
      domainId: args.domainId
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to create auth code: ${response.status}`);
    }

    return formatToolResponse({
      message: `Successfully created auth code for domain`,
      result: {
        domainId: args.domainId,
        authCode: response.data,
        created: true
      }
    });
  } catch (error) {
    logger.error('Failed to create domain auth code', { error });
    return formatToolResponse({
      status: "error",
      message: `Failed to create auth code: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for updating domain auth code
 */
export const handleDomainUpdateAuthCode: ToolHandler<DomainUpdateAuthCodeArgs> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    logger.info('Updating domain auth code', { domainId: args.domainId });
    
    const response = await client.typedApi.domain.updateDomainAuthCode({
      domainId: args.domainId,
      data: {
        authCode: args.authCode
      }
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to update auth code: ${response.status}`);
    }

    return formatToolResponse({
      message: `Successfully updated auth code for domain`,
      result: {
        domainId: args.domainId,
        updated: true
      }
    });
  } catch (error) {
    logger.error('Failed to update domain auth code', { error });
    return formatToolResponse({
      status: "error",
      message: `Failed to update auth code: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for resending domain email
 */
export const handleDomainResendEmail: ToolHandler<DomainResendEmailArgs> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    logger.info('Resending domain email', { domainId: args.domainId });
    
    const response = await client.typedApi.domain.resendDomainEmail({
      domainId: args.domainId
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to resend email: ${response.status}`);
    }

    return formatToolResponse({
      message: `Successfully sent domain email`,
      result: {
        domainId: args.domainId,
        emailSent: true
      }
    });
  } catch (error) {
    logger.error('Failed to resend domain email', { error });
    return formatToolResponse({
      status: "error",
      message: `Failed to resend email: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for aborting domain declaration
 */
export const handleDomainAbortDeclaration: ToolHandler<DomainAbortDeclarationArgs> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    logger.info('Aborting domain declaration', { domainId: args.domainId });
    
    const response = await client.typedApi.domain.abortDomainDeclaration({
      domainId: args.domainId
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to abort declaration: ${response.status}`);
    }

    return formatToolResponse({
      message: `Successfully aborted domain declaration`,
      result: {
        domainId: args.domainId,
        aborted: true
      }
    });
  } catch (error) {
    logger.error('Failed to abort domain declaration', { error });
    return formatToolResponse({
      status: "error",
      message: `Failed to abort declaration: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};