import { createApp } from './app.js';
import { loadConfigFromEnv } from './config.js';

const config = loadConfigFromEnv();
const app = createApp(config);

app.listen(config.port, () => {
  app.context.logger.info({ port: config.port }, 'OAuth bridge listening');
});
