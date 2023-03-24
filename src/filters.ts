interface LogAction {
  action: string;
  target: string;
  admin?: string;
  timestamp: string;
  reason?: string;
}

type FilterFn = (action: LogAction) => boolean;

export function byAction(...actions: string[]): FilterFn {
  const set = new Set(actions);
  return (a) => set.has(a.action);
}

export function byPlayer(player: string): FilterFn {
  const lower = player.toLowerCase();
  return (a) => a.target.toLowerCase().includes(lower);
}

export function byAdmin(admin: string): FilterFn {
  return (a) => a.admin === admin;
}

export function byDateRange(start: string, end: string): FilterFn {
  return (a) => a.timestamp >= start && a.timestamp <= end;
}

export function byReason(keyword: string): FilterFn {
  const lower = keyword.toLowerCase();
  return (a) => a.reason?.toLowerCase().includes(lower) ?? false;
}

export function and(...filters: FilterFn[]): FilterFn {
  return (a) => filters.every((f) => f(a));
}

export function or(...filters: FilterFn[]): FilterFn {
  return (a) => filters.some((f) => f(a));
}

export function not(filter: FilterFn): FilterFn {
  return (a) => !filter(a);
}

export function applyFilters(actions: LogAction[], ...filters: FilterFn[]): LogAction[] {
  const combined = and(...filters);
  return actions.filter(combined);
}
