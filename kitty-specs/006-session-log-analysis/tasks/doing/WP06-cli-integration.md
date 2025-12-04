---
work_package_id: "WP06"
subtasks:
  - "T057"
  - "T058"
  - "T059"
  - "T060"
  - "T061"
  - "T062"
  - "T063"
  - "T064"
title: "CLI Interface & Integration"
phase: "Phase 3 - Integration"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
history:
  - timestamp: "2025-12-04T18:30:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP06 – CLI Interface & Integration

## Objectives & Success Criteria

- Wire up complete analysis pipeline as CLI tool
- Add `npm run analyze` script to package.json
- Implement progress logging and error handling
- Validate end-to-end on full 595 file corpus

**Success Metrics**:
- `npm run analyze` completes successfully
- Full analysis runs in <10 minutes
- All expected output files created
- Proper exit codes on success/failure

## Context & Constraints

- **Input**: Session logs in `tests/functional/session-logs/005-mcp-functional-test/`
- **Output**: All artifacts in `tests/functional/analysis-output/`
- **Depends on**: WP01, WP02, WP03, WP04, WP05
- **Related docs**: [plan.md](../../plan.md), [quickstart.md](../../quickstart.md), [spec.md](../../spec.md) FR-061

### Pipeline Flow
```
parse(inputDir) → detect(corpus) → map(corpus) → report(corpus, incidents, deps) → export(outputDir)
```

## Subtasks & Detailed Guidance

### T057 – Implement main entry point in src/analysis/index.ts
- **Purpose**: Central orchestration module.
- **Steps**:
  1. Create `tests/functional/src/analysis/index.ts`
  2. Export all public APIs from submodules
  3. Implement `runAnalysis(options: AnalysisOptions): Promise<AnalysisResult>`
  4. Orchestrate: parse → detect → map → report → summary
- **Files**: `tests/functional/src/analysis/index.ts`
- **Interface**:
  ```typescript
  interface AnalysisOptions {
    inputDir: string;
    outputDir: string;
    domain?: TestDomain;  // optional filter
    verbose?: boolean;
  }

  interface AnalysisResult {
    corpus: CorpusIndex;
    incidents: IncidentReport;
    dependencies: DependencyExport;
    domainReports: DomainReport[];
    summary: Summary;
    recommendations: Recommendation[];
    duration: number;
  }
  ```

### T058 – Implement CLI argument parser in src/analysis/cli.ts
- **Purpose**: Parse command-line arguments.
- **Steps**:
  1. Create `tests/functional/src/analysis/cli.ts`
  2. Use minimal arg parsing (process.argv or simple library)
  3. Support flags:
     - `--input <dir>`: Input directory (default: `./session-logs/005-mcp-functional-test`)
     - `--output <dir>`: Output directory (default: `./analysis-output`)
     - `--domain <name>`: Filter to single domain (optional)
     - `--verbose`: Enable detailed logging
     - `--help`: Show usage
- **Files**: `tests/functional/src/analysis/cli.ts`
- **Example Usage**:
  ```bash
  npx tsx src/analysis/cli.ts --input ./session-logs/005-mcp-functional-test --output ./analysis-output --verbose
  ```

### T059 – Wire up pipeline: parse → detect → map → report → export
- **Purpose**: Connect all modules in sequence.
- **Steps**:
  1. Add to `cli.ts`
  2. Implement main() async function
  3. Pipeline:
     ```typescript
     // 1. Parse all session logs
     const corpus = await parseDirectory(options.inputDir);

     // 2. Detect confusion patterns
     const incidents = detectAllPatterns(corpus.sessions);

     // 3. Map dependencies
     const dependencies = mapDependencies(corpus.sessions);

     // 4. Generate domain reports
     const domainReports = generateDomainReports(corpus, incidents, dependencies);

     // 5. Generate summary and recommendations
     const summary = generateSummary(corpus, incidents, dependencies, domainReports);
     const recommendations = extractRecommendations(corpus);

     // 6. Export all artifacts
     await exportAll(options.outputDir, { corpus, incidents, dependencies, domainReports, summary, recommendations });
     ```
- **Files**: `tests/functional/src/analysis/cli.ts`

### T060 – Add progress logging
- **Purpose**: Show progress to user during long operations.
- **Steps**:
  1. Add to `cli.ts`
  2. Implement `log(message: string)` function (respects --verbose)
  3. Log at each pipeline stage:
     - "Parsing 595 session logs..."
     - "Detecting confusion patterns..."
     - "Mapping tool dependencies..."
     - "Generating domain reports..."
     - "Creating summary and recommendations..."
     - "Exporting artifacts..."
  4. Include timing: "[12.5s] Parsing complete"
- **Files**: `tests/functional/src/analysis/cli.ts`
- **Example Output**:
  ```
  Session Log Analysis v1.0.0

  [0.0s] Starting analysis...
  [0.1s] Parsing 595 session logs...
  [5.2s] Parsing complete (595 sessions, 12,345 events)
  [5.2s] Detecting confusion patterns...
  [8.1s] Detection complete (234 incidents)
  [8.1s] Mapping tool dependencies...
  [9.5s] Mapping complete (89 dependencies)
  [9.5s] Generating domain reports...
  [12.0s] Reports complete (10 domains)
  [12.0s] Creating summary and recommendations...
  [13.2s] Summary complete (45 recommendations)
  [13.2s] Exporting artifacts...
  [14.5s] Export complete

  Analysis complete in 14.5s
  Output: ./analysis-output/
  ```

