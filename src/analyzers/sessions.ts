import type { PlayerEvent, SessionInfo, SessionSummary, HourlyBucket } from "../parser/types.js";

export class SessionAnalyzer {
  analyze(events: PlayerEvent[]): {
    sessions: SessionInfo[];
    summaries: SessionSummary[];
    hourly: HourlyBucket[];
    peakConcurrent: number;
    peakTime: Date;
  } {
    const sessions = this.buildSessions(events);
    const summaries = this.summarize(sessions);
    const hourly = this.buildHourlyActivity(events, sessions);
    const { peak, peakTime } = this.findPeakConcurrent(sessions);

    return { sessions, summaries, hourly, peakConcurrent: peak, peakTime };
  }

  private buildSessions(events: PlayerEvent[]): SessionInfo[] {
    const sessions: SessionInfo[] = [];
    const activeSessions = new Map<string, PlayerEvent>();

    const sorted = [...events].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    for (const event of sorted) {
      const key = event.playerName;

      if (event.action === "player.join") {
        activeSessions.set(key, event);
      } else if (
        event.action === "player.leave" ||
        event.action === "player.kick"
      ) {
        const joinEvent = activeSessions.get(key);
        if (joinEvent) {
          sessions.push({
            playerName: joinEvent.playerName,
            playerId: joinEvent.playerId,
            identifiers: joinEvent.identifiers,
            joinTime: joinEvent.timestamp,
            leaveTime: event.timestamp,
            durationMs:
              event.timestamp.getTime() - joinEvent.timestamp.getTime(),
            disconnectReason: event.reason,
            ip: joinEvent.ip || "",
          });
          activeSessions.delete(key);
        }
      }
    }

    // Close remaining active sessions at last event timestamp
    const lastTime =
      sorted.length > 0
        ? sorted[sorted.length - 1].timestamp
        : new Date();

    for (const [, joinEvent] of activeSessions) {
      sessions.push({
        playerName: joinEvent.playerName,
        playerId: joinEvent.playerId,
        identifiers: joinEvent.identifiers,
        joinTime: joinEvent.timestamp,
        durationMs: lastTime.getTime() - joinEvent.timestamp.getTime(),
        ip: joinEvent.ip || "",
      });
    }

    return sessions;
  }

  private summarize(sessions: SessionInfo[]): SessionSummary[] {
    const byPlayer = new Map<string, SessionInfo[]>();

    for (const session of sessions) {
      const existing = byPlayer.get(session.playerName) || [];
      existing.push(session);
      byPlayer.set(session.playerName, existing);
    }

    const summaries: SessionSummary[] = [];
    for (const [name, playerSessions] of byPlayer) {
      const totalTimeMs = playerSessions.reduce(
        (sum, s) => sum + s.durationMs,
        0
      );
      const lastSession = playerSessions.sort(
        (a, b) => b.joinTime.getTime() - a.joinTime.getTime()
      )[0];

      summaries.push({
        playerName: name,
        totalSessions: playerSessions.length,
        totalTimeMs,
        avgSessionMs: Math.round(totalTimeMs / playerSessions.length),
        lastSeen: lastSession.leaveTime || lastSession.joinTime,
        identifiers: lastSession.identifiers,
      });
    }

    return summaries.sort((a, b) => b.totalTimeMs - a.totalTimeMs);
  }

  private buildHourlyActivity(
    events: PlayerEvent[],
    sessions: SessionInfo[]
  ): HourlyBucket[] {
    const buckets: HourlyBucket[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      joins: 0,
      leaves: 0,
      concurrent: 0,
    }));

    for (const event of events) {
      const hour = event.timestamp.getHours();
      if (event.action === "player.join") buckets[hour].joins++;
      if (event.action === "player.leave") buckets[hour].leaves++;
    }

    // Estimate concurrent by hour
    for (const bucket of buckets) {
      const activeDuring = sessions.filter((s) => {
        const joinHour = s.joinTime.getHours();
        const leaveHour = s.leaveTime?.getHours() ?? 23;
        return joinHour <= bucket.hour && leaveHour >= bucket.hour;
      });
      bucket.concurrent = activeDuring.length;
    }

    return buckets;
  }

  private findPeakConcurrent(sessions: SessionInfo[]): {
    peak: number;
    peakTime: Date;
  } {
    const events: { time: Date; delta: number }[] = [];

    for (const session of sessions) {
      events.push({ time: session.joinTime, delta: 1 });
      if (session.leaveTime) {
        events.push({ time: session.leaveTime, delta: -1 });
      }
    }

    events.sort((a, b) => a.time.getTime() - b.time.getTime());

    let current = 0;
    let peak = 0;
    let peakTime = new Date();

    for (const event of events) {
      current += event.delta;
      if (current > peak) {
        peak = current;
        peakTime = event.time;
      }
    }

    return { peak, peakTime };
  }
}
