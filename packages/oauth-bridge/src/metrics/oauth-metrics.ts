import { Counter, Gauge } from 'prom-client';
import { register, metricsEnabled } from './registry.js';

// Only register metrics if enabled
const registries = metricsEnabled ? [register] : [];

// Counter for authorization requests
export const authorizationRequests = new Counter({
  name: 'oauth_authorization_requests_total',
  help: 'Total OAuth authorization requests',
  labelNames: ['client_id', 'status'],
  registers: registries
});

// Counter for token exchange requests
export const tokenRequests = new Counter({
  name: 'oauth_token_requests_total',
  help: 'Total OAuth token exchange requests',
  labelNames: ['grant_type', 'status'],
  registers: registries
});

// Counter for DCR registrations
export const dcrRegistrations = new Counter({
  name: 'oauth_dcr_registrations_total',
  help: 'Total Dynamic Client Registration requests',
  labelNames: ['status'],
  registers: registries
});

// Gauge for pending authorization requests in state store
export const pendingAuthorizations = new Gauge({
  name: 'oauth_pending_authorizations',
  help: 'Current number of pending authorization requests in state store',
  registers: registries
});

// Gauge for pending grants in state store
export const pendingGrants = new Gauge({
  name: 'oauth_pending_grants',
  help: 'Current number of pending grants in state store',
  registers: registries
});

// Gauge for registered clients
export const registeredClients = new Gauge({
  name: 'oauth_registered_clients',
  help: 'Current number of registered OAuth clients (DCR)',
  registers: registries
});

// Gauge for total state store entries (FR-010)
export const stateStoreSize = new Gauge({
  name: 'oauth_state_store_size',
  help: 'Total number of entries in the OAuth state store (Redis)',
  registers: registries
});
