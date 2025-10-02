import { readdir, readFile, writeFile } from 'fs/promises';
import { dirname, join, relative, resolve, sep } from 'path';
import { pathToFileURL } from 'url';

const ROOT = process.cwd();
const CLI_COMMANDS_DIR = resolve(ROOT, 'node_modules/@mittwald/cli/dist/commands');
const CONSTANTS_DIR = resolve(ROOT, 'src/constants/tool/mittwald-cli');
const HANDLERS_DIR = resolve(ROOT, 'src/handlers/tools/mittwald-cli');
const COVERAGE_JSON_PATH = resolve(ROOT, 'mw-cli-coverage.json');
const COVERAGE_DOC_PATH = resolve(ROOT, 'docs/mittwald-cli-coverage.md');
const EXCLUSION_CONFIG_PATH = resolve(ROOT, 'config', 'mw-cli-exclusions.json');
const SCHEMA_REFERENCE = './config/mw-cli-coverage.schema.json';

interface ToolRegistrationLike {
  tool: {
    name: string;
    description?: string;
    [key: string]: unknown;
  };
  handler: unknown;
  schema?: unknown;
}

interface ToolMetadata {
  toolPath: string;
  handlerImport: string;
}

interface CliCommandMeta {
  command: string;
  segments: string[];
  cliFile: string;
  description: string | null;
}

interface CoverageEntry extends CliCommandMeta {
  expectedToolName: string;
  status: 'covered' | 'missing';
  toolPath: string | null;
  handlerImport: string | null;
  exclusion?: {
    category: string;
    reason: string;
  };
}

interface CoverageReport {
  stats: {
    cliCommandCount: number;
    toolCount: number;
    coveredCount: number;
    missingCount: number;
    coveragePercent: number;
    extraToolCount: number;
    excludedCount: number;
  };
  coverage: CoverageEntry[];
  extraTools: Array<{
    toolName: string;
    relPath: string;
    handlerImport: string;
  }>;
  missing: CoverageEntry[];
}

function sortCoverageEntries(entries: CoverageEntry[], existingOrder: Map<string, number>): CoverageEntry[] {
  return entries.slice().sort((a, b) => {
    const indexA = existingOrder.get(a.command);
    const indexB = existingOrder.get(b.command);

    if (indexA !== undefined && indexB !== undefined) {
      return indexA - indexB;
    }

    if (indexA !== undefined) {
      return -1;
    }

    if (indexB !== undefined) {
      return 1;
    }

    return a.command.localeCompare(b.command);
  });
}

interface ExistingCoverageSnapshot {
  order: Map<string, number>;
  entries: Map<string, CoverageEntry>;
  extraToolOrder: Map<string, number>;
  extraTools: Map<string, { relPath: string; handlerImport: string }>;
}

