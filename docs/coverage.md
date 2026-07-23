# Mittwald CLI Coverage

The MCP tool registry is expected to cover the Mittwald CLI's command surface. Two artifacts record
that coverage, and CI enforces it.

## Generated Artifacts

| Artifact | Purpose |
| --- | --- |
| `mw-cli-coverage.json` | Machine-readable record of CLI commands, MCP tool matches, exclusions, and aggregate statistics. |
| `docs/mittwald-cli-coverage.md` | Human-readable coverage matrix grouped by CLI topic (mirrors the JSON). |

Both are produced by `npm run coverage:generate`, which reads the installed `@mittwald/cli`, scans
MCP tool registrations, and merges exclusion metadata from `config/mw-cli-exclusions.json`.
**Do not edit either artifact by hand.**

## Expectations

- Wrappers stay in sync with the pinned `@mittwald/cli` version (`^1.12.0`; the Dockerfile pins the
  same version).
- `stats.missingCount` must be zero. A missing command needs either a wrapper or an explicit
  exclusion.
- Regenerate only when tool metadata, the exclusion list, or the CLI version changes — routine
  commits that touch none of those inputs can skip it.

## Commands

```bash
npm run coverage:generate   # rebuild both artifacts
npm run check:cli-version   # warn when the Dockerfile pin drifts from npm
```

Validate the JSON against its schema with:

```bash
npx ajv validate -s config/mw-cli-coverage.schema.json -d mw-cli-coverage.json
```

## Allowlist Management

Intentional gaps live in `config/mw-cli-exclusions.json`, in two categories:

- **`interactive`** — commands requiring streaming or a TTY. These share a category-level rationale.
- **`intentional`** — command-specific exclusions, each with its own reason.

When adding or removing an exclusion:

1. Update the appropriate array and provide or adjust the rationale.
2. Re-run `npm run coverage:generate` so the metadata is embedded in both artifacts.
3. Commit the JSON, the Markdown, and the config change together.

The generator annotates excluded commands in the Markdown table (`Allowed missing (…)`) and stores
the category and reason in `mw-cli-coverage.json`.

Prefer implementing a wrapper over extending the allowlist. Interactive operations are the one case
where a wrapper is not the answer — for those, see "Return Connection Data, Don't Execute" in
`CLAUDE.md`, which covers SSH, port forwarding, dumps and downloads.

## CI Enforcement

`.github/workflows/coverage-check.yml` enforces three gates:

1. `npm run coverage:generate` must leave no uncommitted changes (`git diff --exit-code`).
2. `stats.missingCount` must remain zero.
3. `npm run check:cli-version` runs in warning mode to highlight version drift.

## Related

- Schema: `config/mw-cli-coverage.schema.json`
- Reference-site coverage (which MCP tools have documentation pages) is a separate check — see
  `docs/reference/README.md`.
