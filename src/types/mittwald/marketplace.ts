/**
 * Type definitions for Mittwald Marketplace API
 * 
 * Based on the Mittwald OpenAPI specification
 */

// Contributor types
export interface Contributor {
  id: string;
  name: string;
  domain: string;
  state: ContributorState;
  imprint?: ContributorImprint;
  supportMeta?: SupportMeta;
}

export interface OwnContributor extends Contributor {
  ownerUserId: string;
}

export interface ContributorImprint {
  websiteUrl?: string;
  legalNoticeUrl?: string;
  privacyUrl?: string;
}

export interface SupportMeta {
  email?: string;
  url?: string;
}

export enum ContributorState {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

// Extension types
export interface Extension {
  id: string;
  contributorId: string;
  name: string;
  shortDescription: LocalizedDescription;
  detailedDescription?: DetailedDescriptions;
  subTitle?: SubTitle;
  license?: string;
  privacyUrl?: string;
  termsOfServiceUrl?: string;
  releaseNotesUrl?: string;
  supportUrl?: string;
  deprecation?: ExtensionDeprecation;
  statistics?: ExtensionStatistics;
  health?: ExtensionHealth;
  tags?: string[];
  version?: string;
  context?: Context;
}

export interface OwnExtension extends Extension {
  secrets?: ExtensionSecret[];
  webhookUrls?: WebhookUrls;
  backendComponents?: BackendComponents;
}

export interface UnpublishedExtension extends OwnExtension {
  published: false;
}

export interface LocalizedDescription {
  [locale: string]: string;
}

export interface DetailedDescriptions {
  [locale: string]: {
    content: string;
    format: DescriptionFormat;
  };
}

export interface SubTitle {
  [locale: string]: string;
}

export enum DescriptionFormat {
  MARKDOWN = 'markdown',
  HTML = 'html',
  PLAIN = 'plain'
}

export interface ExtensionDeprecation {
  reason: string;
  replacementId?: string;
}

export interface ExtensionStatistics {
  installations?: number;
  rating?: {
    average: number;
    count: number;
  };
}

export interface ExtensionHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheckedAt?: string;
}

export interface Context {
  company?: {
    apps?: string[];
    projects?: string[];
  };
  mittwald?: {
    apps?: AggregateReferenceFilter[];
    projects?: AggregateReferenceFilter[];
  };
}

export interface AggregateReferenceFilter {
  aggregateType: string;
  aggregateId?: string;
  field?: string;
  operator?: 'eq' | 'ne' | 'in' | 'nin';
  value?: any;
}

// Extension Instance types
export interface ExtensionInstance {
  id: string;
  extensionId: string;
  projectId?: string;
  customerId?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt?: string;
  chargeability?: ExtensionInstanceChargeability;
  contract?: ExtensionInstanceContract;
  health?: ExtensionInstanceHealth;
  scopes?: string[];
}

export interface ExtensionInstanceChargeability {
  chargeable: boolean;
  reason?: string;
}

export interface ExtensionInstanceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheckedAt?: string;
  message?: string;
}

export interface ExtensionInstanceContract {
  status: 'notStarted' | 'pending' | 'active' | 'terminationPending';
  interactionRequired: boolean;
  interactionDeadline?: string;
  terminationTargetDate?: string;
}

// Extension Asset types
export interface ExtensionAsset {
  id: string;
  extensionId: string;
  filename: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  url?: string;
}

// Extension Secret types
export interface ExtensionSecret {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
}

// Webhook types
export interface WebhookUrls {
  install?: WebhookUrl;
  uninstall?: WebhookUrl;
  enable?: WebhookUrl;
  disable?: WebhookUrl;
  update?: WebhookUrl;
}

export interface WebhookUrl {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
}

export enum WebhookKind {
  INSTALL = 'install',
  UNINSTALL = 'uninstall',
  ENABLE = 'enable',
  DISABLE = 'disable',
  UPDATE = 'update'
}

// Backend Component types
export interface BackendComponents {
  external?: ExternalComponent[];
  frontend?: FrontendFragment[];
}

export interface ExternalComponent {
  name: string;
  url: string;
  type: 'api' | 'webhook' | 'other';
}

export interface FrontendFragment {
  name: string;
  type: 'url';
  config: UrlFrontendFragment;
}

export interface UrlFrontendFragment {
  url: string;
  height?: number;
  width?: number;
}

// Public Key types
export interface PublicKey {
  serial: string;
  algorithm: string;
  publicKey: string;
  validFrom: string;
  validTo: string;
}

// Scope types
export interface Scope {
  name: string;
  description: string;
  group?: string;
}

// List response types
export interface ContributorListResponse {
  contributors: Contributor[];
  totalCount?: number;
}

export interface ExtensionListResponse {
  extensions: Extension[];
  totalCount?: number;
}

export interface ExtensionInstanceListResponse {
  extensionInstances: ExtensionInstance[];
  totalCount?: number;
}

export interface ScopeListResponse {
  scopes: Scope[];
}

// Request types
export interface CreateExtensionRequest {
  name: string;
  shortDescription: LocalizedDescription;
}

export interface UpdateExtensionRequest {
  name?: string;
  shortDescription?: LocalizedDescription;
  detailedDescription?: DetailedDescriptions;
  subTitle?: SubTitle;
  license?: string;
  privacyUrl?: string;
  termsOfServiceUrl?: string;
  releaseNotesUrl?: string;
  supportUrl?: string;
  tags?: string[];
  version?: string;
}

export interface CreateExtensionInstanceRequest {
  extensionId: string;
  projectId?: string;
  customerId?: string;
  scopes?: string[];
}

export interface UpdateExtensionInstanceScopesRequest {
  scopes: string[];
}

export interface CreateExtensionSecretRequest {
  name: string;
  value: string;
}

export interface UpdateExtensionSecretRequest {
  value: string;
}

export interface PublishExtensionRequest {
  published: boolean;
}

export interface UpdateExtensionContextRequest {
  context: Context;
}

export interface AuthenticateSessionTokenRequest {
  sessionToken: string;
}

export interface AuthenticateSessionTokenResponse {
  accessToken: string;
  expiresAt: string;
  scopes: string[];
}

export interface CreateAccessTokenRetrievalKeyResponse {
  retrievalKey: string;
  expiresAt: string;
}

export interface CreateExtensionInstanceTokenRequest {
  description?: string;
  expiresAt?: string;
  scopes?: string[];
}

export interface CreateExtensionInstanceTokenResponse {
  token: string;
  expiresAt?: string;
}

export interface DryRunWebhookResponse {
  success: boolean;
  statusCode?: number;
  headers?: Record<string, string>;
  body?: string;
  error?: string;
}