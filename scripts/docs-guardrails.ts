import { readdir, readFile } from 'node:fs/promises';
import { extname, join, resolve, relative, basename, dirname } from 'node:path';

const ROOT = process.cwd();
const DOCS_ROOT = resolve(ROOT, 'docs/setup-and-guides/src/content/docs');
const TUTORIALS_DIR = resolve(DOCS_ROOT, 'tutorials');
const CODEX_DOC = resolve(DOCS_ROOT, 'getting-connected/codex-cli.md');
const USE_CASE_ROOT = resolve(ROOT, 'tests/functional/use-case-library');
const HELP_SNAPSHOTS = [
  resolve(ROOT, 'docs/setup-and-guides/ci/cli-help/codex.help.txt'),
  resolve(ROOT, 'docs/setup-and-guides/ci/cli-help/codex-mcp.help.txt'),
  resolve(ROOT, 'docs/setup-and-guides/ci/cli-help/codex-mcp-add.help.txt'),
  resolve(ROOT, 'docs/setup-and-guides/ci/cli-help/codex-mcp-login.help.txt')
] as const;

const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx']);
const REQUIRED_TUTORIAL_HEADINGS = [
  'Copy-paste prompt',
  'What the agent will do automatically',
  'What you (human) must still do',
  'Likely questions the agent will ask and good answers',
  'Verification prompt',
  'Rollback/cleanup prompt',
  'Resume after failure'
] as const;

interface GuardrailResult {
  errors: string[];
  warnings: string[];
}

function parseFrontmatter(content: string): string {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  return match?.[1] ?? '';
}

function parseUseCases(frontmatter: string): string[] {
  const listBlock = frontmatter.match(/(^|\n)useCases:\s*\n((?:\s*-\s*[^\n]+\n?)+)/m);
  if (!listBlock) {
    return [];
  }

  return listBlock[2]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('-'))
    .map((line) => line.replace(/^-\s*/, '').trim())
    .filter(Boolean);
}

function parseDestructive(frontmatter: string): boolean {
  const match = frontmatter.match(/(^|\n)destructive:\s*(true|false)\s*(\n|$)/m);
  return match?.[2] === 'true';
}

function parseLevel2Headings(content: string): string[] {
  const headings: string[] = [];
  const matches = content.matchAll(/^##\s+(.+)$/gm);

  for (const match of matches) {
    if (match[1]) {
      headings.push(match[1].trim());
    }
  }

  return headings;
}

async function collectFiles(dir: string, filter: (path: string) => boolean): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await collectFiles(fullPath, filter)));
      continue;
    }

    if (entry.isFile() && filter(fullPath)) {
      out.push(fullPath);
    }
  }

  return out;
}

function normalizeRoute(input: string): string {
  if (!input.startsWith('/')) {
    return `/${input}`;
  }

  return input;
}

function trimLinkTarget(target: string): string {
  const noHash = target.split('#')[0];
  const noQuery = noHash.split('?')[0];
  return normalizeRoute(noQuery);
}

function routeFromFile(file: string): string {
  const rel = relative(DOCS_ROOT, file).replace(/\\/g, '/');
  const ext = extname(rel);
  const withoutExt = rel.slice(0, -ext.length);

  if (basename(withoutExt) === 'index') {
    const dir = dirname(withoutExt) === '.' ? '' : dirname(withoutExt);
    if (!dir) {
      return '/';
    }
    return `/${dir}/`;
  }

  return `/${withoutExt}/`;
}

function addRouteVariants(routeSet: Set<string>, route: string): void {
  routeSet.add(route);
  if (route !== '/' && route.endsWith('/')) {
    routeSet.add(route.slice(0, -1));
  }
}

async function loadUseCaseIds(): Promise<Set<string>> {
  const jsonFiles = await collectFiles(USE_CASE_ROOT, (path) => path.endsWith('.json'));
  const ids = new Set<string>();

  for (const file of jsonFiles) {
    const raw = await readFile(file, 'utf8');
    try {
      const parsed = JSON.parse(raw) as { id?: string };
      if (parsed.id) {
        ids.add(parsed.id);
      }
    } catch {
      // Ignore malformed JSON here; test suite validation owns JSON correctness.
    }
  }

  return ids;
}

