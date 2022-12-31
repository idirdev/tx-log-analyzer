import type { ResourceEvent, ResourceSummary } from "../parser/types.js";

export class ResourceAnalyzer {
  analyze(events: ResourceEvent[]): ResourceSummary[] {
    const byName = new Map<string, ResourceEvent[]>();

    for (const event of events) {
      const existing = byName.get(event.resourceName) || [];
      existing.push(event);
      byName.set(event.resourceName, existing);
    }

    const summaries: ResourceSummary[] = [];

    for (const [name, resourceEvents] of byName) {
      const starts = resourceEvents.filter((e) => e.action === "start");
      const errors = resourceEvents.filter((e) => e.action === "error");

      const avgStartTimeMs =
        starts.length > 0
          ? starts.reduce((sum, s) => sum + (s.startTimeMs || 0), 0) /
            starts.length
          : 0;

      const lastError = errors.length > 0
        ? errors[errors.length - 1].errorMessage
        : undefined;

      summaries.push({
        name,
        starts: starts.length,
        errors: errors.length,
        avgStartTimeMs: Math.round(avgStartTimeMs),
        lastError,
      });
    }

    return summaries.sort((a, b) => b.errors - a.errors);
  }

  findProblematic(summaries: ResourceSummary[], errorThreshold = 3): ResourceSummary[] {
    return summaries.filter((s) => s.errors >= errorThreshold);
  }

  findSlowest(summaries: ResourceSummary[], limit = 10): ResourceSummary[] {
    return [...summaries]
      .filter((s) => s.avgStartTimeMs > 0)
      .sort((a, b) => b.avgStartTimeMs - a.avgStartTimeMs)
      .slice(0, limit);
  }
}
