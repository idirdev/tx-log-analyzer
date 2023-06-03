import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsoleReporter } from '../src/reporters/console';
import type { AnalysisReport } from '../src/parser/types';

describe('ConsoleReporter', () => {
  let reporter: ConsoleReporter;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  const mockReport: AnalysisReport = {
    summary: {
      totalEntries: 100,
      timeRange: { start: '2024-08-10 14:00:00', end: '2024-08-10 18:00:00' },
      uniquePlayers: 15,
      totalSessions: 25,
      totalBans: 2,
      totalKicks: 3,
      totalCrashes: 0,
      avgSessionDuration: '1h 30m',
      peakConcurrent: 10,
      peakTime: '2024-08-10 16:00:00',
    },
    sessions: [],
    bans: [],
    crashes: [],
    resources: [],
    hourlyActivity: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      joins: i === 16 ? 5 : 1,
      leaves: i === 18 ? 4 : 0,
      concurrent: i >= 14 && i <= 18 ? 8 : 2,
    })),
    topPlayers: [
      { name: 'Alice', totalTime: '3h 20m', sessions: 5, warnings: 0, kicks: 0 },
      { name: 'Bob', totalTime: '2h 10m', sessions: 3, warnings: 1, kicks: 1 },
    ],
  };

  beforeEach(() => {
    reporter = new ConsoleReporter();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('renders report without throwing', () => {
    expect(() => reporter.render(mockReport)).not.toThrow();
  });

  it('calls console.log multiple times when rendering', () => {
    reporter.render(mockReport);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('renders crash section with no crashes', () => {
    reporter.render(mockReport);
    const allOutput = consoleSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(allOutput).toContain('crash');
  });

  it('handles report with bans', () => {
    const reportWithBans: AnalysisReport = {
      ...mockReport,
      summary: { ...mockReport.summary, totalBans: 1 },
      bans: [
        {
          timestamp: new Date('2024-08-10T14:00:00'),
          playerName: 'Cheater',
          playerId: '1',
          identifiers: [],
          reason: 'cheating',
          adminName: 'mod1',
        },
      ],
    };
    expect(() => reporter.render(reportWithBans)).not.toThrow();
  });

  it('handles empty top players', () => {
    const reportNoPlayers: AnalysisReport = {
      ...mockReport,
      topPlayers: [],
    };
    expect(() => reporter.render(reportNoPlayers)).not.toThrow();
  });
});
