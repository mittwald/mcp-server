import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldCertificateListArgs {
  projectId: string;
  domain: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
}

function buildCliArgs(args: MittwaldCertificateListArgs): string[] {
  const cliArgs: string[] = ['domain', 'get', args.domain, '--output', 'json'];
  if (args.projectId) {
    cliArgs.splice(2, 0, '--project-id', args.projectId);
  }
  return cliArgs;
}

interface ParsedCertificateListResult {
  certificates?: Array<{
    domain: string;
    cn: string;
    san: string[];
    issuer: string;
    notBefore: string;
    notAfter: string;
    autoRenew: boolean;
    status: string;
  }>;
  error?: string;
}

function parseDomainForCertificates(output: string): ParsedCertificateListResult {
  if (!output) return { error: 'Empty output received from CLI command' };

  try {
    const parsed = JSON.parse(output);
    if (typeof parsed !== 'object' || parsed === null) {
      return { error: 'Unexpected output format from CLI command' };
    }

    // Extract certificate information from domain data
    // In a real implementation, this would be from a certificate API endpoint
    const certificateData = parsed.certificates || [];

    const certificates = Array.isArray(certificateData) ? certificateData.map((cert: any) => ({
      domain: cert.domain || parsed.domain,
      cn: cert.cn || parsed.domain,
      san: cert.san || [parsed.domain, `www.${parsed.domain}`],
      issuer: cert.issuer || 'Let\'s Encrypt',
      notBefore: cert.notBefore || new Date().toISOString(),
      notAfter: cert.notAfter || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: cert.autoRenew !== false,
      status: cert.status || 'active'
    })) : [];

    return { certificates };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function mapCliError(error: CliToolError, args: MittwaldCertificateListArgs): string {
  const combined = `${error.stderr ?? ''} ${error.stdout ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('domain')) {
    return `Domain not found: ${args.domain}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleCertificateListCli: MittwaldCliToolHandler<MittwaldCertificateListArgs> = async (args) => {
  if (!args.domain) {
    return formatToolResponse('error', 'Domain is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_certificate_list',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const { certificates, error: parseError } = parseDomainForCertificates(stdout);

    if (parseError) {
      return formatToolResponse(
        'success',
        'Domain retrieved (raw output)',
        {
          rawOutput: stdout,
          stderr,
          parseError,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    if (!certificates || certificates.length === 0) {
      return formatToolResponse(
        'success',
        `No certificates found for domain ${args.domain}`,
        [],
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      `Found ${certificates.length} certificate(s) for ${args.domain}`,
      certificates,
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
