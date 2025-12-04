import { Counter, Gauge } from 'prom-client';
import { register } from './registry.js';

// Counter for authorization requests
export const authorizationRequests = new Counter({
  name: 'oauth_authorization_requests_total',
  help: 'Total OAuth authorization requests',
  labelNames: ['client_id', 'status'],
  registers: [register]
});

// Counter for token exchange requests
export const tokenRequests = new Counter({
  name: 'oauth_token_requests_total',
  help: 'Total OAuth token exchange requests',
  labelNames: ['grant_type', 'status'],
  registers: [register]
});

// Counter for DCR registrations
export const dcrRegistrations = new Counter({
  name: 'oauth_dcr_registrations_total',
  help: 'Total Dynamic Client Registration requests',
  labelNames: ['status'],
  registers: [register]
});

// Gauge for pending authorization requests in state store
export const pendingAuthorizations = new Gauge({
  name: 'oauth_pending_authorizations',
  help: 'Current number of pending authorization requests in state store',
  registers: [register]
});

// Gauge for pending grants in state store
export const pendingGrants = new Gauge({
  name: 'oauth_pending_grants',
  help: 'Current number of pending grants in state store',
  registers: [register]
});

// Gauge for registered clients
export const registeredClients = new Gauge({
  name: 'oauth_registered_clients',
  help: 'Current number of registered OAuth clients (DCR)',
  registers: [register]
});