async function validateCodexCommands(result: GuardrailResult): Promise<void> {
  const content = await readFile(CODEX_DOC, 'utf8');

  const bannedPatterns: Array<{ pattern: RegExp; message: string }> = [
    { pattern: /\bcodex\s+mpc\s+add\b/i, message: 'Found typo `codex mpc add` in Codex docs.' },
    { pattern: /\bcodex\s+mcp\s+disconnect\b/i, message: 'Found unsupported command `codex mcp disconnect`.' },
    { pattern: /--auth\s+oauth\b/i, message: 'Found unsupported flag `--auth oauth`.' },
    { pattern: /--oauth-server\b/i, message: 'Found unsupported flag `--oauth-server`.' },
    { pattern: /--client-id\b/i, message: 'Found unsupported flag `--client-id`.' },
    {
      pattern: /--bearer-token-env(?!-var)\b/i,
      message: 'Found outdated flag `--bearer-token-env`; use `--bearer-token-env-var`.'
    }
  ];

  for (const entry of bannedPatterns) {
    if (entry.pattern.test(content)) {
      result.errors.push(entry.message);
    }
  }

  const snapshotFlags = new Set<string>();
  for (const snapshot of HELP_SNAPSHOTS) {
    const snapshotText = await readFile(snapshot, 'utf8');
    for (const flag of snapshotText.match(/--[a-z0-9-]+/gi) ?? []) {
      snapshotFlags.add(flag.toLowerCase());
    }
  }

  const docFlags = new Set(
    (content.match(/--[a-z0-9-]+/gi) ?? [])
      .map((flag) => flag.toLowerCase())
      .filter((flag) => flag !== '---')
  );
  for (const flag of docFlags) {
    if (!snapshotFlags.has(flag)) {
      result.errors.push(
        `Codex docs use unsupported flag \`${flag}\` (not present in CLI help snapshots).`
      );
    }
  }
}

async function validateInternalLinks(result: GuardrailResult): Promise<void> {
  const docsFiles = await collectFiles(DOCS_ROOT, (path) => MARKDOWN_EXTENSIONS.has(extname(path)));
  const knownRoutes = new Set<string>();

  for (const file of docsFiles) {
    addRouteVariants(knownRoutes, routeFromFile(file));
  }

  for (const file of docsFiles) {
    const content = await readFile(file, 'utf8');
    const relPath = relative(ROOT, file).replace(/\\/g, '/');
    const links = content.match(/\[[^\]]+\]\((\/[^)]+)\)/g) ?? [];

    for (const rawLink of links) {
      const targetMatch = rawLink.match(/\((\/[^)]+)\)/);
      if (!targetMatch) {
        continue;
      }

      const target = trimLinkTarget(targetMatch[1]);
      if (!target || target === '/') {
        continue;
      }

      // /reference is a separate docs surface and intentionally linked cross-site.
      if (target.startsWith('/reference')) {
        continue;
      }

      if (!knownRoutes.has(target)) {
        result.errors.push(`Broken internal route \`${target}\` in ${relPath}`);
      }
    }
  }
}

async function validateTutorialMappings(result: GuardrailResult): Promise<void> {
  const useCaseIds = await loadUseCaseIds();
  const tutorialFiles = (await collectFiles(TUTORIALS_DIR, (path) => path.endsWith('.md'))).filter(
    (path) => basename(path) !== 'index.md'
  );

  for (const tutorialFile of tutorialFiles) {
    const content = await readFile(tutorialFile, 'utf8');
    const frontmatter = parseFrontmatter(content);
    const useCases = parseUseCases(frontmatter);
    const destructive = parseDestructive(frontmatter);
    const headings = parseLevel2Headings(content);
    const relPath = relative(ROOT, tutorialFile).replace(/\\/g, '/');

    if (useCases.length === 0) {
      result.errors.push(`Tutorial missing useCases mapping: ${relPath}`);
      continue;
    }

    for (const id of useCases) {
      if (!useCaseIds.has(id)) {
        result.errors.push(`Tutorial references unknown use-case ID \`${id}\` in ${relPath}`);
      }
    }

    if (headings[0] !== REQUIRED_TUTORIAL_HEADINGS[0]) {
      result.errors.push(
        `Tutorial must start with \`## ${REQUIRED_TUTORIAL_HEADINGS[0]}\`: ${relPath}`
      );
    }

    const headingIndexes = new Map<string, number>();
    for (const heading of REQUIRED_TUTORIAL_HEADINGS) {
      const idx = headings.indexOf(heading);
      if (idx === -1) {
        result.errors.push(`Tutorial missing section \`## ${heading}\`: ${relPath}`);
        continue;
      }
      headingIndexes.set(heading, idx);
    }

    let previousIndex = -1;
    for (const heading of REQUIRED_TUTORIAL_HEADINGS) {
      const currentIndex = headingIndexes.get(heading);
      if (currentIndex === undefined) {
        continue;
      }
      if (currentIndex <= previousIndex) {
        result.errors.push(
          `Tutorial sections are out of order (expected \`## ${heading}\` later): ${relPath}`
        );
        break;
      }
      previousIndex = currentIndex;
    }

    if (destructive) {
      if (!/##\s+Verification Prompt/i.test(content)) {
        result.errors.push(`Destructive tutorial missing 'Verification Prompt' section: ${relPath}`);
      }
      if (!/##\s+Rollback\/Cleanup Prompt/i.test(content)) {
        result.errors.push(`Destructive tutorial missing 'Rollback/Cleanup Prompt' section: ${relPath}`);
      }
    }
  }
}

async function main(): Promise<void> {
  const result: GuardrailResult = {
    errors: [],
    warnings: []
  };

  await validateCodexCommands(result);
  await validateInternalLinks(result);
  await validateTutorialMappings(result);

  if (result.warnings.length > 0) {
    console.warn('Docs guardrails warnings:');
    for (const warning of result.warnings) {
      console.warn(`- ${warning}`);
    }
  }

  if (result.errors.length > 0) {
    console.error('Docs guardrails failed:');
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('Docs guardrails passed.');
}

void main();
