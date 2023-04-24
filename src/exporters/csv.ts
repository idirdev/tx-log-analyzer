interface LogAction {
  action: string;
  target: string;
  admin?: string;
  timestamp: string;
  reason?: string;
}

interface CsvOptions {
  delimiter?: string;
  columns?: (keyof LogAction)[];
  includeHeader?: boolean;
}

const DEFAULT_COLUMNS: (keyof LogAction)[] = ['timestamp', 'action', 'target', 'admin', 'reason'];

export function exportToCsv(actions: LogAction[], opts: CsvOptions = {}): string {
  const { delimiter = ',', columns = DEFAULT_COLUMNS, includeHeader = true } = opts;
  const lines: string[] = [];

  if (includeHeader) {
    lines.push(columns.join(delimiter));
  }

  for (const action of actions) {
    const row = columns.map((col) => {
      const val = action[col] ?? '';
      return escapeField(String(val), delimiter);
    });
    lines.push(row.join(delimiter));
  }

  return lines.join('\n');
}

function escapeField(value: string, delimiter: string): string {
  if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}
