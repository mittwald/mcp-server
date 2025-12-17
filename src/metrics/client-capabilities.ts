/**
 * @file Client capability telemetry for MCP spec feature adoption tracking
 * @module metrics/client-capabilities
 *
 * @remarks
 * Tracks which MCP clients support various spec features (including experimental
 * ones like Tasks from the 2025-11-25 spec) without changing tool implementations.
 * This provides data for deciding when to implement new features.
 */

import { Counter, Gauge } from 'prom-client';
import { register, metricsEnabled } from './registry.js';
import { logger } from '../utils/logger.js';
import type { ClientCapabilities, Implementation } from '@modelcontextprotocol/sdk/types.js';

// Only register metrics if enabled
const registries = metricsEnabled ? [register] : [];

/**
 * Counter for client connections by capability support
 * Labels allow filtering/grouping by specific capabilities
 */
export const clientCapabilitiesTotal = new Counter({
  name: 'mcp_client_capabilities_total',
  help: 'Total client connections by capability support',
  labelNames: [
    'client_name',
    'client_version',
    'protocol_version',
    'supports_roots',
    'supports_sampling',
    'supports_sampling_tools',
    'supports_sampling_context',
    'supports_elicitation',
    'supports_elicitation_form',
    'supports_elicitation_url',
    'supports_experimental_tasks',
    'has_experimental',
  ],
  registers: registries,
});

/**
 * Gauge for current sessions by capability (for real-time dashboards)
 */
export const clientCapabilitiesActive = new Gauge({
  name: 'mcp_client_capabilities_active',
  help: 'Currently active sessions by capability support',
  labelNames: ['capability'],
  registers: registries,
});

/**
 * Counter specifically for experimental feature adoption
 * Useful for tracking Tasks and other future experimental features
 */
export const experimentalFeaturesTotal = new Counter({
  name: 'mcp_experimental_features_total',
  help: 'Client connections declaring experimental feature support',
  labelNames: ['feature_name', 'client_name'],
  registers: registries,
});

/**
 * Detailed client info counter for version tracking
 */
export const clientVersionsTotal = new Counter({
  name: 'mcp_client_versions_total',
  help: 'Client connections by name and version',
  labelNames: ['client_name', 'client_version', 'protocol_version'],
  registers: registries,
});

/**
 * Interface for parsed capability flags
 */
interface CapabilityFlags {
  supportsRoots: boolean;
  supportsSampling: boolean;
  supportsSamplingTools: boolean;
  supportsSamplingContext: boolean;
  supportsElicitation: boolean;
  supportsElicitationForm: boolean;
  supportsElicitationUrl: boolean;
  supportsExperimentalTasks: boolean;
  hasExperimental: boolean;
  experimentalFeatures: string[];
}

/**
 * Parse client capabilities into boolean flags for metrics
 */
function parseCapabilities(capabilities: ClientCapabilities | undefined): CapabilityFlags {
  if (!capabilities) {
    return {
      supportsRoots: false,
      supportsSampling: false,
      supportsSamplingTools: false,
      supportsSamplingContext: false,
      supportsElicitation: false,
      supportsElicitationForm: false,
      supportsElicitationUrl: false,
      supportsExperimentalTasks: false,
      hasExperimental: false,
      experimentalFeatures: [],
    };
  }

  const experimentalFeatures = capabilities.experimental
    ? Object.keys(capabilities.experimental)
    : [];

  return {
    supportsRoots: !!capabilities.roots,
    supportsSampling: !!capabilities.sampling,
    supportsSamplingTools: !!capabilities.sampling?.tools,
    supportsSamplingContext: !!capabilities.sampling?.context,
    supportsElicitation: !!capabilities.elicitation,
    supportsElicitationForm: !!capabilities.elicitation?.form,
    supportsElicitationUrl: !!capabilities.elicitation?.url,
    supportsExperimentalTasks: experimentalFeatures.includes('tasks') ||
      // Also check for tasks in the main capabilities object (future SDK versions)
      !!(capabilities as Record<string, unknown>).tasks,
    hasExperimental: experimentalFeatures.length > 0,
    experimentalFeatures,
  };
}

