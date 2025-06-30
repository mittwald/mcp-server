/**
 * Format data as CSV for CLI output
 */

interface CsvOptions {
  separator?: string;
  includeHeaders?: boolean;
}

export function formatCsv(
  data: Record<string, any>[],
  options: CsvOptions = {}
): string {
  if (!data || data.length === 0) {
    return '';
  }

  const {
    separator = ',',
    includeHeaders = true
  } = options;

  // Get all unique columns
  const columns = Array.from(
    new Set(data.flatMap(row => Object.keys(row)))
  );

  const rows: string[] = [];
  
  // Add header
  if (includeHeaders) {
    const headerRow = columns
      .map(col => escapeValue(col, separator))
      .join(separator);
    rows.push(headerRow);
  }
  
  // Add data rows
  data.forEach(row => {
    const dataRow = columns
      .map(col => escapeValue(String(row[col] ?? ''), separator))
      .join(separator);
    rows.push(dataRow);
  });
  
  return rows.join('\n');
}

function escapeValue(value: string, separator: string): string {
  // If value contains separator, newline, or quotes, wrap in quotes
  if (
    value.includes(separator) ||
    value.includes('\n') ||
    value.includes('\r') ||
    value.includes('"')
  ) {
    // Escape quotes by doubling them
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}