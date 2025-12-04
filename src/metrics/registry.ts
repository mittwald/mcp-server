import { Registry, collectDefaultMetrics } from 'prom-client';

/**
 * Check if metrics are enabled via METRICS_ENABLED env var.
 * Defaults to true if not set (opt-out behavior).
 */
export const metricsEnabled = process.env.METRICS_ENABLED !== 'false';

// Create a custom registry for this service (only if enabled)
export const register = new Registry();

if (metricsEnabled) {
  // Add service-identifying label to all metrics
  register.setDefaultLabels({
    service: 'mcp-server'
  });

  // Collect default Node.js metrics (memory, CPU, event loop, GC)
  collectDefaultMetrics({ register });
}
