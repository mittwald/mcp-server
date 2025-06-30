/**
 * Format data as a table for CLI output
 */

interface TableOptions {
  showHeaders?: boolean;
  truncate?: boolean;
  maxColumnWidth?: number;
}

export function formatTable(
  data: Record<string, any>[],
  options: TableOptions = {}
): string {
  if (!data || data.length === 0) {
    return 'No data';
  }

  const {
    showHeaders = true,
    truncate = true,
    maxColumnWidth = 40
  } = options;

  // Get all unique columns
  const columns = Array.from(
    new Set(data.flatMap(row => Object.keys(row)))
  );

  // Calculate column widths
  const columnWidths: Record<string, number> = {};
  
  columns.forEach(col => {
    let maxWidth = showHeaders ? col.length : 0;
    
    data.forEach(row => {
      const value = String(row[col] ?? '');
      maxWidth = Math.max(maxWidth, value.length);
    });
    
    columnWidths[col] = truncate
      ? Math.min(maxWidth, maxColumnWidth)
      : maxWidth;
  });

  // Format rows
  const rows: string[] = [];
  
  // Add header
  if (showHeaders) {
    const headerRow = columns
      .map(col => col.padEnd(columnWidths[col]))
      .join(' | ');
    rows.push(headerRow);
    
    // Add separator
    const separator = columns
      .map(col => '-'.repeat(columnWidths[col]))
      .join('-+-');
    rows.push(separator);
  }
  
  // Add data rows
  data.forEach(row => {
    const dataRow = columns
      .map(col => {
        let value = String(row[col] ?? '');
        if (truncate && value.length > columnWidths[col]) {
          value = value.substring(0, columnWidths[col] - 3) + '...';
        }
        return value.padEnd(columnWidths[col]);
      })
      .join(' | ');
    rows.push(dataRow);
  });
  
  return rows.join('\n');
}