/**
 * Track client capabilities on session initialization
 *
 * @param sessionId - Session identifier for logging
 * @param capabilities - Client capabilities from initialization
 * @param clientInfo - Client name/version info
 * @param protocolVersion - Negotiated protocol version
 */
export function trackClientCapabilities(
  sessionId: string,
  capabilities: ClientCapabilities | undefined,
  clientInfo: Implementation | undefined,
  protocolVersion?: string,
): CapabilityFlags {
  const flags = parseCapabilities(capabilities);

  const clientName = clientInfo?.name || 'unknown';
  const clientVersion = clientInfo?.version || 'unknown';
  const protoVersion = protocolVersion || 'unknown';

  // Log for debugging
  logger.info(`📊 [${sessionId}] Client capability telemetry`, {
    client: `${clientName}@${clientVersion}`,
    protocolVersion: protoVersion,
    capabilities: {
      roots: flags.supportsRoots,
      sampling: flags.supportsSampling,
      samplingTools: flags.supportsSamplingTools,
      samplingContext: flags.supportsSamplingContext,
      elicitation: flags.supportsElicitation,
      elicitationForm: flags.supportsElicitationForm,
      elicitationUrl: flags.supportsElicitationUrl,
      experimentalTasks: flags.supportsExperimentalTasks,
      experimental: flags.experimentalFeatures,
    },
  });

  // Track detailed capability metrics
  clientCapabilitiesTotal.inc({
    client_name: clientName,
    client_version: clientVersion,
    protocol_version: protoVersion,
    supports_roots: String(flags.supportsRoots),
    supports_sampling: String(flags.supportsSampling),
    supports_sampling_tools: String(flags.supportsSamplingTools),
    supports_sampling_context: String(flags.supportsSamplingContext),
    supports_elicitation: String(flags.supportsElicitation),
    supports_elicitation_form: String(flags.supportsElicitationForm),
    supports_elicitation_url: String(flags.supportsElicitationUrl),
    supports_experimental_tasks: String(flags.supportsExperimentalTasks),
    has_experimental: String(flags.hasExperimental),
  });

  // Track client versions
  clientVersionsTotal.inc({
    client_name: clientName,
    client_version: clientVersion,
    protocol_version: protoVersion,
  });

  // Track experimental features individually
  for (const feature of flags.experimentalFeatures) {
    experimentalFeaturesTotal.inc({
      feature_name: feature,
      client_name: clientName,
    });
  }

  // Update active capability gauges
  if (flags.supportsRoots) clientCapabilitiesActive.inc({ capability: 'roots' });
  if (flags.supportsSampling) clientCapabilitiesActive.inc({ capability: 'sampling' });
  if (flags.supportsElicitation) clientCapabilitiesActive.inc({ capability: 'elicitation' });
  if (flags.supportsExperimentalTasks) clientCapabilitiesActive.inc({ capability: 'experimental_tasks' });

  // Special logging for Tasks support (the feature we're watching for)
  if (flags.supportsExperimentalTasks) {
    logger.info(`🎯 [${sessionId}] Client declares TASKS support!`, {
      client: `${clientName}@${clientVersion}`,
      protocolVersion: protoVersion,
    });
  }

  return flags;
}

/**
 * Decrement active capability gauges on session cleanup
 */
export function untrackClientCapabilities(flags: CapabilityFlags): void {
  if (flags.supportsRoots) clientCapabilitiesActive.dec({ capability: 'roots' });
  if (flags.supportsSampling) clientCapabilitiesActive.dec({ capability: 'sampling' });
  if (flags.supportsElicitation) clientCapabilitiesActive.dec({ capability: 'elicitation' });
  if (flags.supportsExperimentalTasks) clientCapabilitiesActive.dec({ capability: 'experimental_tasks' });
}

/**
 * Get summary of capability support for logging/debugging
 */
export function getCapabilitySummary(): Record<string, number> {
  // This would need to be called from the registry
  // For now, return placeholder - actual values come from Prometheus queries
  return {
    note: 'Query Prometheus for actual values',
  } as unknown as Record<string, number>;
}