async function loadExistingCoverageSnapshot(): Promise<ExistingCoverageSnapshot> {
  try {
    const raw = await readFile(COVERAGE_JSON_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<CoverageReport>;
    const order = new Map<string, number>();
    const entries = new Map<string, CoverageEntry>();

    parsed.coverage?.forEach((entry, index) => {
      const snapshot: CoverageEntry = {
        command: entry.command,
        segments: entry.segments ?? [],
        cliFile: entry.cliFile ?? '',
        description: entry.description ?? null,
        expectedToolName: entry.expectedToolName ?? '',
        status: entry.status === 'covered' ? 'covered' : 'missing',
        toolPath: entry.toolPath ?? null,
        handlerImport: entry.handlerImport ?? null,
        exclusion: entry.exclusion
      };
      order.set(snapshot.command, index);
      entries.set(snapshot.command, snapshot);
    });

    const extraToolOrder = new Map<string, number>();
    const extraTools = new Map<string, { relPath: string; handlerImport: string }>();

    parsed.extraTools?.forEach((tool, index) => {
      if (!tool?.toolName) {
        return;
      }
      extraToolOrder.set(tool.toolName, index);
      extraTools.set(tool.toolName, {
        relPath: tool.relPath ?? '',
        handlerImport: tool.handlerImport ?? ''
      });
    });

    return { order, entries, extraToolOrder, extraTools };
  } catch {
    return {
      order: new Map<string, number>(),
      entries: new Map<string, CoverageEntry>(),
      extraToolOrder: new Map<string, number>(),
      extraTools: new Map<string, { relPath: string; handlerImport: string }>()
    };
  }
}

interface ExclusionDefinition {
  category: string;
  reason: string;
}

interface ExclusionConfig {
  interactive?: string[];
  intentional?: string[];
  rationale?: {
    interactive?: string;
    intentional?: Record<string, string>;
    [key: string]: unknown;
  };
}

async function loadExclusionConfig(): Promise<Map<string, ExclusionDefinition>> {
  try {
    const raw = await readFile(EXCLUSION_CONFIG_PATH, 'utf8');
    const config = JSON.parse(raw) as ExclusionConfig;
    const exclusions = new Map<string, ExclusionDefinition>();

    const interactiveReason = typeof config.rationale?.interactive === 'string'
      ? config.rationale.interactive
      : 'Interactive command excluded until streaming support is available.';

    for (const command of config.interactive ?? []) {
      exclusions.set(command.trim(), {
        category: 'interactive',
        reason: interactiveReason
      });
    }

    const intentionalRationales = config.rationale?.intentional ?? {};
    for (const command of config.intentional ?? []) {
      const trimmed = command.trim();
      const reason = typeof intentionalRationales === 'object' && intentionalRationales !== null
        ? intentionalRationales[trimmed] ?? 'Intentional exclusion'
        : 'Intentional exclusion';

      exclusions.set(trimmed, {
        category: 'intentional',
        reason
      });
    }

    return exclusions;
  } catch (error) {
    console.warn(
      `Failed to load exclusion configuration from ${EXCLUSION_CONFIG_PATH}:`,
      error instanceof Error ? error.message : error
    );
    return new Map<string, ExclusionDefinition>();
  }
}

function toPosixPath(value: string): string {
  return value.split(sep).join('/');
}

async function collectFiles(dir: string, predicate: (filePath: string) => boolean): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectFiles(fullPath, predicate);
      files.push(...nested);
    } else if (entry.isFile() && predicate(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractRegistration(module: Record<string, unknown>): ToolRegistrationLike | null {
  const candidates: unknown[] = [];

  if (module && typeof module === 'object') {
    if ('default' in module) {
      candidates.push((module as Record<string, unknown>).default);
    }
    if ('registration' in module) {
      candidates.push((module as Record<string, unknown>).registration);
    }
  }

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === 'object' &&
      'tool' in candidate &&
      'handler' in candidate &&
      candidate.tool &&
      typeof (candidate as ToolRegistrationLike).tool?.name === 'string'
    ) {
      return candidate as ToolRegistrationLike;
    }
  }

  if (module && typeof module === 'object') {
    const values = Object.values(module);
    const toolExport = values.find((value) =>
      value &&
      typeof value === 'object' &&
      'name' in (value as Record<string, unknown>) &&
      'description' in (value as Record<string, unknown>) &&
      'inputSchema' in (value as Record<string, unknown>)
    );

    const handlerExport = values.find((value) => typeof value === 'function');

    if (
      toolExport &&
      handlerExport &&
      typeof (toolExport as { name?: unknown }).name === 'string'
    ) {
      return {
        tool: toolExport as ToolRegistrationLike['tool'],
        handler: handlerExport,
        schema: (toolExport as Record<string, unknown>)['inputSchema']
      } satisfies ToolRegistrationLike;
    }
  }

  return null;
}

