export type LogLevel = "info" | "warn" | "error" | "fatal";
export type ActionType =
  | "player.join"
  | "player.leave"
  | "player.kick"
  | "player.ban"
  | "player.warn"
  | "server.start"
  | "server.stop"
  | "server.crash"
  | "resource.start"
  | "resource.stop"
  | "resource.error"
  | "txadmin.action"
  | "chat.message"
  | "unknown";

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  action: ActionType;
  source: string;
  message: string;
  metadata: Record<string, string>;
  raw: string;
  line: number;
}

export interface PlayerEvent {
  timestamp: Date;
  playerName: string;
  playerId: string;
  identifiers: string[];
  action: ActionType;
  reason?: string;
  adminName?: string;
  ip?: string;
}

export interface SessionInfo {
  playerName: string;
  playerId: string;
  identifiers: string[];
  joinTime: Date;
  leaveTime?: Date;
  durationMs: number;
  disconnectReason?: string;
  ip: string;
}

export interface ResourceEvent {
  timestamp: Date;
  resourceName: string;
  action: "start" | "stop" | "error" | "restart";
  errorMessage?: string;
  startTimeMs?: number;
}

export interface CrashReport {
  timestamp: Date;
  uptime: number;
  lastPlayers: string[];
  lastResources: string[];
  possibleCause?: string;
  stackTrace?: string;
}

export interface BanRecord {
  timestamp: Date;
  playerName: string;
  playerId: string;
  identifiers: string[];
  reason: string;
  adminName: string;
  duration?: string;
  expiry?: Date;
}

export interface ParseResult {
  entries: LogEntry[];
  totalLines: number;
  parseErrors: number;
  timeRange: { start: Date; end: Date };
  fileSize: number;
  filePath: string;
}

export interface AnalysisReport {
  summary: {
    totalEntries: number;
    timeRange: { start: string; end: string };
    uniquePlayers: number;
    totalSessions: number;
    totalBans: number;
    totalKicks: number;
    totalCrashes: number;
    avgSessionDuration: string;
    peakConcurrent: number;
    peakTime: string;
  };
  sessions: SessionSummary[];
  bans: BanRecord[];
  crashes: CrashReport[];
  resources: ResourceSummary[];
  hourlyActivity: HourlyBucket[];
  topPlayers: PlayerSummary[];
}

export interface SessionSummary {
  playerName: string;
  totalSessions: number;
  totalTimeMs: number;
  avgSessionMs: number;
  lastSeen: Date;
  identifiers: string[];
}

export interface ResourceSummary {
  name: string;
  starts: number;
  errors: number;
  avgStartTimeMs: number;
  lastError?: string;
}

export interface HourlyBucket {
  hour: number;
  joins: number;
  leaves: number;
  concurrent: number;
}

export interface PlayerSummary {
  name: string;
  totalTime: string;
  sessions: number;
  warnings: number;
  kicks: number;
}
