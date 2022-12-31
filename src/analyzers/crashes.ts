import type { LogEntry, CrashReport, PlayerEvent, ResourceEvent } from "../parser/types.js";

export class CrashAnalyzer {
  analyze(
    entries: LogEntry[],
    playerEvents: PlayerEvent[],
    resourceEvents: ResourceEvent[]
  ): CrashReport[] {
    const crashEntries = entries.filter((e) => e.action === "server.crash");
    const reports: CrashReport[] = [];

    for (const crash of crashEntries) {
      const report = this.buildCrashReport(
        crash,
        entries,
        playerEvents,
        resourceEvents
      );
      reports.push(report);
    }

    return reports;
  }

  private buildCrashReport(
    crash: LogEntry,
    allEntries: LogEntry[],
    playerEvents: PlayerEvent[],
    resourceEvents: ResourceEvent[]
  ): CrashReport {
    const crashTime = crash.timestamp.getTime();
    const lookbackMs = 5 * 60 * 1000; // 5 minutes before crash

    // Find last server start to calculate uptime
    const lastStart = [...allEntries]
      .filter(
        (e) =>
          e.action === "server.start" &&
          e.timestamp.getTime() < crashTime
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    const uptime = lastStart
      ? crashTime - lastStart.timestamp.getTime()
      : 0;

    // Players online at crash time
    const recentJoins = playerEvents.filter(
      (e) =>
        e.action === "player.join" &&
        e.timestamp.getTime() < crashTime &&
        e.timestamp.getTime() > crashTime - lookbackMs * 6
    );
    const recentLeaves = new Set(
      playerEvents
        .filter(
          (e) =>
            e.action === "player.leave" &&
            e.timestamp.getTime() < crashTime
        )
        .map((e) => e.playerName)
    );
    const lastPlayers = recentJoins
      .filter((j) => !recentLeaves.has(j.playerName))
      .map((j) => j.playerName)
      .slice(0, 10);

    // Resources with errors near crash
    const recentResourceErrors = resourceEvents
      .filter(
        (e) =>
          e.action === "error" &&
          e.timestamp.getTime() > crashTime - lookbackMs &&
          e.timestamp.getTime() <= crashTime
      )
      .map((e) => e.resourceName);

    // Recent resource starts (possible cause)
    const recentStarts = resourceEvents
      .filter(
        (e) =>
          (e.action === "start" || e.action === "restart") &&
          e.timestamp.getTime() > crashTime - lookbackMs &&
          e.timestamp.getTime() <= crashTime
      )
      .map((e) => e.resourceName);

    const lastResources = [
      ...new Set([...recentResourceErrors, ...recentStarts]),
    ];

    // Try to detect cause
    let possibleCause: string | undefined;
    if (crash.message.toLowerCase().includes("out of memory")) {
      possibleCause = "Server ran out of memory";
    } else if (recentResourceErrors.length > 0) {
      possibleCause = `Resource errors in: ${recentResourceErrors.join(", ")}`;
    } else if (recentStarts.length > 0) {
      possibleCause = `Recent resource changes: ${recentStarts.join(", ")}`;
    }

    // Extract stack trace from surrounding lines
    const crashLineIdx = crash.line;
    const surroundingErrors = allEntries
      .filter(
        (e) =>
          e.level === "error" &&
          Math.abs(e.line - crashLineIdx) < 10 &&
          e.line <= crashLineIdx
      )
      .map((e) => e.message);

    const stackTrace =
      surroundingErrors.length > 0
        ? surroundingErrors.join("\n")
        : undefined;

    return {
      timestamp: crash.timestamp,
      uptime,
      lastPlayers,
      lastResources,
      possibleCause,
      stackTrace,
    };
  }
}
