# MCP CLI Hardening Plan (2025-09-29)

## Context
- Claude Desktop tool invocation of `mittwald_project_list` surfaced `@oclif/core` errors (`Invalid regular expression flags`) before the CLI emitted business logic, implying an upstream command resolution issue (likely triggered by colon-delimited command ids under our runtime).
- The fallback tool `mittwald_user_accessible_projects` reuses the same CLI call but normalises errors to an empty array, masking the failure and giving the impression that zero projects exist.
- A quick audit (`rg "executeCli('mw'" src/handlers`) shows **90+** handlers issuing raw `mw …` commands via the low-level `executeCli` wrapper instead of the session-aware helper. Only the context-specific handlers currently use `sessionAwareCli`.

We need two coordinated workstreams:
1. **Oclif stability** – reproduce and patch the CLI/Oclif failure so that `mw project list` and friends succeed in our containerised runtime.
2. **Tool/handler cleanup** – consolidate all MCP handlers on the session-aware execution path, surface CLI errors consistently, and add regression coverage.

The streams are tracked separately, but share discovery data and release milestones.

---

## Workstream A – Oclif Stability & CLI Runtime Fix

| Item | Description | Owner | Target |
|------|-------------|-------|--------|
| A1 | Reproduce the Oclif `Invalid regular expression flags` crash in isolation (Node 20 Alpine, `mw` 1.11.1, CI env). Capture `DEBUG=*` / `--trace-warnings` output plus minimal repro steps. | Platform Eng | 2025-09-30 |
| A2 | Bisect CLI releases (1.10.x → 1.11.x) to confirm when the regression appeared and whether downgrading unblocks us short-term. | Platform Eng | 2025-10-01 |
| A3 | Inspect compiled `@oclif/core` resolver (likely in `findCommand`) to identify why colon-separated command ids produce bad regex flags under our env. Draft a fix or upstream issue. | CLI Dev | 2025-10-02 |
| A4 | Prototype mitigation: patch CLI to sanitise command ids before feeding them to `RegExp`, or set `OCLIF_LEGACY_COMMAND_FLAGS=1` (if available) and validate. | CLI Dev | 2025-10-03 |
| A5 | Ship hotfix (new CLI version or runtime patch) and update Docker base image + MCP env. Ensure smoke tests cover at least one colonised command (e.g., `extension:list`). | Release Eng | 2025-10-04 |
| A6 | Postmortem & monitoring – add logging to MCP to flag any future CLI stderr with `Invalid regular expression flags`. | Platform Eng | 2025-10-07 |

**Open Questions**
- Does the crash reproduce on Node 18, or only Node 20? (Impacts rollback plan.)
- Do we need to enforce a particular `LANG`/`LC_ALL` setting to avoid unexpected regex behaviour?

---

## Workstream B – Tool & Handler Cleanup

### Current Findings
- 90+ handlers call `executeCli('mw', …)` directly, only a handful (`context/session-aware-context.ts`) rely on `sessionAwareCli`.
- Duplicate tool coverage (e.g., “List Projects” vs “List Accessible Projects”) leads to inconsistent error handling.
- Many handlers interpret CLI failures with bespoke logic (e.g., substring checks for `authentication`), complicating shared behaviour and testing.

### Objectives
1. Single execution path for all CLI tools (session-aware, token-injecting, context-respecting).
2. Consistent error surfacing—CLI non-zero exits must propagate to the MCP response (no silent success with empty data).
3. Regression coverage that stubs CLI failures and validates responses.

