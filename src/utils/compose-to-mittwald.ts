/**
 * Converts docker-compose YAML to Mittwald stack declaration format
 */

import yaml from 'js-yaml';
import type { ContainerServiceDeclareRequest, ContainerVolumeDeclareRequest } from '@mittwald-mcp/cli-core';

// Docker Compose types (simplified)
interface ComposeService {
  image?: string;
  ports?: (string | { target: number; published?: number; protocol?: string })[];
  environment?: Record<string, string> | string[];
  volumes?: (string | { source: string; target: string; type?: string })[];
  command?: string | string[];
  entrypoint?: string | string[];
  working_dir?: string;
  user?: string;
  restart?: string;
  depends_on?: string[] | Record<string, unknown>;
  healthcheck?: unknown;
  deploy?: unknown;
  labels?: Record<string, string> | string[];
  networks?: string[] | Record<string, unknown>;
}

interface ComposeVolume {
  driver?: string;
  driver_opts?: Record<string, string>;
  external?: boolean;
  name?: string;
}

interface ComposeFile {
  version?: string;
  services?: Record<string, ComposeService>;
  volumes?: Record<string, ComposeVolume | null>;
  networks?: Record<string, unknown>;
}

export interface MittwaldStackDeclaration {
  services: Record<string, ContainerServiceDeclareRequest>;
  volumes: Record<string, ContainerVolumeDeclareRequest>;
}

export interface ConversionResult {
  success: boolean;
  declaration?: MittwaldStackDeclaration;
  warnings: string[];
  errors: string[];
}

/**
 * Parse port to Mittwald string format like "80" or "8080:80" or "8080:80/udp"
 */
function parsePort(port: string | { target: number; published?: number; protocol?: string }): string | null {
  if (typeof port === 'object') {
    let result = String(port.target);
    if (port.published && port.published !== port.target) {
      result = `${port.published}:${port.target}`;
    }
    if (port.protocol && port.protocol !== 'tcp') {
      result += `/${port.protocol}`;
    }
    return result;
  }

  // String format is already compatible, just validate it
  const match = port.match(/^(?:(\d+):)?(\d+)(?:\/(tcp|udp))?$/);
  if (!match) {
    return null;
  }

  return port;
}

/**
 * Parse environment variables from array or object format
 */
function parseEnvironment(env: Record<string, string> | string[] | undefined): Record<string, string> {
  if (!env) return {};

  if (Array.isArray(env)) {
    const result: Record<string, string> = {};
    for (const item of env) {
      const [key, ...valueParts] = item.split('=');
      result[key] = valueParts.join('=');
    }
    return result;
  }

  // Convert all values to strings
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    result[key] = String(value);
  }
  return result;
}

/**
 * Parse volume mount to Mittwald string format "volumeName:/mount/path"
 */
function parseVolume(
  vol: string | { source: string; target: string; type?: string },
  definedVolumes: Set<string>
): { volumeString: string; isNamedVolume: boolean } | null {
  if (typeof vol === 'object') {
    const isNamedVolume = vol.type === 'volume' || definedVolumes.has(vol.source);
    return {
      volumeString: `${vol.source}:${vol.target}`,
      isNamedVolume,
    };
  }

  // String format: "source:target" or "source:target:mode"
  const parts = vol.split(':');
  if (parts.length < 2) {
    return null;
  }

  const source = parts[0];
  const target = parts[1];

  // Check if it's a named volume (defined in top-level volumes) vs bind mount (path)
  const isNamedVolume = definedVolumes.has(source) || (!source.startsWith('/') && !source.startsWith('.'));

  // Return format: "source:target" (drop mode if present)
  return {
    volumeString: `${source}:${target}`,
    isNamedVolume,
  };
}

/**
 * Parse command or entrypoint to array format
 */
function parseCommand(cmd: string | string[] | undefined): string[] | undefined {
  if (!cmd) return undefined;
  if (Array.isArray(cmd)) return cmd;
  // Simple shell-style splitting (doesn't handle quotes properly, but good enough for most cases)
  return cmd.split(/\s+/);
}

