/**
 * @file Schema definitions for MCP tools auto-generation pipeline
 * @module docs/reference/scripts/schema
 *
 * @remarks
 * This module defines TypeScript interfaces for the auto-generation pipeline.
 * It covers tool metadata extraction, OpenAPI conversion, and markdown generation.
 */

/**
 * Represents a single parameter for an MCP tool
 */
export interface ToolParameter {
  /** Parameter name */
  name: string;

  /** Parameter type (string, number, boolean, object, array) */
  type: string;

  /** Human-readable description */
  description: string;

  /** Whether this parameter is required */
  required: boolean;

  /** Allowed enum values (if applicable) */
  enum?: string[];

  /** Default value (if applicable) */
  default?: unknown;

  /** Additional JSON schema properties */
  schema?: Record<string, unknown>;
}

/**
 * Represents the return type of a tool
 */
export interface ReturnType {
  /** Return type (e.g., 'object', 'array', 'string') */
  type: string;

  /** Description of what is returned */
  description: string;

  /** Example return value */
  example?: unknown;
}

/**
 * Represents an example usage of a tool
 */
export interface ToolExample {
  /** Example description */
  description: string;

  /** Example parameters */
  parameters: Record<string, unknown>;

  /** Expected result */
  result?: unknown;
}

/**
 * Represents a single MCP tool
 */
export interface MCPTool {
  /** Tool name (e.g., 'mittwald_app_list') */
  name: string;

  /** Human-readable title */
  title: string;

  /** Detailed description of what the tool does */
  description: string;

  /** Tool domain (e.g., 'app', 'database', 'domain') */
  domain: MCPDomain;

  /** Tool category/group within domain */
  category?: string;

  /** Parameters accepted by the tool */
  parameters: ToolParameter[];

  /** Return type information */
  returnType: ReturnType;

  /** Usage examples */
  examples?: ToolExample[];

  /** Authentication required (default: true) */
  requiresAuth?: boolean;

  /** Required OAuth scopes */
  requiredScopes?: string[];

  /** Tags for categorization */
  tags?: string[];

  /** Whether this tool is deprecated */
  deprecated?: boolean;

  /** Deprecation message (if deprecated) */
  deprecationMessage?: string;
}

/**
 * Manifest containing all MCP tools
 */
export interface ToolsManifest {
  /** Version of the manifest schema */
  version: string;

  /** Timestamp of generation */
  generatedAt: string;

  /** Total number of tools */
  totalTools: number;

  /** Tools organized by domain */
  tools: Record<MCPDomain, MCPTool[]>;

  /** Domain metadata */
  domains: Record<MCPDomain, DomainMetadata>;
}

/**
 * Metadata for a tool domain
 */
export interface DomainMetadata {
  /** Domain name */
  name: MCPDomain;

  /** Human-readable title */
  title: string;

  /** Description of the domain */
  description: string;

  /** Number of tools in this domain */
  toolCount: number;

  /** Tags for the domain */
  tags?: string[];
}

/**
 * Supported MCP tool domains (22 total)
 *
 * @remarks
 * These domains organize tools by functional area and correspond to
 * subdirectories in /src/constants/tool/mittwald-cli/
 */
export type MCPDomain =
  | 'app'
  | 'backup'
  | 'certificate'
  | 'container'
  | 'context'
  | 'conversation'
  | 'cronjob'
  | 'database'
  | 'ddev'
  | 'domain'
  | 'extension'
  | 'login'
  | 'mail'
  | 'org'
  | 'project'
  | 'registry'
  | 'server'
  | 'sftp'
  | 'ssh'
  | 'stack'
  | 'user'
  | 'volume';

/**
 * List of all available domains
 */
export const MCP_DOMAINS: MCPDomain[] = [
  'app',
  'backup',
  'certificate',
  'container',
  'context',
  'conversation',
  'cronjob',
  'database',
  'ddev',
  'domain',
  'extension',
  'login',
  'mail',
  'org',
  'project',
  'registry',
  'server',
  'sftp',
  'ssh',
  'stack',
  'user',
  'volume',
];

/**
 * Domain display titles for documentation
 */
export const DOMAIN_TITLES: Record<MCPDomain, string> = {
  app: 'Apps',
  backup: 'Backups',
  certificate: 'Certificates',
  container: 'Containers',
  context: 'Context',
  conversation: 'Conversations',
  cronjob: 'Cron Jobs',
  database: 'Databases',
  ddev: 'DDEV',
  domain: 'Domains',
  extension: 'Extensions',
  login: 'Login',
  mail: 'Mail',
  org: 'Organizations',
  project: 'Projects',
  registry: 'Registries',
  server: 'Servers',
  sftp: 'SFTP',
  ssh: 'SSH',
  stack: 'Stacks',
  user: 'Users',
  volume: 'Volumes',
};

/**
 * Domain descriptions for documentation
 */
export const DOMAIN_DESCRIPTIONS: Record<MCPDomain, string> = {
  app: 'Manage applications in projects',
  backup: 'Manage project backups and restore points',
  certificate: 'Manage SSL/TLS certificates',
  container: 'Manage containerized applications',
  context: 'Set and manage CLI context',
  conversation: 'Manage support conversations and tickets',
  cronjob: 'Schedule and manage cron jobs',
  database: 'Manage databases (MySQL, PostgreSQL, Redis)',
  ddev: 'Local development environment utilities',
  domain: 'Manage domains and DNS',
  extension: 'Manage app extensions and plugins',
  login: 'Manage login and authentication',
  mail: 'Manage mail addresses and mailboxes',
  org: 'Manage organizations and memberships',
  project: 'Manage projects and their resources',
  registry: 'Manage container registries',
  server: 'Manage servers and hosting resources',
  sftp: 'Manage SFTP users and access',
  ssh: 'Manage SSH access and keys',
  stack: 'Manage runtime stacks',
  user: 'Manage user accounts and access',
  volume: 'Manage storage volumes',
};