| Item | Description | Owner | Target |
|------|-------------|-------|--------|
| B1 | Inventory all CLI-based tool registrations and map them to handlers; record which ones currently bypass session-aware execution. (Initial audit complete on 2025-09-29; maintain spreadsheet or doc.) | Tooling PM | 2025-09-30 |
| B2 | Design shared execution adapter: session-aware wrapper with pluggable post-processing (JSON parsing, text passthrough, quiet id). Define common error object. | Backend Eng | 2025-10-02 |
| B3 | Migrate high-traffic tools first (projects, servers, conversations) to the shared adapter; drop duplicate/fallback implementations. | Backend Eng | 2025-10-07 |
| B4 | Migrate remaining handlers (≈90) in batches, each with smoke verification. Track progress in checklist. | Backend Eng | 2025-10-18 |
| B5 | Update `sessionAwareCli` helpers to return structured errors instead of empty arrays; adjust context tools accordingly. | Backend Eng | 2025-10-05 |
| B6 | Add Vitest coverage that fakes CLI exit codes (success, auth failure, generic failure) and asserts uniform response formatting. | QA | 2025-10-09 |
| B7 | Update documentation (`README`, `ARCHITECTURE`, tool docs) to state that all CLI invocations run via session-aware wrapper and to describe error behaviour. | Tech Writer | 2025-10-10 |
| B8 | Remove legacy tooling once migration completes; ensure smoke tests exercise representative commands (read/write). | Backend Eng | 2025-10-20 |

### Risks & Mitigations
- **Volume of handlers** – 90+ migrations can regress behaviour. Use automated codemods or lint rules to enforce `sessionAwareCli` usage.
- **Token/context propagation** – ensure tests cover scenarios with/without context to avoid breaking existing workflows.
- **CLI stability dependency** – cleanup should follow Oclif fix so we don’t migrate onto a broken runtime.

---

## Coordination
- Track both workstreams in a shared project board in this document; link tasks A1/B1, etc., for context.
- Block handler migration (B3+) on completion of A4 unless a temporary CLI workaround is in place.
- Add periodic checkpoints (every minor milestone) to review progress and revise targets.

### Inventory Tracking
- The authoritative roster of CLI-backed tools lives in `docs/2025-09-29-cli-tool-inventory.json` (generated automatically; update as migrations land).

---

## Progress Log
- **2025-09-29** – Drafted the [CLI Refactor Architecture](./2025-09-29-cli-refactor-architecture.md) outlining the unified adapter design, error taxonomy, and phased migration plan (covers Workstream B2 and sets prerequisites for B3/B4). Pending review before implementation. _(commit d962978)_
- **2025-09-29** – Scaffolded the shared CLI adapter, structured error types, session-aware helper updates, and initial lint guardrail to launch Phase 1 infrastructure. Implementation captured in commit d7e4a329a57c4f81666d2a2d5f912a93a1fe6a94.
- **2025-09-30** – Exported comprehensive tool inventory for migration tracking (`docs/2025-09-29-cli-tool-inventory.json`). _(commit 97dadafb695a8f66b4039f0f1c6315839484bc19)_
- **2025-09-30** – Migrated `mittwald_app_copy` handler to the shared CLI adapter and recorded progress in the inventory. _(commit 13195fe6946880611c5d59fc011e21a2134ee14a)_
- **2025-09-30** – Migrated `mittwald_app_create_node` handler to the shared CLI adapter. _(commit 688ed9397389e6a8f2c65a984cbf6c67c8e40661)_
- **2025-09-30** – Migrated `mittwald_app_create_php` handler to the shared CLI adapter. _(commit f1ac9827b5c026e1cc1cd85256d3b25ccddf18a3)_
- **2025-09-30** – Migrated `mittwald_app_create_php_worker` handler to the shared CLI adapter. _(commit 4f4dd233f4150eac8261d66a53dda4d0e15fa12c)_
- **2025-09-30** – Migrated `mittwald_app_create_python` handler to the shared CLI adapter. _(commit ad1fe396ae2ee3cab713876580dc4f9eb579e40a)_
- **2025-09-30** – Migrated `mittwald_app_create_static` handler to the shared CLI adapter. _(commit 1230eb67d86972fd4ea5d47bca68975942b14a4e)_
- **2025-09-30** – Migrated `mittwald_app_download` handler to the shared CLI adapter. _(commit ece20a097b17440ace7a90bed5dbcad9cf5e77e2)_

- **2025-09-30** – Migrated `mittwald_app_get` handler to the shared CLI adapter. _(commit f3f1e5a62e10f08960a4b1a73b5b0ba3e29d673d)_

- **2025-09-30** – Migrated `mittwald_app_install_contao` handler to the shared CLI adapter. _(commit 85ec619f4fee8352f6d5a3e01f04bef0d6f0f8fb)_

- **2025-09-30** – Migrated `mittwald_app_install_joomla` handler to the shared CLI adapter. _(commit 4f136822c1a8efb4e0be6db833d91694a8d8c9aa)_

