/**
 * @file Type definitions for Mittwald miscellaneous APIs
 * @module types/mittwald/miscellaneous
 */

// Page Insights Types
export interface PageInsightsPerformanceDataArgs {
  domain: string;
  path: string;
  date?: string;
}

export interface PageInsightsListPerformanceDataForProjectArgs {
  projectId: string;
}

export interface PageInsightsMetric {
  name: string;
  value: number;
  score?: number | null;
  createdAt: string;
}

export interface PageInsightsScreenshot {
  fileRef: string;
  createdAt: string;
}

export interface PageInsightsPerformanceData {
  domain: string;
  path: string;
  performanceScore: number;
  createdAt?: string;
  metrics?: PageInsightsMetric[];
  moreDataAvailable?: string[];
  screenshot?: PageInsightsScreenshot;
}

// Service Token Types
export interface ServiceTokenAuthenticateArgs {
  accessKeyId: string;
}

// Verification Types
export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  state?: string;
}

export interface VerificationVerifyAddressArgs {
  address: Address;
}

export interface Company {
  name: string;
  registrationNumber?: string;
  country: string;
  address?: Address;
}

export interface VerificationVerifyCompanyArgs {
  company: Company;
}

// Relocation Types
export interface RelocationCreateRelocationArgs {
  sourceProjectId: string;
  targetProjectId: string;
  resourceType: 'app' | 'database' | 'domain' | 'all';
  resourceIds?: string[];
}

export interface RelocationCreateLegacyTariffChangeArgs {
  contractId: string;
  newTariffId: string;
  effectiveDate?: string;
}

// Article Types
export interface ArticleGetArticleArgs {
  articleId: string;
}

export interface ArticleListArticlesArgs {
  tags?: string[];
  templateNames?: string[];
  limit?: number;
  offset?: number;
}

export interface Article {
  id: string;
  title: string;
  content?: string;
  tags?: string[];
  templateName?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Union type for all miscellaneous API arguments
export type MiscellaneousApiArgs = 
  | PageInsightsPerformanceDataArgs
  | PageInsightsListPerformanceDataForProjectArgs
  | ServiceTokenAuthenticateArgs
  | VerificationVerifyAddressArgs
  | VerificationVerifyCompanyArgs
  | RelocationCreateRelocationArgs
  | RelocationCreateLegacyTariffChangeArgs
  | ArticleGetArticleArgs
  | ArticleListArticlesArgs;