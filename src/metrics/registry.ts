import { Registry, collectDefaultMetrics } from 'prom-client';

// Create a custom registry for this service
export const register = new Registry();

// Add service-identifying label to all metrics
register.setDefaultLabels({
  service: 'mcp-server'
});

// Collect default Node.js metrics (memory, CPU, event loop, GC)
collectDefaultMetrics({ register });
