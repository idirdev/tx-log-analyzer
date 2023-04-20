interface LogAction {
  action: string;
  target: string;
  admin?: string;
  timestamp: string;
  reason?: string;
}

interface JsonExportOptions {
  pretty?: boolean;
  includeMetadata?: boolean;
}

export function exportToJson(actions: LogAction[], opts: JsonExportOptions = {}): string {
  const data: any = {
    actions,
    summary: {
      total: actions.length,
      byType: countByField(actions, 'action'),
      uniquePlayers: new Set(actions.map((a) => a.target)).size,
      uniqueAdmins: new Set(actions.filter((a) => a.admin).map((a) => a.admin)).size,
    },
  };

  if (opts.includeMetadata) {
    data.metadata = {
      exportedAt: new Date().toISOString(),
      firstAction: actions[0]?.timestamp ?? null,
      lastAction: actions[actions.length - 1]?.timestamp ?? null,
    };
  }

  return JSON.stringify(data, null, opts.pretty ? 2 : undefined);
}

function countByField(actions: LogAction[], field: keyof LogAction): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const a of actions) {
    const val = a[field] as string;
    if (val) counts[val] = (counts[val] || 0) + 1;
  }
  return counts;
}
