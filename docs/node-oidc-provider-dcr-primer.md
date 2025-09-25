# node-oidc-provider Dynamic Client Registration Primer

## 1. Standards Background
- **Core specifications**: OAuth 2.0 Dynamic Client Registration (RFC 7591) and the companion management protocol (RFC 7592) define the JSON metadata schema, endpoint semantics, and error contract for automated registration lifecycles.
- **OAuth 2.1 alignment**: The OAuth 2.1 draft references RFC 7591/7592 as the normative mechanism for automated onboarding while tightening redirect URI and PKCE expectations for dynamically registered applications.

## 2. Enabling DCR in node-oidc-provider
- Toggle support via `features.registration.enabled`; defaults are shown in the upstream documentation and include hooks for ID/secret factories, access-token requirements, and policy execution (`docs/README.md#featuresregistration`).
- The registration endpoint is exposed on the `registration` route (`/reg` by default) and advertised in discovery only when the feature is enabled (`docs/README.md#routes`, `packages/oauth-server/node_modules/oidc-provider/lib/actions/discovery.js:9-26`).
- Optional management operations (GET/PUT/DELETE) are guarded by `features.registrationManagement` and, when enabled, rely on RFC 7592 semantics (`docs/README.md#featuresregistrationmanagement`).

## 3. Registration Endpoint Pipeline
- Incoming POST payloads are parsed as JSON and evaluated against any configured initial access token requirement (`packages/oauth-server/node_modules/oidc-provider/lib/actions/registration.js:55-114`). Supported modes include adapter-backed bearer tokens, a static string secret, or open registration as dictated by `features.registration.initialAccessToken` (`docs/README.md#featuresregistration`).
- Client identifiers are minted via `idFactory`, and secrets are conditionally generated with `secretFactory` when the client metadata requires a secret (`packages/oauth-server/node_modules/oidc-provider/lib/actions/registration.js:103-134`). Both hooks can be overridden to match deployment entropy or naming policies.
- Policy enforcement: if the validated initial access token carries `policies`, each policy function is executed prior to validation, allowing mutation or rejection of the metadata (`packages/oauth-server/node_modules/oidc-provider/lib/actions/registration.js:136-148`). Policies are registered under `features.registration.policies` and can also assign new policy lists to any issued Registration Access Token (`docs/README.md#featuresregistration`).
- Persistence and response: `addClient` wraps the metadata in a `Client` instance, performs sector validation, and persists via the configured adapter (`packages/oauth-server/node_modules/oidc-provider/lib/helpers/add_client.js:1-12`). On success the server returns the stored metadata and optionally appends the `registration_client_uri` and `registration_access_token` if issuance is enabled (`packages/oauth-server/node_modules/oidc-provider/lib/actions/registration.js:150-166`).

## 4. Registration Access Tokens & Management
- Registration Access Tokens (RATs) are bearer credentials built on the `RegistrationAccessToken` model, inheriting the policy mixin (`packages/oauth-server/node_modules/oidc-provider/lib/models/registration_access_token.js:1-8`).
- GET/PUT/DELETE operations validate the RAT, resolve the client record, and enforce `noManage` protections (`packages/oauth-server/node_modules/oidc-provider/lib/actions/registration.js:170-304`).
- Updates reuse `secretFactory` when a confidential client newly requires a secret and can rotate the RAT when `features.registrationManagement.rotateRegistrationAccessToken` is true or returns true from a policy (`packages/oauth-server/node_modules/oidc-provider/lib/actions/registration.js:228-280`, `docs/README.md#featuresregistrationmanagement`).
- Successful operations emit lifecycle events (`registration_create.success`, `registration_update.success`, `registration_delete.success`) that can be used for auditing or metrics (`docs/events.md`, rows 53-59).

## 5. Metadata Validation & Extensions
- The `Client` model encapsulates the full metadata schema, secret handling, and JOSE key validation consistent with RFC 7591 (`packages/oauth-server/node_modules/oidc-provider/lib/models/client.js`). It decides whether a client “needs” a secret via `Client.needsSecret` and enforces redirect rules, grant/response consistency, and JOSE requirements.
- Additional metadata can be allowed and validated through `extraClientMetadata.properties` and `extraClientMetadata.validator`, ensuring custom fields are checked during registration/updates (`docs/README.md#extraclientmetadata`).
- Sector identifier and JWKS resolution are automatically performed when applicable, and failures abort registration, preventing misconfigured multi-tenant subjects or invalid key material (`packages/oauth-server/node_modules/oidc-provider/lib/helpers/add_client.js:4-9`).

## 6. Initial Access Tokens Workflow
- Adapter-backed Initial Access Tokens (IATs) carry optional policy lists and are looked up whenever `features.registration.initialAccessToken` is set to `true` (`packages/oauth-server/node_modules/oidc-provider/lib/actions/registration.js:61-67`). The class is defined with the same policy mixin to ensure policy inheritance (`packages/oauth-server/node_modules/oidc-provider/lib/models/initial_access_token.js:1-11`).
- The documentation supplies helper snippets for minting IATs via `new provider.InitialAccessToken({ policies }).save()` and retrieving the token value (`docs/README.md#featuresregistration`).

## 7. Discovery & Client Consumption
- When DCR is active the discovery document exposes `registration_endpoint` and reflects supported client auth methods and grant types, enabling standards-compliant clients (e.g., Claude, ChatGPT) to auto-configure against the service (`packages/oauth-server/node_modules/oidc-provider/lib/actions/discovery.js:9-26`).
- The configured routes feed back into `ctx.oidc.urlFor`, so custom path overrides automatically propagate to discovery responses and registration URIs (`docs/README.md#routes`).

## 8. Implementation Checklist for Mittwald MCP
1. **Toggle features**: Ensure `features.registration.enabled` and, if update/delete is required, `features.registrationManagement.enabled` are set in `packages/oauth-server/src/config/provider.ts` to expose `/reg`.
2. **Access control**: Decide between open registration, shared-secret registration, or adapter-backed IATs; mint IATs with the desired `policies` for regulated onboarding.
3. **Policies & metadata**: Define policy functions to enforce Mittwald scope defaults, redirect host whitelists, or naming conventions; extend metadata via `extraClientMetadata` if Mittwald-specific fields are needed.
4. **Storage**: Confirm the SQLite adapter persists the `Client`, `InitialAccessToken`, and `RegistrationAccessToken` models so that registrations survive restarts.
5. **Monitoring**: Subscribe to `registration_*` events to emit audit logs or telemetry.
6. **Discovery surface**: After enabling DCR, verify the `.well-known/openid-configuration` advertises the registration endpoint expected by OAuth clients.

## 9. Reference Summary
- RFC 7591 / RFC 7592 – normative DCR protocols
- OAuth 2.1 draft §2 – registration overview
- node-oidc-provider documentation – `docs/README.md#featuresregistration`, `#featuresregistrationmanagement`, `#extraclientmetadata`, `#routes`
- node-oidc-provider source – `lib/actions/registration.js`, `lib/models/initial_access_token.js`, `lib/models/registration_access_token.js`, `lib/helpers/add_client.js`, `lib/actions/discovery.js`
- node-oidc-provider events – `docs/events.md`

