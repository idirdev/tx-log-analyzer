import { readFileSync, statSync } from "fs";
import * as patterns from "./patterns.js";
import type {
  LogEntry,
  LogLevel,
  ActionType,
  ParseResult,
  PlayerEvent,
  ResourceEvent,
} from "./types.js";

export class LogParser {
  private entries: LogEntry[] = [];
  private parseErrors = 0;

  parse(filePath: string): ParseResult {
    const stat = statSync(filePath);
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim());

    this.entries = [];
    this.parseErrors = 0;

    for (let i = 0; i < lines.length; i++) {
      const entry = this.parseLine(lines[i], i + 1);
      if (entry) {
        this.entries.push(entry);
      } else {
        this.parseErrors++;
      }
    }

    const timestamps = this.entries.map((e) => e.timestamp.getTime());
    return {
      entries: this.entries,
      totalLines: lines.length,
      parseErrors: this.parseErrors,
      timeRange: {
        start: new Date(Math.min(...timestamps)),
        end: new Date(Math.max(...timestamps)),
      },
      fileSize: stat.size,
      filePath,
    };
  }

  private parseLine(line: string, lineNum: number): LogEntry | null {
    const match = line.match(patterns.LOG_LINE);
    if (!match) return null;

    const [, timestampStr, levelStr, message] = match;
    const timestamp = new Date(timestampStr.replace(" ", "T"));
    if (isNaN(timestamp.getTime())) return null;

    const level = this.parseLevel(levelStr);
    const action = this.detectAction(message);
    const metadata = this.extractMetadata(message);

    return {
      timestamp,
      level,
      action,
      source: this.extractSource(message),
      message: message.trim(),
      metadata,
      raw: line,
      line: lineNum,
    };
  }

  private parseLevel(level: string): LogLevel {
    const l = level.toLowerCase();
    if (l === "warn" || l === "warning") return "warn";
    if (l === "error" || l === "err") return "error";
    if (l === "fatal" || l === "critical") return "fatal";
    return "info";
  }

  private detectAction(message: string): ActionType {
    if (patterns.PLAYER_JOIN.test(message)) return "player.join";
    if (patterns.PLAYER_LEAVE.test(message)) return "player.leave";
    if (patterns.PLAYER_BAN.test(message)) return "player.ban";
    if (patterns.PLAYER_KICK.test(message)) return "player.kick";
    if (patterns.PLAYER_WARN.test(message)) return "player.warn";
    if (patterns.SERVER_START.test(message)) return "server.start";
    if (patterns.SERVER_STOP.test(message)) return "server.stop";
    if (patterns.SERVER_CRASH.test(message)) return "server.crash";
    if (patterns.RESOURCE_ERROR.test(message)) return "resource.error";
    if (patterns.RESOURCE_ACTION.test(message)) {
      const m = message.match(patterns.RESOURCE_ACTION);
      if (m?.[2]?.toLowerCase() === "started") return "resource.start";
      if (m?.[2]?.toLowerCase() === "stopped") return "resource.stop";
    }
    if (patterns.CHAT_MESSAGE.test(message)) return "chat.message";
    if (patterns.TXADMIN_ACTION.test(message)) return "txadmin.action";
    return "unknown";
  }

  private extractMetadata(message: string): Record<string, string> {
    const meta: Record<string, string> = {};

    const ipMatch = message.match(patterns.IP_ADDRESS);
    if (ipMatch) meta.ip = ipMatch[1];

    const identifiers = message.match(patterns.IDENTIFIER);
    if (identifiers) meta.identifiers = identifiers.join(", ");

    return meta;
  }

  private extractSource(message: string): string {
    const scriptMatch = message.match(/\[script:([^\]]+)\]/);
    if (scriptMatch) return scriptMatch[1];
    if (message.includes("[txAdmin]")) return "txAdmin";
    if (message.includes("[chat]")) return "chat";
    return "server";
  }

  extractPlayerEvents(): PlayerEvent[] {
    const events: PlayerEvent[] = [];

    for (const entry of this.entries) {
      if (entry.action === "player.join") {
        const m = entry.message.match(patterns.PLAYER_JOIN);
        if (m) {
          events.push({
            timestamp: entry.timestamp,
            playerName: m[1],
            playerId: m[2],
            identifiers: m[3]?.match(patterns.IDENTIFIER) || [],
            action: "player.join",
            ip: entry.metadata.ip,
          });
        }
      }

      if (entry.action === "player.leave") {
        const m = entry.message.match(patterns.PLAYER_LEAVE);
        if (m) {
          events.push({
            timestamp: entry.timestamp,
            playerName: m[1],
            playerId: m[2],
            identifiers: [],
            action: "player.leave",
            reason: m[3],
          });
        }
      }

      if (entry.action === "player.kick") {
        const m = entry.message.match(patterns.PLAYER_KICK);
        if (m) {
          events.push({
            timestamp: entry.timestamp,
            playerName: m[2],
            playerId: "",
            identifiers: [],
            action: "player.kick",
            adminName: m[1],
            reason: m[3],
          });
        }
      }

      if (entry.action === "player.ban") {
        const m = entry.message.match(patterns.PLAYER_BAN);
        if (m) {
          events.push({
            timestamp: entry.timestamp,
            playerName: m[2],
            playerId: "",
            identifiers: [],
            action: "player.ban",
            adminName: m[1],
            reason: m[3],
          });
        }
      }
    }

    return events;
  }

  extractResourceEvents(): ResourceEvent[] {
    const events: ResourceEvent[] = [];

    for (const entry of this.entries) {
      const actionMatch = entry.message.match(patterns.RESOURCE_ACTION);
      if (actionMatch) {
        const action = actionMatch[2].toLowerCase() as ResourceEvent["action"];
        events.push({
          timestamp: entry.timestamp,
          resourceName: actionMatch[1],
          action: action === "restarting" ? "restart" : action as "start" | "stop" | "error",
        });
        continue;
      }

      const errorMatch = entry.message.match(patterns.RESOURCE_ERROR);
      if (errorMatch) {
        events.push({
          timestamp: entry.timestamp,
          resourceName: errorMatch[1],
          action: "error",
          errorMessage: errorMatch[2],
        });
      }
    }

    return events;
  }
}
