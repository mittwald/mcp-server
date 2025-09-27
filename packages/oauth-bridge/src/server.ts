import { createApp } from './app.js';
import { loadConfigFromEnv } from './config.js';
import { MemoryStateStore } from './state/memory-state-store.js';

const config = loadConfigFromEnv();
const stateStore = new MemoryStateStore({ ttlMs: 5 * 60 * 1000 });
const app = createApp(config, stateStore);

app.listen(config.port, () => {
  app.context.logger.info({ port: config.port }, 'OAuth bridge listening');
});
