import { createApp } from './app.js';
import { loadConfigFromEnv } from './config.js';
import { createStateStore } from './state/state-store-factory.js';
import { createRegistrationTokenStore } from './registration-token-store-factory.js';

const config = loadConfigFromEnv();
const ttlSeconds = Number(process.env.BRIDGE_STATE_TTL_SECONDS ?? 300);
const stateStore = createStateStore({ ttlSeconds });
const registrationTokenStore = createRegistrationTokenStore();
const app = createApp(config, stateStore, registrationTokenStore);

app.listen(config.port, () => {
  app.context.logger.info({ port: config.port }, 'OAuth bridge listening');
});
