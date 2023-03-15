import { describe, it, expect } from 'vitest';
import { Analyzer } from '../src/analyzer';

describe('Analyzer', () => {
  const sampleActions = [
    { action: 'ban', target: 'PlayerA', admin: 'admin1', timestamp: '2024-08-10 14:30:22', reason: 'cheating' },
    { action: 'kick', target: 'PlayerB', admin: 'admin1', timestamp: '2024-08-10 14:35:00' },
    { action: 'ban', target: 'PlayerC', admin: 'admin2', timestamp: '2024-08-10 15:00:00', reason: 'exploit' },
    { action: 'warn', target: 'PlayerA', admin: 'admin1', timestamp: '2024-08-10 15:30:00', reason: 'language' },
    { action: 'kick', target: 'PlayerA', admin: 'admin2', timestamp: '2024-08-10 16:00:00' },
  ];

  it('counts actions by type', () => {
    const a = new Analyzer(sampleActions);
    const counts = a.actionCounts();
    expect(counts.ban).toBe(2);
    expect(counts.kick).toBe(2);
    expect(counts.warn).toBe(1);
  });

  it('finds repeat offenders', () => {
    const a = new Analyzer(sampleActions);
    const repeats = a.repeatOffenders(2);
    expect(repeats).toContain('PlayerA');
    expect(repeats).not.toContain('PlayerB');
  });

  it('groups actions by admin', () => {
    const a = new Analyzer(sampleActions);
    const byAdmin = a.byAdmin();
    expect(byAdmin['admin1']).toHaveLength(3);
    expect(byAdmin['admin2']).toHaveLength(2);
  });

  it('filters by time range', () => {
    const a = new Analyzer(sampleActions);
    const filtered = a.filterByTime('2024-08-10 14:30:00', '2024-08-10 15:00:00');
    expect(filtered).toHaveLength(2);
  });

  it('returns player history', () => {
    const a = new Analyzer(sampleActions);
    const history = a.playerHistory('PlayerA');
    expect(history).toHaveLength(3);
    expect(history[0].action).toBe('ban');
  });
});
