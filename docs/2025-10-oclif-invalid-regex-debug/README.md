# Oclif "Invalid regular expression flags" Debugging

## Issue Snapshot
- Tool call `mittwald_org_invite_list_own` invokes `mw org invite list-own --output json --token <redacted>`.
- In at least one runtime (see `evidence/user-report.log`) `@oclif/core@4.5.4` emits repeated `SyntaxError: Invalid regular expression flags` warnings while resolving commands, then aborts with `command org:invite:list-own not found`.
- The MCP handler wraps this as `Failed to list user's organization invites`, causing the tool to surface an error instead of CLI output.

## Evidence Inventory
- `evidence/user-report.log` – excerpt from the failing MCP tool invocation showing repeated `findCommand` warnings and the final resolution failure.
- `evidence/debug-run.txt` – local reproduction attempt with `DEBUG=*` and `node --trace-warnings`; demonstrates command discovery trace under the current dev environment (no regex failure observed, CLI loads normally before API call).
- `evidence/run-spaced-command.txt` – plain execution of `mw org invite list-own` (space-separated id) returning a 403 from the API instead of the regex error, indicating the CLI resolves correctly locally.
- `evidence/run-colon-command.txt` – execution of `mw org:invite:list-own` using colon form; also reaches the API.
- `evidence/help-org-*.txt` – help output comparisons: colon form (`org:invite`) works, space-separated topic form fails, mirroring the user report path.
- `evidence/mw-version.txt`, `node-version.txt`, `oclif-dependency-tree.txt` – version fingerprints (`@mittwald/cli@1.11.2`, `@oclif/core@4.5.4`, Node 20.12.2, darwin-arm64).
- `evidence/uname.txt`, `evidence/sw-vers.txt` – host OS details.
- `evidence/container-*.txt`, `evidence/alpine-*.txt` – reproduction attempts in `node:20-bullseye` and `node:20-alpine` Docker images (global install), both succeeding and returning 403s (no regex error).
- `evidence/prod-*.txt` – logs and env/version snapshots pulled from the Fly `mittwald-mcp-fly2` machine, including the instrumented traces and the direct `string-width` repro.

## Related Documentation
- `docs/2025-09-29-mcp-cli-hardening-plan.md` (Workstream A) documents prior sightings of this regex failure in Claude Desktop sessions.
- `docs/2025-09-29-cli-refactor-architecture.md` references migration of `mittwald_org_invite_list_own` to the shared CLI adapter.
- `LLM_CONTEXT.md` & `ARCHITECTURE.md` describe the MCP tool execution pipeline (OAuth middleware → session-aware CLI wrapper) required to contextualise the failure.

## Current Observations
- The failure appears tied to the space-delimited invocation style (`mw org invite …`) used by MCP. Locally, that form succeeds, so the bug likely requires a specific environment combination (global vs local install, locale, shell, or older CLI build).
- The log shows the resolver iterating through a wide set of commands (conversation, extension, registry, etc.) before failing, implying command discovery is falling back repeatedly. The warnings stem from `plugin.findCommand` when it builds a `RegExp` from command ids.
- The affected runtime reports `@oclif/core@4.5.4`; this matches our dependency tree, so the issue is not due to a version skew unless the global install is patched.
- No invalid-regex warning occurs in the current dev shell, highlighting a reproduction gap. We need a controlled environment matching `/usr/local/lib/node_modules/@mittwald/cli` (global install, likely Node 20 on Linux/Alpine) to confirm the crash.
- `/tmp/oclif-invalid-regex-debug/debug-run-container.txt` captures a global-install run inside `node:20-bullseye`; it still resolves the command successfully and fails later with the expected 403 API response, so the regex error does not present even in that container baseline.
- `evidence/alpine-debug-run.txt` shows the same behaviour inside `node:20-alpine` with `LANG=C`, again returning a 403 after successful command discovery—still no reproduction.
- `evidence/prod-debug-run.txt` was captured via `flyctl ssh` on the live `mittwald-mcp-fly2` app (Node 18.20.8). This log reproduces the regex warnings immediately, confirming the issue is specific to the production runtime.
- `evidence/prod-debug-run-instrumented*.txt` add targeted logging from that runtime (modified `plugin.js`/`module-loader.js` temporarily). They show each failure occurs while importing the compiled command modules (e.g. `/usr/local/lib/node_modules/@mittwald/cli/dist/commands/conversation/categories.js`). A direct import of any of those modules (`node -e "import('file:///…/conversation/categories.js')"`) fails because the bundled dependency `string-width@8.1.0` defines `const zeroWidthClusterRegex = …$/v` (see `evidence/prod-string-width-repro.txt`), and Node 18 does not yet support the regex `v` flag—explaining why Node 20 containers work while Node 18 production does not.
- Instrumentation was rolled back immediately after capturing the evidence (original files restored from `.orig` backups) to avoid leaving modified code on the running machine.