### T061 – Implement error handling and exit codes
- **Purpose**: Graceful error handling and proper exit codes.
- **Steps**:
  1. Add to `cli.ts`
  2. Wrap main() in try/catch
  3. Exit codes:
     - 0: Success
     - 1: Invalid arguments
     - 2: Input directory not found
     - 3: Parse errors (>10% failure rate)
     - 4: Output write failure
  4. Print helpful error messages
- **Files**: `tests/functional/src/analysis/cli.ts`
- **Error Examples**:
  ```
  Error: Input directory not found: ./nonexistent
  Hint: Use --input to specify session log directory
  Exit code: 2

  Error: Failed to parse 60 of 595 files (10.1%)
  Hint: Check session log format. See errors above.
  Exit code: 3
  ```

### T062 – Add `analyze` script to package.json
- **Purpose**: Enable `npm run analyze` convenience command.
- **Steps**:
  1. Edit `tests/functional/package.json`
  2. Add to scripts section:
     ```json
     "scripts": {
       "analyze": "tsx src/analysis/cli.ts",
       "analyze:verbose": "tsx src/analysis/cli.ts --verbose"
     }
     ```
  3. Verify tsx is in devDependencies
- **Files**: `tests/functional/package.json`

### T063 – Create analysis-output directory if missing
- **Purpose**: Ensure output directory exists.
- **Steps**:
  1. Add to `cli.ts` before export step
  2. Use `fs.mkdirSync(outputDir, { recursive: true })`
  3. Also create `reports/` subdirectory
- **Files**: `tests/functional/src/analysis/cli.ts`

### T064 – Validate end-to-end on full 595 file corpus
- **Purpose**: Final validation of complete pipeline.
- **Steps**:
  1. Run `npm run analyze` from tests/functional/
  2. Verify all output files created:
     - corpus-index.json
     - incidents.json
     - dependencies.json
     - dependencies.dot
     - summary.md
     - recommendations.json
     - recommendations.md
     - manifest.json
     - reports/*.md (10 files)
  3. Verify summary.md shows 595 sessions
  4. Check no errors in console output
  5. Verify exit code is 0
- **Files**: N/A (validation task)
- **Validation Commands**:
  ```bash
  cd tests/functional
  npm run analyze
  echo "Exit code: $?"

  # Verify files
  ls -la analysis-output/
  ls -la analysis-output/reports/

  # Check session count
  grep "Total sessions" analysis-output/summary.md

  # Render dependency graph
  dot -Tpng analysis-output/dependencies.dot -o /tmp/deps.png
  ```

## CLI Help Output

```
Session Log Analysis CLI

USAGE:
  npm run analyze [options]
  npx tsx src/analysis/cli.ts [options]

OPTIONS:
  --input <dir>     Input directory containing JSONL session logs
                    Default: ./session-logs/005-mcp-functional-test

  --output <dir>    Output directory for analysis artifacts
                    Default: ./analysis-output

  --domain <name>   Analyze only the specified domain
                    Options: identity, organization, project-foundation,
                             apps, containers, databases, domains-mail,
                             access-users, automation, backups

  --verbose         Enable detailed progress logging

  --help            Show this help message

EXAMPLES:
  npm run analyze
  npm run analyze -- --verbose
  npm run analyze -- --domain apps --verbose
  npx tsx src/analysis/cli.ts --input ./my-logs --output ./my-output

OUTPUT FILES:
  corpus-index.json      Indexed session data
  incidents.json         Detected confusion patterns
  dependencies.json      Tool dependency graph (JSON)
  dependencies.dot       Tool dependency graph (DOT/Graphviz)
  summary.md             Corpus-wide analysis summary
  recommendations.json   Tool chain recommendations (JSON)
  recommendations.md     Tool chain recommendations (Markdown)
  manifest.json          List of all generated artifacts
  reports/*.md           Per-domain analysis reports (10 files)
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Slow performance | Stream processing, avoid loading all in memory |
| Missing tsx | Add to devDependencies if not present |
| Relative path issues | Use path.resolve() for all paths |
| Permission errors | Check write permissions early |

## Definition of Done Checklist

- [ ] All 8 subtasks completed
- [ ] CLI parses arguments correctly
- [ ] Pipeline runs all stages in sequence
- [ ] Progress logging shows timing
- [ ] Error handling with exit codes
- [ ] `npm run analyze` works
- [ ] Output directory auto-created
- [ ] Full corpus validation passes
- [ ] All expected output files created

## Review Guidance

- Run `npm run analyze` and verify completion
- Check exit code is 0 on success
- Try invalid input dir, verify exit code 2
- Run with --verbose, verify detailed logging
- Check summary.md shows 595 sessions
- Time the full run, should be <10 minutes

## Activity Log

- 2025-12-04T18:30:00Z – system – lane=planned – Prompt created.