async function loadToolDefinitions(): Promise<Map<string, ToolMetadata>> {
  const toolFiles = await collectFiles(CONSTANTS_DIR, (filePath) => filePath.endsWith('-cli.ts'));
  const tools = new Map<string, ToolMetadata>();

  for (const filePath of toolFiles) {
    const moduleUrl = pathToFileURL(filePath).href;
    const module = await import(moduleUrl);
    const registration = extractRegistration(module);

    if (!registration) {
      continue;
    }

    const toolName = registration.tool.name;

    const relPath = toPosixPath(relative(CONSTANTS_DIR, filePath));
    const source = await readFile(filePath, 'utf8');
    const handlerImportMatch = source.match(/from\s+['"]([^'"]*handlers\/tools\/mittwald-cli[^'"]+)['"]/);
    const handlerImport = handlerImportMatch
      ? handlerImportMatch[1]
      : toPosixPath(relative(dirname(filePath), resolve(HANDLERS_DIR, relPath).replace(/\.ts$/, '.js')));

    tools.set(toolName, {
      toolPath: relPath,
      handlerImport
    });
  }

  return tools;
}

async function loadCliCommands(): Promise<CliCommandMeta[]> {
  const commandFiles = await collectFiles(
    CLI_COMMANDS_DIR,
    (filePath) => filePath.endsWith('.js') && !filePath.endsWith('.test.js')
  ).catch(() => [] as string[]);

  if (!commandFiles.length) {
    throw new Error(
      `Unable to locate CLI commands under ${CLI_COMMANDS_DIR}. Ensure @mittwald/cli is installed.`
    );
  }

  const commands: CliCommandMeta[] = [];

  for (const filePath of commandFiles) {
    if (filePath.endsWith('.d.ts')) {
      continue;
    }

    const relPath = toPosixPath(relative(CLI_COMMANDS_DIR, filePath));
    const withoutExt = relPath.replace(/\.js$/, '');
    const segments = withoutExt.split('/');
    const command = segments.join(' ');

    let description: string | null = null;

    try {
      const moduleUrl = pathToFileURL(filePath).href;
      const module = await import(moduleUrl);
      const exports = Object.values(module as Record<string, unknown>);
      for (const exported of exports) {
        if (
          exported &&
          typeof exported === 'function' &&
          'description' in (exported as Record<string, unknown>)
        ) {
          const candidate = (exported as Record<string, unknown>).description;
          if (typeof candidate === 'string' && candidate.trim().length > 0) {
            description = candidate.trim();
            break;
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to read description for ${relPath}: ${(error as Error).message}`);
    }

    commands.push({
      command,
      segments,
      cliFile: relPath,
      description
    });
  }

  return commands;
}

function buildCoverage(
  cliCommands: CliCommandMeta[],
  tools: Map<string, ToolMetadata>,
  existingCoverage: Map<string, CoverageEntry>,
  existingExtraTools: Map<string, { relPath: string; handlerImport: string }>,
  existingExtraToolOrder: Map<string, number>,
  exclusions: Map<string, ExclusionDefinition>
): { report: CoverageReport; coverageEntries: CoverageEntry[]; extraTools: Map<string, ToolMetadata> } {
  const extraTools = new Map(tools);

  const coverageEntries = cliCommands.map<CoverageEntry>((commandMeta) => {
    const expectedToolName = `mittwald_${commandMeta.segments.map((segment) => segment.replace(/-/g, '_')).join('_')}`;
    const toolMeta = extraTools.get(expectedToolName);

    if (toolMeta) {
      extraTools.delete(expectedToolName);
    }

    const existingEntry = existingCoverage.get(commandMeta.command);
    const description = commandMeta.description ?? existingEntry?.description ?? null;
    const toolPath = toolMeta ? toolMeta.toolPath : existingEntry?.toolPath ?? null;
    let handlerImport: string | null = null;
    if (toolMeta) {
      handlerImport = existingEntry?.handlerImport ?? toolMeta.handlerImport;
    } else if (existingEntry?.handlerImport) {
      handlerImport = existingEntry.handlerImport;
    }

    const exclusion = !toolMeta ? exclusions.get(commandMeta.command) : undefined;

    return {
      ...commandMeta,
      description,
      expectedToolName,
      status: toolMeta ? 'covered' : 'missing',
      toolPath,
      handlerImport,
      exclusion
    };
  });

  const coveredCount = coverageEntries.filter((entry) => entry.status === 'covered').length;
  const cliCommandCount = coverageEntries.length;
  const missingEntries = coverageEntries.filter((entry) => entry.status === 'missing');
  const missingCount = missingEntries.length;
  const excludedCount = missingEntries.filter((entry) => entry.exclusion).length;
  const coveragePercent = cliCommandCount === 0 ? 0 : Math.round((coveredCount / cliCommandCount) * 100);
  const extraToolEntries = Array.from(extraTools.entries()).map(([toolName, meta]) => {
    const existing = existingExtraTools.get(toolName);
    return {
      toolName,
      relPath: meta.toolPath,
      handlerImport: existing?.handlerImport ?? meta.handlerImport
    };
  });

  extraToolEntries.sort((a, b) => {
    const indexA = existingExtraToolOrder.get(a.toolName);
    const indexB = existingExtraToolOrder.get(b.toolName);

    if (indexA !== undefined && indexB !== undefined) {
      return indexA - indexB;
    }

    if (indexA !== undefined) {
      return -1;
    }

    if (indexB !== undefined) {
      return 1;
    }

    return a.toolName.localeCompare(b.toolName);
  });

  const report: CoverageReport = {
    stats: {
      cliCommandCount,
      toolCount: tools.size,
      coveredCount,
      missingCount,
      coveragePercent,
      extraToolCount: extraToolEntries.length,
      excludedCount
    },
    coverage: coverageEntries,
    extraTools: extraToolEntries,
    missing: coverageEntries.filter((entry) => entry.status === 'missing')
  };

  return { report, coverageEntries, extraTools };
}

interface DocMetadata {
  notes: Map<string, string>;
  order: Map<string, number>;
}

async function loadExistingDocMetadata(): Promise<DocMetadata> {
  try {
    const markdown = await readFile(COVERAGE_DOC_PATH, 'utf8');
    const notes = new Map<string, string>();
    const order = new Map<string, number>();
    const lines = markdown.split('\n');
    let index = 0;

    for (const line of lines) {
      if (!line.startsWith('|')) {
        continue;
      }

      const cells = line.split('|').map((cell) => cell.trim());

      if (cells.length < 7) {
        continue;
      }

      const command = cells[1];
      const note = cells[6];

      if (!command || command === 'CLI Command') {
        continue;
      }

      if (!order.has(command)) {
        order.set(command, index++);
      }

      if (note) {
        notes.set(command, note);
      }
    }

    return { notes, order };
  } catch {
    return { notes: new Map<string, string>(), order: new Map<string, number>() };
  }
}

async function writeCoverageJson(report: CoverageReport): Promise<void> {
  const serializeEntry = (entry: CoverageEntry) => {
    const base: Record<string, unknown> = {
      command: entry.command,
      segments: entry.segments,
      cliFile: entry.cliFile,
      description: entry.description,
      expectedToolName: entry.expectedToolName,
      status: entry.status,
      toolPath: entry.toolPath,
      handlerImport: entry.handlerImport
    };

    if (entry.exclusion) {
      base.exclusion = entry.exclusion;
    }

    return base;
  };

  const coverage = report.coverage.map(serializeEntry);
  const missing = report.missing.map(serializeEntry);

  const output = {
    $schema: SCHEMA_REFERENCE,
    stats: report.stats,
    coverage,
    missing,
    extraTools: report.extraTools
  };

  await writeFile(COVERAGE_JSON_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
}

function formatStatus(entry: CoverageEntry): string {
  return entry.status === 'covered' ? '✅ Covered' : '⚠️ Missing';
}

async function writeCoverageMarkdown(
  coverageEntries: CoverageEntry[],
  stats: CoverageReport['stats'],
  docMetadata: DocMetadata
): Promise<void> {
  const lines: string[] = [];

  lines.push('# Mittwald CLI Coverage Matrix', '');
  lines.push(`Total CLI commands: ${stats.cliCommandCount}`, '');
  lines.push(`Covered by MCP tools: ${stats.coveredCount}`, '');
  lines.push(`Missing wrappers: ${stats.missingCount}`, '');
  lines.push('Status legend: ✅ Covered, ⚠️ Missing, ➖ Not Applicable', '');

  const grouped = new Map<string, CoverageEntry[]>();
  for (const entry of coverageEntries) {
    const topic = entry.segments[0];
    if (!grouped.has(topic)) {
      grouped.set(topic, []);
    }
    grouped.get(topic)?.push(entry);
  }

  const sortedTopics = Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b));

  for (const topic of sortedTopics) {
    lines.push(`## ${topic}`, '');
    lines.push('| CLI Command | Description | Status | MCP Tool | Tool Definition | Notes |');
    lines.push('| --- | --- | --- | --- | --- | --- |');

    const rows = (grouped.get(topic) ?? []).slice().sort((a, b) => {
      const orderA = docMetadata.order.get(a.command);
      const orderB = docMetadata.order.get(b.command);

      if (orderA !== undefined && orderB !== undefined) {
        return orderA - orderB;
      }

      if (orderA !== undefined) {
        return -1;
      }

      if (orderB !== undefined) {
        return 1;
      }

      return a.command.localeCompare(b.command);
    });

    for (const entry of rows) {
      const toolName = entry.status === 'covered' ? entry.expectedToolName : '';
      const toolDefinition = entry.status === 'covered' && entry.toolPath
        ? `src/constants/tool/mittwald-cli/${entry.toolPath}`
        : '';
      const docNote = docMetadata.notes.get(entry.command) ?? '';
      const exclusionNote = entry.exclusion
        ? `Allowed missing (${entry.exclusion.category}): ${entry.exclusion.reason}`
        : '';
      const note = docNote
        ? exclusionNote
          ? `${docNote} — ${exclusionNote}`
          : docNote
        : exclusionNote;
      const description = (entry.description ?? '').replace(/\s+/g, ' ').trim();

      lines.push(
        `| ${entry.command} | ${description} | ${formatStatus(entry)} | ${toolName} | ${toolDefinition} | ${note} |`
      );
    }

    lines.push('');
  }

  await writeFile(COVERAGE_DOC_PATH, `${lines.join('\n')}\n`, 'utf8');
}

async function main(): Promise<void> {
  try {
    const tools = await loadToolDefinitions();
    const cliCommands = await loadCliCommands();
    const existingSnapshot = await loadExistingCoverageSnapshot();
    const exclusions = await loadExclusionConfig();
    const { report } = buildCoverage(
      cliCommands,
      tools,
      existingSnapshot.entries,
      existingSnapshot.extraTools,
      existingSnapshot.extraToolOrder,
      exclusions
    );
    const sortedCoverage = sortCoverageEntries(report.coverage, existingSnapshot.order);
    report.coverage = sortedCoverage;
    report.missing = sortedCoverage.filter((entry) => entry.status === 'missing');
    report.stats.missingCount = report.missing.length;
    report.stats.excludedCount = report.missing.filter((entry) => entry.exclusion).length;
    const docMetadata = await loadExistingDocMetadata();

    await writeCoverageJson(report);
    await writeCoverageMarkdown(sortedCoverage, report.stats, docMetadata);

    console.log('✅ Generated MW CLI coverage artifacts.');
  } catch (error) {
    console.error('❌ Failed to generate MW CLI coverage artifacts:', error);
    process.exitCode = 1;
  }
}

void main();