- **2025-09-30** – Migrated `mittwald_app_install_matomo` handler to the shared CLI adapter. _(commit 2dbf80169a3f17f3e450bcf6a38fca714e454a95)_

- **2025-09-30** – Migrated `mittwald_app_install_nextcloud` handler to the shared CLI adapter. _(commit 1c90f3355e41aac552f825c021f5fd91208f4dd3)_

- **2025-09-30** – Migrated `mittwald_app_install_shopware5` handler to the shared CLI adapter. _(commit 9b2a205e4712eef79f6f70e969a1356a4b8bc6bf)_

- **2025-09-30** – Migrated `mittwald_app_install_shopware6` handler to the shared CLI adapter. _(commit bd619eff1110c5e7cb482b3f16c66a729d982c31)_

- **2025-09-30** – Migrated `mittwald_app_install_typo3` handler to the shared CLI adapter. _(commit 4103c6fac0befc931093d24d5e7775f8efe28a81)_

- **2025-09-30** – Migrated `mittwald_app_install_wordpress` handler to the shared CLI adapter. _(commit 97ef1cce5893ada00d0d44e310a1b5e1bd8630db)_

- **2025-09-30** – Migrated `mittwald_app_list` handler to the shared CLI adapter. _(commit 9f3c84b803c0e16907e098fe3a6ba7331c2e8d30)_

- **2025-09-30** – Migrated `mittwald_app_list_upgrade_candidates` handler to the shared CLI adapter. _(commit 7d71c73a4ed6d2261fd444fcacd25cdb840a41b4)_

- **2025-09-30** – Migrated `mittwald_app_open` handler to the shared CLI adapter. _(commit c4a54d7378608450755c57dc4ff264f2c20d55b2)_

- **2025-09-30** – Migrated `mittwald_app_ssh` handler to the shared CLI adapter. _(commit 935a1456e956fe8e53c384a042657bfb9dba04ea)_

- **2025-09-30** – Migrated `mittwald_app_uninstall` handler to the shared CLI adapter. _(commit 2452eee1919078fa1a68ae8a40e7cc5701c0fe48)_

- **2025-09-30** – Migrated `mittwald_app_update` handler to the shared CLI adapter. _(commit d171b1d76107323b599631e7608a71331b26a91b)_

- **2025-09-30** – Migrated `mittwald_app_upgrade` handler to the shared CLI adapter. _(commit 92b60f9969588b7ea557ece836d7415b52e17a7b)_

- **2025-09-30** – Migrated `mittwald_app_upload` handler to the shared CLI adapter. _(commit 4fc811706ae24f2048a73b977e8b538a775f5abb)_

- **2025-09-30** – Migrated `mittwald_app_versions` handler to the shared CLI adapter. _(commit 871b2d3d6ca2789a14d898feb6b562a92ccd1d58)_

- **2025-09-30** – Migrated `mittwald_backup_create` handler to the shared CLI adapter. _(commit 308d906f2e796b79436d12a21b0b754bd3b6054b)_

- **2025-09-30** – Migrated `mittwald_backup_delete` handler to the shared CLI adapter. _(commit c26fb23a2cf4ed137b5df86657b1b5ca15ee7fc6)_

- **2025-09-30** – Migrated `mittwald_backup_download` handler to the shared CLI adapter. _(commit 44344cf88537b0e3f3d15f976b5d3d45db7ab55b)_

- **2025-09-30** – Migrated `mittwald_backup_get` handler to the shared CLI adapter. _(commit c7be3b5aedb4b8336a69858c026445f5243c1a3d)_

- **2025-09-30** – Migrated `mittwald_backup_list` handler to the shared CLI adapter. _(commit f051f034b64982e01fb4f5c5fb30732ef845e695)_

- **2025-09-30** – Migrated `mittwald_backup_schedule_create` handler to the shared CLI adapter. _(commit 0f5fe89c99b1bcd803dd0b03f133eb4b56026e11)_

- **2025-09-30** – Migrated `mittwald_backup_schedule_delete` handler to the shared CLI adapter. _(commit db747fa6296bf1885ebbb34d87c472168461a0ad)_

