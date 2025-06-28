/**
 * Parse duration string to milliseconds
 * Supports formats like: 1h, 30m, 30s, 1h30m, 3600s
 */
export function parseDuration(duration: string): number {
  if (!duration) {
    throw new Error('Duration cannot be empty');
  }

  // Remove whitespace
  const normalized = duration.replace(/\s+/g, '');
  
  // Match number + unit patterns
  const matches = normalized.match(/(\d+)([smhd])/g);
  
  if (!matches) {
    throw new Error(`Invalid duration format: ${duration}. Use formats like '1h', '30m', '30s'`);
  }

  let totalMs = 0;
  
  for (const match of matches) {
    const [, num, unit] = match.match(/(\d+)([smhd])/)!;
    const value = parseInt(num, 10);
    
    switch (unit) {
      case 's':
        totalMs += value * 1000;
        break;
      case 'm':
        totalMs += value * 60 * 1000;
        break;
      case 'h':
        totalMs += value * 60 * 60 * 1000;
        break;
      case 'd':
        totalMs += value * 24 * 60 * 60 * 1000;
        break;
      default:
        throw new Error(`Unknown time unit: ${unit}`);
    }
  }
  
  if (totalMs === 0) {
    throw new Error(`Duration cannot be zero: ${duration}`);
  }
  
  return totalMs;
}