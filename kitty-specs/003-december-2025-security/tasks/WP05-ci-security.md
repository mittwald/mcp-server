---
work_package_id: WP05
title: CI Security Pipeline
lane: done
history:
- timestamp: '2025-12-03T14:00:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
agent: ''
assignee: ''
phase: Phase 2 - Security Hardening (P1)
shell_pid: ''
subtasks:
- T027
- T028
- T029
- T030
- T031
- T032
---

# Work Package Prompt: WP05 – CI Security Pipeline

## Objectives & Success Criteria

- **Primary Objective**: Add automated security scanning to PR workflow using GitHub-native tools
- **Success Criteria**:
  - Dependabot creates PRs for vulnerable dependencies
  - CodeQL scans TypeScript code on PRs
  - Secret scanning is enabled for the repository
  - PRs with HIGH/CRITICAL CVEs are blocked

## Context & Constraints

- **Spec Reference**: `kitty-specs/003-december-2025-security/spec.md` - User Story 5, FR-009 to FR-011
- **Research**: `kitty-specs/003-december-2025-security/research.md` - Section 4 (CI security)

**Architectural Constraints**:
- Use GitHub-native tools only (no external services)
- Free tier features (public repo or GitHub Enterprise)
- Configure for TypeScript/JavaScript ecosystem

## Subtasks & Detailed Guidance

### Subtask T027 – Create dependabot.yml

**Purpose**: Enable automatic dependency vulnerability detection and updates.

**Steps**:
1. Create `.github/dependabot.yml`
2. Configure for npm ecosystem:
   ```yaml
   version: 2
   updates:
     - package-ecosystem: "npm"
       directory: "/"
       schedule:
         interval: "weekly"
         day: "monday"
         time: "09:00"
         timezone: "Europe/Berlin"
       open-pull-requests-limit: 10
       groups:
         production-dependencies:
           patterns:
             - "*"
           exclude-patterns:
             - "@types/*"
             - "eslint*"
             - "vitest*"
             - "typescript"
         dev-dependencies:
           dependency-type: "development"
       labels:
         - "dependencies"
         - "security"
       commit-message:
         prefix: "deps"
   ```
3. Also configure for packages/oauth-bridge if separate package.json

**Files**:
- CREATE: `.github/dependabot.yml`

**Parallel?**: Yes - independent of other CI files

### Subtask T028 – Create codeql.yml workflow

**Purpose**: Enable SAST analysis with CodeQL on PRs and pushes.

**Steps**:
1. Create `.github/workflows/codeql.yml`
2. Configure for TypeScript:
   ```yaml
   name: "CodeQL"

   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]
     schedule:
       - cron: '0 0 * * 1'  # Weekly on Monday at midnight

   jobs:
     analyze:
       name: Analyze
       runs-on: ubuntu-latest
       permissions:
         actions: read
         contents: read
         security-events: write

       strategy:
         fail-fast: false
         matrix:
           language: ['typescript']

       steps:
         - name: Checkout repository
           uses: actions/checkout@v4

         - name: Initialize CodeQL
           uses: github/codeql-action/init@v3
           with:
             languages: ${{ matrix.language }}
             config-file: ./.github/codeql/codeql-config.yml

         - name: Perform CodeQL Analysis
           uses: github/codeql-action/analyze@v3
           with:
             category: "/language:${{ matrix.language }}"
   ```

**Files**:
- CREATE: `.github/workflows/codeql.yml`

**Parallel?**: Yes - independent of other CI files

### Subtask T029 – Enable GitHub Secret Scanning

**Purpose**: Detect secrets accidentally committed to the repository.

**Steps**:
1. Navigate to repository settings → Security → Code security and analysis
2. Enable "Secret scanning"
3. Enable "Push protection" (blocks pushes containing secrets)
4. Optionally enable "Secret scanning alerts" for private repos

**Files**:
- No files - repository settings change

**Documentation**: Record in docs or README that secret scanning is enabled

**Parallel?**: Yes - independent of other CI files

**Notes**:
- This is a repository setting, not a workflow file
- Free for public repositories
- Requires GitHub Advanced Security for private repos

### Subtask T030 – Create CodeQL config

**Purpose**: Configure CodeQL to exclude test fixtures and reduce noise.

**Steps**:
1. Create `.github/codeql/codeql-config.yml`
2. Configure paths and queries:
   ```yaml
   name: "CodeQL Config"

   paths-ignore:
     - "tests/fixtures/**"
     - "tests/mocks/**"
     - "**/*.test.ts"
     - "**/*.spec.ts"
     - "node_modules/**"
     - "build/**"
     - "dist/**"

   queries:
     - uses: security-and-quality
     - uses: security-extended

   query-filters:
     - exclude:
         id: js/unused-local-variable
     - exclude:
         id: js/useless-expression
   ```

**Files**:
- CREATE: `.github/codeql/codeql-config.yml`

**Parallel?**: Yes - can be created alongside other files

### Subtask T031 – Test CI with vulnerable dependency

**Purpose**: Verify the security pipeline catches vulnerabilities.

**Steps**:
1. Create a test branch
2. Add a known-vulnerable package to package.json:
   ```json
   {
     "devDependencies": {
       "lodash": "4.17.15"  // Known CVE-2020-8203
     }
   }
   ```
3. Create PR to main
4. Verify Dependabot creates a security alert
5. Verify CodeQL runs and completes
6. Clean up test branch

**Files**:
- TEMPORARY: Test branch with vulnerable dependency

**Notes**:
- Use an older version with known CVE
- Document the test in PR description
- Delete test branch after verification

### Subtask T032 – Document CI security workflow

**Purpose**: Help contributors understand security scanning.

**Steps**:
1. Add section to README.md or create CONTRIBUTING.md:
   ```markdown
   ## Security Scanning

   This repository uses GitHub's native security features:

   - **Dependabot**: Automatically creates PRs for vulnerable dependencies
   - **CodeQL**: Static analysis for security vulnerabilities
   - **Secret Scanning**: Prevents accidental commit of secrets

   ### What to do when security alerts appear

   1. Dependabot alerts: Review and merge dependency update PRs
   2. CodeQL findings: Fix issues before merging PR
   3. Secret scanning: Rotate compromised secret immediately
   ```

**Files**:
- MODIFY: `README.md` or CREATE: `CONTRIBUTING.md`

**Parallel?**: Yes - documentation can be written anytime

## Test Strategy

**Validation**:
- Manually verify Dependabot is enabled (T031)
- Create test PR to verify CodeQL runs
- Check security tab in repository settings

**No Automated Tests**: CI configuration is validated by GitHub

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Too many Dependabot PRs | Set open-pull-requests-limit to 10; use groups |
| CodeQL false positives | Configure exclusions in codeql-config.yml |
| Secret scanning not available | Verify GitHub plan supports feature |

## Definition of Done Checklist

- [ ] dependabot.yml created and Dependabot is active
- [ ] codeql.yml workflow runs on PRs
- [ ] CodeQL config excludes test fixtures
- [ ] Secret scanning enabled in repository settings
- [ ] Test PR triggered security scans
- [ ] Documentation updated

## Review Guidance

- Verify Dependabot shows in repository Insights → Dependency graph
- Check Actions tab for CodeQL workflow runs
- Verify Security tab shows enabled features
- Review CodeQL config exclusions are appropriate

## Activity Log

- 2025-12-03T14:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
