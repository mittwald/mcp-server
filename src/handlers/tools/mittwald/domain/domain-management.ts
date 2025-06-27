/**
 * @file Handler implementations for Mittwald domain management tools
 * @module handlers/tools/mittwald/domain/domain-management
 */

import { z } from 'zod';
import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse, type ToolHandler } from '../../types.js';
import { logger } from '../../../../utils/logger.js';

// Input schemas for validation
export const DomainListArgsSchema = z.object({
  projectId: z.string().uuid().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
  domainSearchName: z.string().optional(),
  contactHash: z.string().optional()
});

export const DomainGetArgsSchema = z.object({
  domainId: z.string().uuid()
});

export const DomainDeleteArgsSchema = z.object({
  domainId: z.string().uuid()
});

export const DomainCheckRegistrabilityArgsSchema = z.object({
  domain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/, 
    "Invalid domain format. Example: 'example.com'")
});

export const DomainUpdateProjectArgsSchema = z.object({
  domainId: z.string().uuid(),
  projectId: z.string().uuid()
});

// Type definitions
export type DomainListArgs = z.infer<typeof DomainListArgsSchema>;
export type DomainGetArgs = z.infer<typeof DomainGetArgsSchema>;
export type DomainDeleteArgs = z.infer<typeof DomainDeleteArgsSchema>;
export type DomainCheckRegistrabilityArgs = z.infer<typeof DomainCheckRegistrabilityArgsSchema>;
export type DomainUpdateProjectArgs = z.infer<typeof DomainUpdateProjectArgsSchema>;

/**
 * Handler for listing domains
 */
export const handleDomainList: ToolHandler<DomainListArgs> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    logger.info('Listing domains', { args });
    
    const response = await client.typedApi.domain.listDomains({
      queryParameters: {
        projectId: args.projectId,
        page: args.page,
        limit: args.limit,
        domainSearchName: args.domainSearchName,
        contactHash: args.contactHash
      }
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to list domains: ${response.status}`);
    }

    const domains = response.data;
    
    return formatToolResponse({
      message: `Successfully retrieved ${domains.length} domain(s)`,
      result: {
        domains,
        pagination: {
          page: args.page || 1,
          limit: args.limit || 50,
          total: domains.length
        }
      }
    });
  } catch (error) {
    logger.error('Failed to list domains', { error });
    return formatToolResponse({
      status: "error",
      message: `Failed to list domains: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for getting a single domain
 */
export const handleDomainGet: ToolHandler<DomainGetArgs> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    logger.info('Getting domain', { domainId: args.domainId });
    
    const response = await client.typedApi.domain.getDomain({
      domainId: args.domainId
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to get domain: ${response.status}`);
    }

    return formatToolResponse({
      message: `Successfully retrieved domain information`,
      result: {
        domain: response.data
      }
    });
  } catch (error) {
    logger.error('Failed to get domain', { error });
    return formatToolResponse({
      status: "error",
      message: `Failed to get domain: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for deleting a domain
 */
export const handleDomainDelete: ToolHandler<DomainDeleteArgs> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    logger.info('Deleting domain', { domainId: args.domainId });
    
    const response = await client.typedApi.domain.deleteDomain({
      domainId: args.domainId
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to delete domain: ${response.status}`);
    }

    return formatToolResponse({
      message: `Successfully deleted domain`,
      result: {
        domainId: args.domainId,
        deleted: true
      }
    });
  } catch (error) {
    logger.error('Failed to delete domain', { error });
    return formatToolResponse({
      status: "error",
      message: `Failed to delete domain: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for checking domain availability
 */
export const handleDomainCheckRegistrability: ToolHandler<DomainCheckRegistrabilityArgs> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    logger.info('Checking domain availability', { domain: args.domain });
    
    const response = await client.typedApi.domain.checkDomainRegistrability({
      data: {
        domain: args.domain
      }
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to check domain availability: ${response.status}`);
    }

    return formatToolResponse({
      message: `Domain availability check completed`,
      result: {
        domain: args.domain,
        available: response.data.registrable,
        details: response.data
      }
    });
  } catch (error) {
    logger.error('Failed to check domain availability', { error });
    return formatToolResponse({
      status: "error",
      message: `Failed to check domain availability: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for updating domain project assignment
 */
export const handleDomainUpdateProject: ToolHandler<DomainUpdateProjectArgs> = async (args) => {
  try {
    const client = getMittwaldClient();
    
    logger.info('Updating domain project', { domainId: args.domainId, projectId: args.projectId });
    
    const response = await client.typedApi.domain.updateDomainProjectId({
      domainId: args.domainId,
      data: {
        projectId: args.projectId
      }
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to update domain project: ${response.status}`);
    }

    return formatToolResponse({
      message: `Successfully updated domain project assignment`,
      result: {
        domainId: args.domainId,
        projectId: args.projectId,
        updated: true
      }
    });
  } catch (error) {
    logger.error('Failed to update domain project', { error });
    return formatToolResponse({
      status: "error",
      message: `Failed to update domain project: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};