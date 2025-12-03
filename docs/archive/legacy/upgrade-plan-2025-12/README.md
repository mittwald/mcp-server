# Mittwald MCP / OAuth Upgrade Plan (Dec 2025)

This directory captures the December 2025 upgrade strategy for the two linked repositories:

- `mittwald-mcp` (this repo): MCP server + stateless OAuth bridge wrapper for the Mittwald CLI.
- `../mittwald-oauth/mittwald-oauth`: standalone OAuth 2.1 + Dynamic Client Registration server that fronts Mittwald ID.

The plan focuses on aligning both services with the November 2025 MCP specification (`2025-11-25`) and related RFC/security guidance, while refreshing aging dependencies and hardening operational posture. No code was changed—only planning artifacts live here.

## MCP Specification Landscape (Dec 2025)
- Current spec: `2025-11-25` (RC landed 2025-11-11), superseding `2025-06-18`.
- Key additions since 2025-06-18: asynchronous task primitive; server discovery via `.well-known` metadata; structured tool output/resource links hardened; elicitation stabilized; capability advertising (`title` vs `name`, `_meta` extensibility); security best-practices updates (OAuth alignment, token/resource binding).
- Emerging ecosystem pieces: MCP Registry (preview since 2025-09, moving to GA), SDK tiering/compliance signals, formal SEPs and governance, official extension catalog.
- Transport note: HTTP streamable transport remains recommended for stateless scaling; servers should still negotiate protocol versions during `initialize` and may expose multiple supported versions.

## Cross-Repository Upgrade Themes
- **Protocol compliance:** Move to `@modelcontextprotocol/sdk` >= 1.24.x (2025-11 spec support) and implement async tasks, structured output metadata, elicitation capability flags, server identity/discovery `.well-known`, and resource-link support where applicable.
- **OAuth alignment:** Ensure authorization guidance follows MCP 2025 security sections (aud/iss binding, PKCE-only public clients, resource indicators, rotation/expiry hygiene). Align bridge JWT handling and Mittwald token storage with refresh/rotation guidance.
- **Discovery & registry:** Publish `.well-known/mcp.json` (or current discovery doc) and optional registry manifest so MCP clients/Registry can enumerate capabilities without session negotiation.
- **Operational hardening:** Redis/DB migration hygiene, rate limiting, CSRF/CORS, audit logging, destructive-operation safeguards already present but need to be validated against 2025 guidance.
- **Dependency refresh:** Multiple libraries lag major versions (see per-repo files). Plan controlled upgrades with test passes.

## Files
- `mcp-server.md` – Findings and action plan for `mittwald-mcp` (MCP server + OAuth bridge).
- `mittwald-oauth.md` – Findings and action plan for `../mittwald-oauth/mittwald-oauth`.

Next step: choose scope slices, execute upgrades, and validate via existing test suites plus MCP Inspector against `2025-11-25`.