- **2025-09-30** – Migrated `mittwald_backup_schedule_list` handler to the shared CLI adapter. _(commit b7551f36f83aecc0fd7db181ee1bcfb7b1ba49c9)_

- **2025-09-30** – Migrated `mittwald_backup_schedule_update` handler to the shared CLI adapter. _(commit 9239c3e47b13e07293f9829c8a0e5b2e41c9a39f)_

- **2025-09-30** – Migrated container handlers (`delete`, `list`, `logs`, `recreate`, `registry_create`) to the shared CLI adapter. _(commit 3bafcee1f668d26515083998c2e44593b06dce31)_

- **2025-09-30** – Migrated container registry (`delete`, `list`, `update`) and container lifecycle (`restart`, `run`) handlers to the shared CLI adapter. _(commit 0103cac7d76bed9dfed23b5730bb7419fcd10826)_

- **2025-09-30** – Migrated container stack (`delete`, `deploy`, `list`, `ps`) and container start/stop handlers to the shared CLI adapter. _(commit dd11ce3f0412e3f893f02cc8667c5180930a3275)_

- **2025-09-30** – Migrated `mittwald_conversation_reply` handler to the shared CLI adapter. _(commit c6bf7d8fa7fc1716ecf4bcf500544e8a1f11d6a1)_

- **2025-09-30** – Migrated `mittwald_conversation_show` handler to the shared CLI adapter. _(commit b21aa910b293671525ea96aa1a3243fa57502d3e)_

- **2025-09-30** – Migrated `mittwald_cronjob_create` handler to the shared CLI adapter. _(commit 7134557dc8dbeb7b7604450c779a5bd90933789b)_

- **2025-09-30** – Migrated `mittwald_cronjob_execution_abort` handler to the shared CLI adapter. _(commit 82e6dcb9eb567a7cdcd9a06bed90c94308fc3f8a)_

- **2025-09-30** – Migrated `mittwald_cronjob_execution_get` handler to the shared CLI adapter. _(commit 886cec312e97cae2d15128757277eb366ca0c41c)_

- **2025-09-30** – Migrated `mittwald_cronjob_get` handler to the shared CLI adapter. _(commit 0307bbc55b63a1813327b13e186149eca3ca2480)_

- **2025-09-30** – Migrated `mittwald_cronjob_execution_logs` handler to the shared CLI adapter. _(commit 5319f02835f8f4fee8279a78085bb2c0dc65fdb4)_

- **2025-09-30** – Migrated `mittwald_cronjob_list` handler to the shared CLI adapter. _(commit bfd706dbca33e2d7676551da58a0bcfa717fec34)_

- **2025-09-30** – Migrated `mittwald_cronjob_update` handler to the shared CLI adapter. _(commit 99382924472be914ae558c158dd32c416fd720d1)_

- **2025-09-30** – Migrated `mittwald_domain_list` handler to the shared CLI adapter. _(commit 14e9148ae77dc79d5e403e5caeefe34697503faf)_

- **2025-09-30** – Migrated `mittwald_context_get` handler to the shared CLI adapter. _(commit 1919d326c8dba352286720d58325d5adf7628c43)_

- **2025-09-30** – Migrated `mittwald_context_reset` handler to the shared CLI adapter. _(commit 5f00be28cc2927ace46c96d9f142d5e0e3aabf90)_

- **2025-09-30** – Migrated `mittwald_domain_dnszone_list` handler to the shared CLI adapter. _(commit 9332b061b27942bcdde2f1f3c346cb70064cfdf8)_

- **2025-09-30** – Migrated `mittwald_conversation_categories` handler to the shared CLI adapter. _(commit 1d19d34ac2db3efea2df60427e60987b69d6e22e)_
- **2025-09-30** – Migrated `mittwald_user_api_token_get` handler to the shared CLI adapter. _(commit 9e21d3791c50ada436ad7238959c93338e41671a)_
- **2025-09-30** – Migrated `mittwald_user_api_token_list` handler to the shared CLI adapter. _(commit 5e240043dbd3cad3ad49e158e6b920713ab84943)_
- **2025-09-30** – Migrated `mittwald_user_api_token_revoke` handler to the shared CLI adapter. _(commit b0f6c921fac2c7e8d123f218607ff3936900931c)_