/**
 * Convert docker-compose YAML content to Mittwald stack declaration
 */
export function convertComposeToMittwald(
  composeYaml: string,
  envOverrides?: Record<string, string>
): ConversionResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  let compose: ComposeFile;
  try {
    compose = yaml.load(composeYaml) as ComposeFile;
  } catch (e) {
    return {
      success: false,
      warnings,
      errors: [`Failed to parse YAML: ${e instanceof Error ? e.message : String(e)}`],
    };
  }

  if (!compose || typeof compose !== 'object') {
    return {
      success: false,
      warnings,
      errors: ['Invalid compose file: expected an object'],
    };
  }

  if (!compose.services || Object.keys(compose.services).length === 0) {
    return {
      success: false,
      warnings,
      errors: ['No services defined in compose file'],
    };
  }

  // Collect defined volume names
  const definedVolumes = new Set<string>(Object.keys(compose.volumes || {}));

  const services: Record<string, ContainerServiceDeclareRequest> = {};
  const volumes: Record<string, ContainerVolumeDeclareRequest> = {};
  const usedVolumes = new Set<string>();

  // Convert services
  for (const [serviceName, service] of Object.entries(compose.services)) {
    if (!service.image) {
      errors.push(`Service '${serviceName}' has no image defined`);
      continue;
    }

    const mittwaldService: ContainerServiceDeclareRequest = {
      image: service.image,
      description: `${serviceName} container`,
    };

    // Convert ports
    if (service.ports && service.ports.length > 0) {
      const ports: string[] = [];
      for (const port of service.ports) {
        const parsed = parsePort(port);
        if (parsed) {
          ports.push(parsed);
        } else {
          warnings.push(`Service '${serviceName}': could not parse port '${JSON.stringify(port)}'`);
        }
      }
      if (ports.length > 0) {
        mittwaldService.ports = ports;
      }
    }

    // Convert environment
    const env = parseEnvironment(service.environment);
    // Apply overrides
    if (envOverrides) {
      Object.assign(env, envOverrides);
    }
    if (Object.keys(env).length > 0) {
      mittwaldService.environment = env;
    }

    // Convert volumes
    if (service.volumes && service.volumes.length > 0) {
      const volumeStrings: string[] = [];
      for (const vol of service.volumes) {
        const parsed = parseVolume(vol, definedVolumes);
        if (parsed) {
          volumeStrings.push(parsed.volumeString);
          if (parsed.isNamedVolume) {
            // Extract volume name from "volumeName:/path"
            const volName = parsed.volumeString.split(':')[0];
            usedVolumes.add(volName);
          }
        } else {
          warnings.push(`Service '${serviceName}': could not parse volume '${JSON.stringify(vol)}'`);
        }
      }
      if (volumeStrings.length > 0) {
        mittwaldService.volumes = volumeStrings;
      }
    }

    // Convert command/entrypoint
    const command = parseCommand(service.command);
    if (command) {
      mittwaldService.command = command;
    }

    const entrypoint = parseCommand(service.entrypoint);
    if (entrypoint) {
      mittwaldService.entrypoint = entrypoint;
    }

    // Warn about unsupported features
    if (service.networks) {
      warnings.push(`Service '${serviceName}': 'networks' is not supported, using default networking`);
    }
    if (service.deploy) {
      warnings.push(`Service '${serviceName}': 'deploy' configuration is ignored`);
    }
    if (service.healthcheck) {
      warnings.push(`Service '${serviceName}': 'healthcheck' is not supported`);
    }
    if (service.depends_on) {
      warnings.push(`Service '${serviceName}': 'depends_on' is not supported, services start in parallel`);
    }

    services[serviceName] = mittwaldService;
  }

  // Create volume declarations for used named volumes
  for (const volName of usedVolumes) {
    volumes[volName] = { name: volName };
  }

  if (errors.length > 0) {
    return { success: false, warnings, errors };
  }

  return {
    success: true,
    declaration: { services, volumes },
    warnings,
    errors: [],
  };
}
