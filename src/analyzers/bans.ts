import type { PlayerEvent, BanRecord } from "../parser/types.js";
import * as patterns from "../parser/patterns.js";

export class BanAnalyzer {
  analyze(events: PlayerEvent[]): {
    bans: BanRecord[];
    kicks: { playerName: string; reason?: string; adminName?: string; timestamp: Date }[];
    warnings: { playerName: string; reason?: string; adminName?: string; timestamp: Date }[];
    repeatOffenders: { name: string; bans: number; kicks: number; warnings: number }[];
  } {
    const bans = this.extractBans(events);
    const kicks = this.extractKicks(events);
    const warnings = this.extractWarnings(events);
    const repeatOffenders = this.findRepeatOffenders(bans, kicks, warnings);

    return { bans, kicks, warnings, repeatOffenders };
  }

  private extractBans(events: PlayerEvent[]): BanRecord[] {
    return events
      .filter((e) => e.action === "player.ban")
      .map((e) => ({
        timestamp: e.timestamp,
        playerName: e.playerName,
        playerId: e.playerId,
        identifiers: e.identifiers,
        reason: e.reason || "No reason specified",
        adminName: e.adminName || "System",
        duration: this.parseBanDuration(e.reason),
        expiry: this.calculateExpiry(e.timestamp, e.reason),
      }));
  }

  private extractKicks(events: PlayerEvent[]) {
    return events
      .filter((e) => e.action === "player.kick")
      .map((e) => ({
        playerName: e.playerName,
        reason: e.reason,
        adminName: e.adminName,
        timestamp: e.timestamp,
      }));
  }

  private extractWarnings(events: PlayerEvent[]) {
    return events
      .filter((e) => e.action === "player.warn")
      .map((e) => ({
        playerName: e.playerName,
        reason: e.reason,
        adminName: e.adminName,
        timestamp: e.timestamp,
      }));
  }

  private findRepeatOffenders(
    bans: BanRecord[],
    kicks: { playerName: string }[],
    warnings: { playerName: string }[]
  ) {
    const players = new Map<
      string,
      { bans: number; kicks: number; warnings: number }
    >();

    for (const ban of bans) {
      const p = players.get(ban.playerName) || { bans: 0, kicks: 0, warnings: 0 };
      p.bans++;
      players.set(ban.playerName, p);
    }

    for (const kick of kicks) {
      const p = players.get(kick.playerName) || { bans: 0, kicks: 0, warnings: 0 };
      p.kicks++;
      players.set(kick.playerName, p);
    }

    for (const warn of warnings) {
      const p = players.get(warn.playerName) || { bans: 0, kicks: 0, warnings: 0 };
      p.warnings++;
      players.set(warn.playerName, p);
    }

    return [...players.entries()]
      .filter(([, p]) => p.bans + p.kicks + p.warnings >= 2)
      .map(([name, p]) => ({ name, ...p }))
      .sort((a, b) => b.bans + b.kicks - (a.bans + a.kicks));
  }

  private parseBanDuration(reason?: string): string | undefined {
    if (!reason) return undefined;
    if (patterns.PERMANENT.test(reason)) return "permanent";
    const durationMatch = reason.match(patterns.DURATION);
    if (durationMatch) return durationMatch[0];
    return undefined;
  }

  private calculateExpiry(banTime: Date, reason?: string): Date | undefined {
    if (!reason) return undefined;
    if (patterns.PERMANENT.test(reason)) return undefined;

    const durationMatch = reason.match(patterns.DURATION);
    if (!durationMatch) return undefined;

    const amount = parseInt(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    const expiry = new Date(banTime);

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 3600 * 1000,
      d: 86400 * 1000,
      w: 7 * 86400 * 1000,
    };

    expiry.setTime(expiry.getTime() + amount * (multipliers[unit] || 0));
    return expiry;
  }
}
