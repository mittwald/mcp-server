/**
 * Helper utilities for parsing Mittwald CLI output without depending on the legacy cli-wrapper module.
 */
export function parseCliJsonOutput(output: string): unknown {
  try {
    const lines = output.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('{') || line.startsWith('[')) {
        let jsonStr = line;
        for (let j = i + 1; j < lines.length; j++) {
          jsonStr += '\n' + lines[j];
          try {
            return JSON.parse(jsonStr);
          } catch {
            // continue aggregating lines until we get valid JSON
          }
        }

        try {
          return JSON.parse(jsonStr);
        } catch {
          // Move on to the next potential JSON candidate
        }
      }
    }

    return JSON.parse(output);
  } catch (error) {
    throw new Error(`Failed to parse JSON output: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function parseCliQuietOutput(output: string): string | null {
  const lines = output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  return lines[lines.length - 1];
}

export const parseJsonOutput = parseCliJsonOutput;
export const parseQuietOutput = parseCliQuietOutput;