- **2025-09-30** – Migrated `mittwald_mail_address_create` handler to the shared CLI adapter. _(commit 21b36c68db1c560556bd3a39f790d46406b38308)_

- **2025-09-30** – Migrated `mittwald_mail_address_get` handler to the shared CLI adapter. _(commit 073fe81e08bbb27efaf0eff40732376e42746b92)_

- **2025-09-30** – Migrated `mittwald_mail_address_delete` handler to the shared CLI adapter. _(commit b5e1f24e9b6e6329d4c0dc7bdb97a843026d9107)_

- **2025-09-30** – Migrated `mittwald_mail_address_list` handler to the shared CLI adapter. _(commit 41dc9c4d03c0350e4af10ee4e3da8c7f76fddefd)_

- **2025-09-30** – Migrated `mittwald_mail_address_update` handler to the shared CLI adapter. _(commit 9723e2ecba23f840d980895ac6cf14e55b3c28d6)_

- **2025-09-30** – Migrated `mittwald_mail_deliverybox_create` handler to the shared CLI adapter. _(commit d792694b8d8cb1fbb51930add5e1a5816270896b)_

- **2025-09-30** – Migrated `mittwald_mail_deliverybox_get` handler to the shared CLI adapter. _(commit 42a90ef72a915017ba082fb533cc7f69a5f2341e)_

- **2025-09-30** – Migrated `mittwald_mail_deliverybox_list` handler to the shared CLI adapter. _(commit afa0cf5dea4db8000b492235c7ac4fdd2d1de152)_

- **2025-09-30** – Migrated `mittwald_mail_deliverybox_update` handler to the shared CLI adapter. _(commit 4c4a7f50d8d762fc0872434e534141c935908e8d)_

- **2025-09-30** – Migrated `mittwald_org_invite_list` handler to the shared CLI adapter. _(commit 6185efdda7bc4f4731d603bfff1b78aaca43996e)_

- **2025-09-30** – Migrated `mittwald_org_invite_list_own` handler to the shared CLI adapter. _(commit b070f7cc4d28d6da3a8d8a9844e9abe0776ab610)_

- **2025-09-30** – Migrated `mittwald_org_invite_revoke` handler to the shared CLI adapter. _(commit 0ffb2ffb37c2f3431791759e99209f7268e5133d)_

- **2025-09-30** – Migrated `mittwald_project_create` handler to the shared CLI adapter. _(commit 652ec1b2d57e48f05418a1d6719c551c0e056f10)_
- **2025-09-30** – Updated inventory to reflect the migrated `mittwald_project_delete` handler. _(commit 5814af1)_
- **2025-09-30** – Migrated `mittwald_project_filesystem_usage` handler to the shared CLI adapter. _(commit d67b76bd4214417d3f022ee155c391935eab5add)_

- **2025-09-30** – Migrated `mittwald_project_list` handler to the shared CLI adapter. _(commit 857e81591db8dc6199dafb0511c70c65e136f7e3)_

- **2025-09-30** – Migrated `mittwald_project_invite_list_own` handler to the shared CLI adapter. _(commit 36404a7646e780848d7c694386b8f876d5c35a0d)_

- **2025-09-30** – Migrated `mittwald_project_membership_get` handler to the shared CLI adapter. _(commit 193fac9ecaab9c3f22bbc95ed933f1998bfd7e26)_

- **2025-09-30** – Migrated `mittwald_project_membership_get_own` handler to the shared CLI adapter. _(commit bc6509b0c187247758022aea640223f2bc9b7e73)_

- **2025-09-30** – Migrated `mittwald_project_membership_list` handler to the shared CLI adapter. _(commit f71de2a2669f8b341cd0f4616b22d88ee2088e9f)_

- **2025-09-30** – Migrated `mittwald_project_membership_list_own` handler to the shared CLI adapter. _(commit 3f3ab50793c2d283ee79bece4646c7f9eeb68dec)_

- **2025-09-30** – Migrated `mittwald_project_ssh` handler to the shared CLI adapter. _(commit 6788e9ef9840a62f3bc52d31cb49e61dd3d83e87)_

- **2025-09-30** – Migrated `mittwald_project_update` handler to the shared CLI adapter. _(commit 399b999b8880ba90aa73d3c1b545fbc806e6d963)_

