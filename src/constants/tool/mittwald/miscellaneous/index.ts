/**
 * @file Tool definitions for Mittwald miscellaneous APIs
 * @module constants/tool/mittwald/miscellaneous
 * 
 * @remarks
 * This module defines MCP tools for various Mittwald APIs including
 * Page Insights, Verification, Service Token Authentication, Relocation, and Articles.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Page Insights API: Get performance data for a domain and path
 */
export const mittwaldPageInsightsGetPerformanceData: Tool = {
  name: "mittwald_pageinsights_get_performance_data",
  description: "Get detailed performance data for a given domain and path from Mittwald's Page Insights service. This tool provides performance metrics, scores, and screenshots for website analysis.",
  inputSchema: {
    type: "object",
    properties: {
      domain: {
        type: "string",
        description: "The domain or subdomain to analyze (e.g., 'mittwald.de')"
      },
      path: {
        type: "string",
        description: "The path on the domain to analyze (e.g., '/')"
      },
      date: {
        type: "string",
        format: "date",
        description: "Query data for a specific date (format: YYYY-MM-DD). Defaults to today's date if not provided."
      }
    },
    required: ["domain", "path"]
  }
};

/**
 * Page Insights API: List performance data for a project
 */
export const mittwaldPageInsightsListPerformanceDataForProject: Tool = {
  name: "mittwald_pageinsights_list_performance_data_for_project",
  description: "List websites (domain and path combinations) from a project where performance data is available. This helps identify which sites have Page Insights data.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The unique identifier of the project"
      }
    },
    required: ["projectId"]
  }
};

/**
 * Service Token API: Authenticate service
 */
export const mittwaldServiceTokenAuthenticate: Tool = {
  name: "mittwald_servicetoken_authenticate_service",
  description: "Authenticate a service using an access key. This is used for service-to-service authentication in the Mittwald platform.",
  inputSchema: {
    type: "object",
    properties: {
      accessKeyId: {
        type: "string",
        description: "The access key ID for the service"
      }
    },
    required: ["accessKeyId"]
  }
};

/**
 * Verification API: Verify address
 */
export const mittwaldVerificationVerifyAddress: Tool = {
  name: "mittwald_verification_verify_address",
  description: "Verify a postal address for accuracy and completeness. This service validates address information for compliance and delivery purposes.",
  inputSchema: {
    type: "object",
    properties: {
      address: {
        type: "object",
        description: "The address object to verify",
        properties: {
          street: { type: "string", description: "Street name and number" },
          city: { type: "string", description: "City name" },
          postalCode: { type: "string", description: "Postal/ZIP code" },
          country: { type: "string", description: "Country code (ISO 3166-1 alpha-2)" },
          state: { type: "string", description: "State or province (optional)" }
        },
        required: ["street", "city", "postalCode", "country"]
      }
    },
    required: ["address"]
  }
};

/**
 * Verification API: Verify company
 */
export const mittwaldVerificationVerifyCompany: Tool = {
  name: "mittwald_verification_verify_company",
  description: "Verify company information including business registration details. This service validates company data for compliance and business verification purposes.",
  inputSchema: {
    type: "object",
    properties: {
      company: {
        type: "object",
        description: "The company information to verify",
        properties: {
          name: { type: "string", description: "Company name" },
          registrationNumber: { type: "string", description: "Business registration number" },
          country: { type: "string", description: "Country code where company is registered" },
          address: {
            type: "object",
            description: "Company address",
            properties: {
              street: { type: "string" },
              city: { type: "string" },
              postalCode: { type: "string" },
              country: { type: "string" }
            }
          }
        },
        required: ["name", "country"]
      }
    },
    required: ["company"]
  }
};

/**
 * Relocation API: Create relocation
 */
export const mittwaldRelocationCreateRelocation: Tool = {
  name: "mittwald_relocation_create_relocation",
  description: "Create a relocation request to move services or data within the Mittwald platform. This initiates the process of transferring resources between projects or servers.",
  inputSchema: {
    type: "object",
    properties: {
      sourceProjectId: {
        type: "string",
        description: "The ID of the source project to relocate from"
      },
      targetProjectId: {
        type: "string", 
        description: "The ID of the target project to relocate to"
      },
      resourceType: {
        type: "string",
        enum: ["app", "database", "domain", "all"],
        description: "The type of resources to relocate"
      },
      resourceIds: {
        type: "array",
        items: { type: "string" },
        description: "Specific resource IDs to relocate (optional, defaults to all resources of the specified type)"
      }
    },
    required: ["sourceProjectId", "targetProjectId", "resourceType"]
  }
};

/**
 * Relocation API: Create legacy tariff change
 */
export const mittwaldRelocationCreateLegacyTariffChange: Tool = {
  name: "mittwald_relocation_create_legacy_tariff_change",
  description: "Create a legacy tariff change request. This is used for migrating older hosting plans to new tariff structures within the Mittwald platform.",
  inputSchema: {
    type: "object",
    properties: {
      contractId: {
        type: "string",
        description: "The ID of the contract to change"
      },
      newTariffId: {
        type: "string",
        description: "The ID of the new tariff to migrate to"
      },
      effectiveDate: {
        type: "string",
        format: "date",
        description: "The date when the tariff change should become effective (format: YYYY-MM-DD)"
      }
    },
    required: ["contractId", "newTariffId"]
  }
};

/**
 * Article API: Get article
 */
export const mittwaldArticleGetArticle: Tool = {
  name: "mittwald_article_get_article",
  description: "Retrieve a specific article from Mittwald's knowledge base or documentation system. This provides detailed information about products, services, or technical topics.",
  inputSchema: {
    type: "object",
    properties: {
      articleId: {
        type: "string",
        description: "The unique identifier of the article to retrieve (e.g., 'PS23-PLUS-0004')"
      }
    },
    required: ["articleId"]
  }
};

/**
 * Article API: List articles
 */
export const mittwaldArticleListArticles: Tool = {
  name: "mittwald_article_list_articles",
  description: "List available articles from Mittwald's knowledge base. This allows browsing and filtering articles by tags, template names, and other criteria.",
  inputSchema: {
    type: "object",
    properties: {
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Filter articles by tags"
      },
      templateNames: {
        type: "array", 
        items: { type: "string" },
        description: "Filter articles by template names"
      },
      limit: {
        type: "number",
        minimum: 1,
        maximum: 100,
        default: 25,
        description: "Maximum number of articles to return"
      },
      offset: {
        type: "number",
        minimum: 0,
        default: 0,
        description: "Number of articles to skip for pagination"
      }
    }
  }
};

// Export all tools as an array for easy registration
export const MITTWALD_MISCELLANEOUS_TOOLS: Tool[] = [
  mittwaldPageInsightsGetPerformanceData,
  mittwaldPageInsightsListPerformanceDataForProject,
  mittwaldServiceTokenAuthenticate,
  mittwaldVerificationVerifyAddress,
  mittwaldVerificationVerifyCompany,
  mittwaldRelocationCreateRelocation,
  mittwaldRelocationCreateLegacyTariffChange,
  mittwaldArticleGetArticle,
  mittwaldArticleListArticles
];