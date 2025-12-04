/**
 * Naming - Collision-Safe Resource Naming (T028)
 *
 * Generates unique resource names following the pattern:
 * test-{domain}-{timestamp}-{random4}
 */

/**
 * Generate a resource name with timestamp and random suffix
 */
export function generateResourceName(domain: string): string {
  // Format: YYYYMMDDHHmmss
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  // 4-char random alphanumeric suffix
  const random = Math.random().toString(36).substring(2, 6).padEnd(4, '0');
  return `test-${domain}-${timestamp}-${random}`;
}

/**
 * Generate a unique resource name that doesn't collide with existing names
 *
 * @param domain - The test domain (e.g., 'apps', 'databases')
 * @param existingNames - Set of existing resource names to avoid
 * @param maxAttempts - Maximum number of attempts (default: 3)
 * @throws Error if unable to generate unique name after maxAttempts
 */
export async function generateUniqueName(domain: string, existingNames: Set<string>, maxAttempts: number = 3): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const name = generateResourceName(domain);
    if (!existingNames.has(name)) {
      return name;
    }
    // Small delay to ensure different timestamp if collision
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Failed to generate unique name after ${maxAttempts} attempts`);
}

/**
 * Check if a resource name matches the test naming pattern
 */
export function isTestResource(name: string): boolean {
  // Pattern: test-{domain}-{timestamp}-{random}
  return /^test-[a-z-]+-\d{14}-[a-z0-9]{4}$/.test(name);
}

/**
 * Extract domain from a test resource name
 */
export function extractDomain(name: string): string | null {
  const match = name.match(/^test-([a-z-]+)-\d{14}-[a-z0-9]{4}$/);
  return match ? match[1] : null;
}

/**
 * Generate a temporary directory path for a domain
 */
export function getTempDirPath(domain: string): string {
  return `/tmp/mcp-tests-${domain}`;
}