- **2025-09-30** – Migrated `mittwald_server_get` handler to the shared CLI adapter. _(commit b5b0792309584c7a75b3d76d3412487a5dbd0c90)_

- **2025-09-30** – Migrated `mittwald_server_list` handler to the shared CLI adapter. _(commit c49f6a4a4e008c1f68c813ba3b8a25d3ff63bbb0)_

- **2025-09-30** – Migrated `mittwald_sftp_user_create` handler to the shared CLI adapter. _(commit 9cba60cd40b2c9b9818412f58a05060b65481843)_

- **2025-09-30** – Migrated `mittwald_sftp_user_delete` handler to the shared CLI adapter. _(commit 5a50ccfb63c589d2ba643384f099ae4b63dc7b90)_

- **2025-09-30** – Migrated `mittwald_sftp_user_list` handler to the shared CLI adapter. _(commit 740107fd22dc162ac5d2c4c1f50af5b69094ef05)_

- **2025-09-30** – Migrated `mittwald_user_api_token_create` handler to the shared CLI adapter. _(commit 89261e115818752733564e6ec345207fd9cc15ca)_

- **2025-09-30** – Migrated `mittwald_conversation_list` handler to the shared CLI adapter. _(commit 2951d4522c833d6001ed1a6b96b002c410ec7d11)_

- **2025-09-30** – Migrated `mittwald_domain_virtualhost_create` handler to the shared CLI adapter. _(commit 0ca2fad53c3667829c41a5c8a502f9ab9adfa5bb)_

- **2025-09-30** – Migrated `mittwald_domain_virtualhost_get/list` handlers to the shared CLI adapter. _(commit 6e3e33f0f1f8b8f5170674e7adf0d8d7220ce9bb)_

- **2025-09-30** – Migrated MySQL handlers (`phpmyadmin`, `port_forward`, `shell`, `versions`) to the shared CLI adapter. _(commit 8d8c25cf36e28a0e8cdbf3b5bb6dd9e5695490b5)_

- **2025-09-30** – Migrated DDEV handlers (`init`, `render_config`) to the shared CLI adapter. _(commit b0c760189f07f67afea77eb1494b4a5cd6c1c6ec)_

- **2025-09-30** – Migrated `mittwald_user_get` handler to the shared CLI adapter. _(commit 8bf7cdb61ebafa82a460a0bfb494b7bbf541d8d3)_

- **2025-09-30** – Migrated `mittwald_user_session_get` handler to the shared CLI adapter. _(commit 6f7b61ff88571884c6ea581d1123c98200feed1b)_

- **2025-09-30** – Migrated `mittwald_user_session_list` handler to the shared CLI adapter. _(commit 7a8f9960126b8d4bbc526e58db4aa4a0a5ec74e8)_

- **2025-09-30** – Migrated `mittwald_user_ssh_key_create` handler to the shared CLI adapter. _(commit 9fe7b37e86c148a394aa09260388b2619413d535)_

- **2025-09-30** – Migrated `mittwald_user_ssh_key_delete` handler to the shared CLI adapter. _(commit c9a8a3cb51840ad8f0ad360fe4a8199f076ca45d)_

- **2025-09-30** – Migrated `mittwald_user_ssh_key_get` handler to the shared CLI adapter. _(commit bc77a03a9a32a6f0ae15a4ebcb2bafb75593577e)_

- **2025-09-30** – Migrated `mittwald_user_ssh_key_import` handler to the shared CLI adapter. _(commit b6e6082fd30f3aea43f0cbcbb43ba34f4a387a28)_

- **2025-09-30** – Migrated `mittwald_user_ssh_key_list` handler to the shared CLI adapter. _(commit 1d27761269be0b2de9baafde38347ba060a0ee03)_

- **2025-09-30** – Migrated `mittwald_login_status` handler to the shared CLI adapter. _(commit 638c1c3663c170fe0d2b1210204621b43221b660)_

- **2025-10-01** – Migrated `mittwald_ssh_user_create` handler to the shared CLI adapter. _(commit fd7b7e452bc9fc93c7c302e2b3bb3255203fc5fd)_

_Last updated: 2025-10-01_
