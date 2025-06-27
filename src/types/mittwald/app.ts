/**
 * Type definitions for Mittwald App API
 * 
 * @module
 * This module contains type definitions for the Mittwald App API,
 * including interfaces for apps, app installations, and system software.
 */

export interface App {
  id: string;
  name: string;
  tags: string[];
  actionCapabilities?: string[];
}

export interface AppVersion {
  id: string;
  appId: string;
  externalVersion: string;
  internalVersion: string;
  docRoot: string;
  docRootUserEditable: boolean;
  recommended?: boolean;
  breakingNote?: {
    faqLink: string;
  };
  databases?: DatabaseDependency[];
  systemSoftwareDependencies?: SystemSoftwareDependency[];
  userInputs?: UserInput[];
  requestHandler?: RequestHandlerRequirement;
}

export interface AppInstallation {
  id: string;
  appId: string;
  shortId: string;
  projectId?: string;
  appVersion: VersionStatus;
  description: string;
  installationPath: string;
  disabled: boolean;
  createdAt: string;
  customDocumentRoot?: string;
  screenshotId?: string;
  screenshotRef?: string;
  updatePolicy?: AppUpdatePolicy;
  systemSoftware?: InstalledSystemSoftware[];
  userInputs?: SavedUserInput[];
  linkedDatabases?: LinkedDatabase[];
  processes?: string[];
}

export interface SystemSoftware {
  id: string;
  name: string;
  tags: string[];
  meta?: Record<string, string>;
}

export interface SystemSoftwareVersion {
  id: string;
  internalVersion: string;
  externalVersion: string;
  recommended?: boolean;
  expiryDate?: string;
  systemSoftwareDependencies?: SystemSoftwareDependency[];
  userInputs?: UserInput[];
  fee?: any; // FeeStrategy
}

export interface VersionStatus {
  current?: string;
  desired: string;
}

export interface DatabaseDependency {
  version: string;
  description: string;
  kind: 'mysql';
  parameters?: Record<string, string>;
}

export interface SystemSoftwareDependency {
  systemSoftwareId: string;
  versionRange: string;
}

export interface UserInput {
  name: string;
  dataType: 'text' | 'number' | 'boolean' | 'select';
  validationSchema: string; // JSON Schema
  lifecycleConstraint: 'installation' | 'update' | 'reconfigure';
  required: boolean;
  defaultValue?: string;
  format?: 'email' | 'password' | 'url' | 'uri';
  dataSource?: string;
  positionMeta?: {
    index?: number;
    section?: string;
    step?: string;
  };
}

export interface SavedUserInput {
  name: string;
  value: string;
}

export interface RequestHandlerRequirement {
  name: string;
  namespace: string;
  parametersTemplate: string;
  exampleValues?: SavedUserInput[];
}

export interface InstalledSystemSoftware {
  systemSoftwareId: string;
  updatePolicy: SystemSoftwareUpdatePolicy;
  systemSoftwareVersion: VersionStatus;
}

export interface LinkedDatabase {
  databaseId: string;
  purpose: 'primary' | 'cache' | 'custom';
  kind: 'mysql' | 'redis';
  databaseUserIds?: Record<string, string>;
}

export interface AppInstallationStatus {
  state: 'running' | 'stopped' | 'exited';
  logFileLocation: string;
  lastExitCode?: number;
  uptimeSeconds?: number;
}

export type AppUpdatePolicy = 'none' | 'patchLevel' | 'all';
export type SystemSoftwareUpdatePolicy = 'none' | 'inheritedFromApp' | 'patchLevel' | 'all';
export type AppAction = 'start' | 'stop' | 'restart';

export interface CreateAppInstallationRequest {
  appId: string;
  appVersionId?: string;
  description: string;
  projectId: string;
  updatePolicy?: AppUpdatePolicy;
  userInputs?: SavedUserInput[];
}

export interface UpdateAppInstallationRequest {
  appVersionId?: string;
  customDocumentRoot?: string;
  description?: string;
  updatePolicy?: AppUpdatePolicy;
  userInputs?: SavedUserInput[];
}

export interface CopyAppInstallationRequest {
  description: string;
  projectId: string;
}

export interface LinkDatabaseRequest {
  databaseId: string;
  purpose: 'primary' | 'cache' | 'custom';
  databaseUserIds?: string[];
}