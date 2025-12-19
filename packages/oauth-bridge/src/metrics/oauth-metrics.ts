import { Counter, Gauge, Histogram } from 'prom-client';
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

// Counter for Mittwald upstream token refresh attempts
export const mittwaldTokenRefresh = new Counter({
  name: 'oauth_mittwald_token_refresh_total',
  help: 'Mittwald token refresh attempts by result',
  labelNames: ['status', 'error_type'],
  registers: registries
});

// Histogram for Mittwald token refresh latency
export const mittwaldTokenRefreshDuration = new Histogram({
  name: 'oauth_mittwald_token_refresh_duration_seconds',
  help: 'Duration of Mittwald token refresh operations',
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: registries
});

// Counter for forced re-authentication events
export const forcedReauth = new Counter({
  name: 'oauth_forced_reauth_total',
  help: 'Number of times users were forced to re-authenticate',
  labelNames: ['reason'],
  registers: registries
});
