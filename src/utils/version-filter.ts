/**
 * Utility functions for filtering app versions to reduce LLM token usage
 * while maintaining all version availability for installation
 */

interface AppVersion {
  id: string;
  externalVersion: string;
  internalVersion: string;
  supported?: boolean;
  deprecated?: boolean;
  current?: boolean;
}

interface FilteredVersion {
  id: string;
  externalVersion: string;
  internalVersion: string;
}

/**
 * Parse a semantic version string into major, minor, patch components
 * Handles versions like "6.4.20.0", "5.2", "1.0.0"
 */
function parseSemanticVersion(version: string): { major: number; minor: number; patch: number; extra?: string } {
  const parts = version.split('.');
  return {
    major: parseInt(parts[0]) || 0,
    minor: parseInt(parts[1]) || 0,
    patch: parseInt(parts[2]) || 0,
    extra: parts.slice(3).join('.')
  };
}

/**
 * Compare two semantic versions
 * Returns positive if a > b, negative if a < b, 0 if equal
 */
function compareVersions(a: string, b: string): number {
  const versionA = parseSemanticVersion(a);
  const versionB = parseSemanticVersion(b);
  
  if (versionA.major !== versionB.major) {
    return versionA.major - versionB.major;
  }
  if (versionA.minor !== versionB.minor) {
    return versionA.minor - versionB.minor;
  }
  if (versionA.patch !== versionB.patch) {
    return versionA.patch - versionB.patch;
  }
  
  // Compare extra parts if they exist (e.g., "6.4.20.0" vs "6.4.20.1")
  if (versionA.extra || versionB.extra) {
    const extraA = versionA.extra || '0';
    const extraB = versionB.extra || '0';
    return extraA.localeCompare(extraB, undefined, { numeric: true });
  }
  
  return 0;
}

/**
 * Filter versions to only include the latest point release for each major version
 * This significantly reduces the data sent to LLMs while preserving the ability
 * to install any version (users can still specify exact versions)
 */
export function filterLatestVersionsPerMajor(versions: AppVersion[]): FilteredVersion[] {
  if (!versions || versions.length === 0) {
    return [];
  }
  
  // Group versions by major version
  const versionsByMajor = new Map<number, AppVersion[]>();
  
  versions.forEach(version => {
    const parsed = parseSemanticVersion(version.externalVersion);
    const major = parsed.major;
    
    if (!versionsByMajor.has(major)) {
      versionsByMajor.set(major, []);
    }
    versionsByMajor.get(major)!.push(version);
  });
  
  // For each major version, find the latest version
  const filteredVersions: FilteredVersion[] = [];
  
  versionsByMajor.forEach((majorVersions, _major) => {
    // Sort versions within this major version in descending order
    const sorted = majorVersions.sort((a, b) => 
      compareVersions(b.externalVersion, a.externalVersion)
    );
    
    // Take the latest version (first after sorting)
    const latest = sorted[0];
    
    // Create filtered version object without unnecessary fields
    filteredVersions.push({
      id: latest.id,
      externalVersion: latest.externalVersion,
      internalVersion: latest.internalVersion
    });
  });
  
  // Sort the final result by version in descending order
  return filteredVersions.sort((a, b) => 
    compareVersions(b.externalVersion, a.externalVersion)
  );
}

/**
 * Filter app data for LLM consumption
 * Removes empty descriptions and always-false status fields
 */
export function filterAppDataForLLM(app: {
  id: string;
  name: string;
  description?: string;
  versions: AppVersion[];
}): {
  id: string;
  name: string;
  versions: FilteredVersion[];
} {
  return {
    id: app.id,
    name: app.name,
    versions: filterLatestVersionsPerMajor(app.versions)
  };
}
