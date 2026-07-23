#!/usr/bin/env tsx

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MANIFEST_FILE = path.join(__dirname, '../tools-manifest.json');
const TOOLS_DIR = path.join(__dirname, '../src/content/docs/tools');
const REPORT_FILE = path.join(__dirname, '../coverage-report.json');
const OPENAPI_FILE = path.join(__dirname, '../openapi.json');

interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
  details?: any;
}

interface CoverageReport {
  timestamp: string;
  valid: boolean;
  toolsExpected: number;
  toolsFound: number;
  markdownFilesFound: number;
  domainsExpected: number;
  domainsFound: number;
  issues: ValidationIssue[];
  byDomain: Record<string, { expected: number; found: number }>;
}

interface ToolsManifest {
  version: string;
  generatedAt: string;
  totalTools: number;
  tools: Record<string, any[]>;
}

async function validateCoverage(): Promise<CoverageReport> {
  console.log('Validating tool coverage...\n');

  const issues: ValidationIssue[] = [];
  const byDomain: Record<string, { expected: number; found: number }> = {};

  // Step 1: Validate manifest file exists
  let manifest: ToolsManifest;
  try {
    const content = await fs.readFile(MANIFEST_FILE, 'utf-8');
    manifest = JSON.parse(content);
    console.log(`✓ Manifest found: ${manifest.totalTools} tools`);
  } catch (error) {
    issues.push({
      type: 'error',
      message: 'tools-manifest.json not found or invalid',
      details: error,
    });
    return createReport(0, 0, 0, 0, issues, byDomain);
  }

  // Step 2: Validate OpenAPI file exists
  let openapiValid = false;
  try {
    const content = await fs.readFile(OPENAPI_FILE, 'utf-8');
    const openapi = JSON.parse(content);
    if (openapi.openapi && openapi.info && openapi.paths) {
      openapiValid = true;
      console.log(`✓ OpenAPI schema found with ${Object.keys(openapi.paths).length} paths`);
    } else {
      issues.push({
        type: 'error',
        message: 'openapi.json is missing required fields',
      });
    }
  } catch (error) {
    issues.push({
      type: 'error',
      message: 'openapi.json not found or invalid',
      details: error,
    });
  }

  // Step 3: The manifest is regenerated from the tool registry, so it — not a
  // hardcoded table — is the expectation the published pages are checked against.
  const EXPECTED_TOTAL = manifest.totalTools;

  const domainsInManifest = Object.keys(manifest.tools).filter(d => manifest.tools[d].length > 0);
  console.log(`\n✓ Domains found: ${domainsInManifest.length}`);

  // Step 4: Every tool in the manifest must have a page, and vice versa.
  for (const domain of domainsInManifest) {
    const expectedCount = manifest.tools[domain].length;
    const domainPages = await glob(`${TOOLS_DIR}/${domain}/*.md`);
    const foundCount = domainPages.filter(f => !f.endsWith('index.md')).length;
    byDomain[domain] = { expected: expectedCount, found: foundCount };

    if (foundCount !== expectedCount) {
      issues.push({
        type: 'error',
        message: `Domain ${domain}: manifest lists ${expectedCount} tools, found ${foundCount} pages`,
      });
    } else {
      console.log(`  ✓ Domain ${domain}: ${foundCount} tools`);
    }
  }

  // Step 5: Check for page directories with no corresponding manifest domain.
  const pageDirs = (await glob(`${TOOLS_DIR}/*/index.md`)).map(f => path.basename(path.dirname(f)));
  for (const domain of pageDirs) {
    if (!domainsInManifest.includes(domain)) {
      issues.push({
        type: 'error',
        message: `Pages exist for domain '${domain}', which is not in the manifest — regenerate the reference`,
      });
    }
  }

  // Step 6: Validate markdown files exist
  const markdownFiles = await glob(`${TOOLS_DIR}/**/*.md`);
  const markdownCount = markdownFiles.filter(f => !f.endsWith('index.md')).length;

  console.log(`\n✓ Markdown files found: ${markdownCount}`);

  if (markdownCount !== EXPECTED_TOTAL) {
    issues.push({
      type: 'error',
      message: `Expected ${EXPECTED_TOTAL} markdown files, found ${markdownCount}`,
    });
  }

  // Step 7: Validate each markdown file has frontmatter and required sections
  const sampleCheckLimit = Math.min(20, markdownFiles.length);
  for (const file of markdownFiles.slice(0, sampleCheckLimit)) {
    if (file.endsWith('index.md')) continue;

    try {
      const content = await fs.readFile(file, 'utf-8');

      // Check frontmatter
      if (!content.startsWith('---')) {
        issues.push({
          type: 'warning',
          message: `Missing frontmatter: ${path.basename(file)}`,
        });
      }

      // Check for required sections
      if (!content.includes('# ')) {
        issues.push({
          type: 'warning',
          message: `Missing heading: ${path.basename(file)}`,
        });
      }
    } catch (err) {
      issues.push({
        type: 'error',
        message: `Cannot read markdown file: ${path.basename(file)}`,
        details: err,
      });
    }
  }

  // Step 8: Check for domain landing pages
  const domainIndexFiles = await glob(`${TOOLS_DIR}/*/index.md`);
  console.log(`\n✓ Domain landing pages found: ${domainIndexFiles.length}`);

  if (domainIndexFiles.length < domainsInManifest.length) {
    issues.push({
      type: 'warning',
      message: `Expected ${domainsInManifest.length} domain landing pages, found ${domainIndexFiles.length}`,
    });
  }

  return createReport(EXPECTED_TOTAL, markdownCount, domainsInManifest.length, domainIndexFiles.length, issues, byDomain);
}

function createReport(
  expected: number,
  found: number,
  domainsExpected: number,
  domainsFound: number,
  issues: ValidationIssue[],
  byDomain: Record<string, any>
): CoverageReport {
  const valid = issues.filter(i => i.type === 'error').length === 0;

  return {
    timestamp: new Date().toISOString(),
    valid,
    toolsExpected: expected,
    toolsFound: found,
    markdownFilesFound: found,
    domainsExpected: domainsExpected,
    domainsFound: domainsFound,
    issues,
    byDomain,
  };
}

async function main() {
  try {
    const report = await validateCoverage();

    // Write report
    await fs.writeFile(
      REPORT_FILE,
      JSON.stringify(report, null, 2),
      'utf-8'
    );

    console.log(`\n📊 Coverage Report: ${REPORT_FILE}`);

    // Print issues
    if (report.issues.length > 0) {
      console.log('\n⚠️  Issues found:');
      report.issues.forEach(issue => {
        const symbol = issue.type === 'error' ? '❌' : '⚠️ ';
        console.log(`${symbol} ${issue.message}`);
      });
    }

    // Exit with error if validation failed
    if (!report.valid) {
      console.error('\n❌ Validation failed');
      process.exit(1);
    } else {
      console.log('\n✅ Validation passed');
    }

  } catch (error) {
    console.error('Validation failed:', error);
    process.exit(1);
  }
}

main();