## Debugging Plan
1. **Reproduce in Matching Environment**
   - Run the CLI inside the MCP container/base image or a fresh Node 20 Alpine environment with the global `@mittwald/cli` install to mirror the failing path.
   - Capture `DEBUG=*` and `node --trace-warnings` output, storing the full log in `docs/2025-10-oclif-invalid-regex-debug/evidence/`.

2. **Isolate Command Resolution Path**
   - Instrument `node_modules/@oclif/core/lib/config/plugin.js` (or use `NODE_OPTIONS=--enable-source-maps`) to log the regex pattern causing the failure.
   - Identify which command id is being converted into the invalid regex flags (likely derived from topic metadata) and whether environment variables (e.g., locale) alter the generated pattern.

3. **Compare Invocation Forms**
   - Test both space-delimited (`mw org invite …`) and colon-delimited (`mw org:invite:…`) forms across environments to document when resolution flips from success to failure.
   - Verify behaviour with `OCLIF_LEGACY_COMMAND_FLAGS=1` (if supported) to see if the legacy matcher sidesteps the regex builder.

4. **Inspect @oclif/core Source**
   - Review the `findCommand` implementation in `@oclif/core@4.5.4` to understand how topic ids become regex patterns. Pay particular attention to the code path triggered by `flexibleTaxonomy`/`strictTopics` options set by the Mittwald CLI.
   - Evaluate whether certain characters (colon, dash) or duplicate ids lead to assembling invalid flag strings (e.g., `RegExp('(?i)')`).

5. **Check Locale & Runtime Settings**
   - Record `LANG`, `LC_ALL`, and shell options in the failing environment. Some regex engines treat Unicode/locale flags differently, which might explain environment-specific behaviour.
   - Confirm whether MCP invokes the CLI with additional env vars that might influence Oclif (e.g., `OCLIF_SPACED_COMMANDS`, `OCLIF_LEGACY_COMMAND_FLAGS`).

6. **Formulate Mitigations**
   - Short-term: add MCP-side detection for `Invalid regular expression flags` and recommend colon-form fallback or explicit command ids.
   - Medium-term: pin or patch `string-width` (e.g., force `<7.0.0`) or move the production runtime to Node ≥ 20 so the `/.../v` regex compiles; consider scheduling a hotfix release of the CLI with an explicit dependency override.
   - Long-term: upstream an issue/PR to `@oclif/core` with minimal reproduction steps and file a tracking ticket with the `string-width` maintainers about the Node 18 incompatibility.

7. **Track Progress & Open Questions**
   - Maintain this directory with new logs, findings, and hypotheses.
   - Outstanding: Why does the failure only appear in some environments? Is the regex built from command ids, aliases, or topic metadata? Document answers as discovered.

## Next Updates
When new evidence is collected, add a dated note in this README (or a `notes/` subfolder) and drop raw outputs into `evidence/`, keeping filenames descriptive for quick reference.
