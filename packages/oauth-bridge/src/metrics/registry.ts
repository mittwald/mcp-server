import { Registry, collectDefaultMetrics } from 'prom-client';

// Create a custom registry for OAuth Bridge
export const register = new Registry();

// Add service-identifying label to all metrics
register.setDefaultLabels({
  service: 'oauth-bridge'
});

// Collect default Node.js metrics
collectDefaultMetrics({ register });
