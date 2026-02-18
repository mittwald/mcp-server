import { createApp } from './app.js';
import { loadConfigFromEnv } from './config.js';
import { createStateStore } from './state/state-store-factory.js';
import { createRegistrationTokenStore } from './registration-token-store-factory.js';
import { runStartupValidation } from './startup-validator.js';

// Run security validation before any other initialization
// This prevents the server from starting with placeholder secrets in production
runStartupValidation();

const config = loadConfigFromEnv();
const authRequestTtlSeconds = Number(process.env.BRIDGE_STATE_TTL_SECONDS ?? 300);
const grantTtlSeconds = Number(
  process.env.BRIDGE_GRANT_TTL_SECONDS ?? config.bridge.refreshTokenTtlSeconds
);
const stateStore = createStateStore({
  authRequestTtlSeconds,
  grantTtlSeconds
});
const registrationTokenStore = createRegistrationTokenStore();
const app = createApp(config, stateStore, registrationTokenStore);

app.listen(config.port, () => {
  app.context.logger.info({ port: config.port }, 'OAuth bridge listening');
});
