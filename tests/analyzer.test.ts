import { describe, it, expect } from 'vitest';
import { BanAnalyzer } from '../src/analyzers/bans';
import { SessionAnalyzer } from '../src/analyzers/sessions';
import type { PlayerEvent } from '../src/parser/types';

describe('BanAnalyzer', () => {
  const events: PlayerEvent[] = [
    { timestamp: new Date('2024-08-10T14:30:22'), playerName: 'PlayerA', playerId: '1', identifiers: [], action: 'player.ban', adminName: 'admin1', reason: 'cheating' },
    { timestamp: new Date('2024-08-10T14:35:00'), playerName: 'PlayerB', playerId: '2', identifiers: [], action: 'player.kick', adminName: 'admin1' },
    { timestamp: new Date('2024-08-10T15:00:00'), playerName: 'PlayerC', playerId: '3', identifiers: [], action: 'player.ban', adminName: 'admin2', reason: 'exploit' },
    { timestamp: new Date('2024-08-10T15:30:00'), playerName: 'PlayerA', playerId: '1', identifiers: [], action: 'player.warn', adminName: 'admin1', reason: 'language' },
    { timestamp: new Date('2024-08-10T16:00:00'), playerName: 'PlayerA', playerId: '1', identifiers: [], action: 'player.kick', adminName: 'admin2' },
  ];

  it('extracts bans', () => {
    const analyzer = new BanAnalyzer();
    const result = analyzer.analyze(events);
    expect(result.bans).toHaveLength(2);
    expect(result.bans[0].playerName).toBe('PlayerA');
    expect(result.bans[1].playerName).toBe('PlayerC');
  });

  it('extracts kicks', () => {
    const analyzer = new BanAnalyzer();
    const result = analyzer.analyze(events);
    expect(result.kicks).toHaveLength(2);
  });

  it('extracts warnings', () => {
    const analyzer = new BanAnalyzer();
    const result = analyzer.analyze(events);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].playerName).toBe('PlayerA');
  });

  it('finds repeat offenders', () => {
    const analyzer = new BanAnalyzer();
    const result = analyzer.analyze(events);
    const offenderNames = result.repeatOffenders.map(o => o.name);
    expect(offenderNames).toContain('PlayerA');
    expect(offenderNames).not.toContain('PlayerC');
  });
});

describe('SessionAnalyzer', () => {
  const events: PlayerEvent[] = [
    { timestamp: new Date('2024-08-10T14:00:00'), playerName: 'Alice', playerId: '1', identifiers: ['steam:abc'], action: 'player.join', ip: '1.2.3.4' },
    { timestamp: new Date('2024-08-10T14:30:00'), playerName: 'Bob', playerId: '2', identifiers: ['steam:def'], action: 'player.join', ip: '5.6.7.8' },
    { timestamp: new Date('2024-08-10T15:00:00'), playerName: 'Alice', playerId: '1', identifiers: [], action: 'player.leave', reason: 'quit' },
    { timestamp: new Date('2024-08-10T16:00:00'), playerName: 'Bob', playerId: '2', identifiers: [], action: 'player.leave', reason: 'timeout' },
  ];

  it('builds sessions from join/leave events', () => {
    const analyzer = new SessionAnalyzer();
    const result = analyzer.analyze(events);
    expect(result.sessions).toHaveLength(2);
  });

  it('calculates session durations', () => {
    const analyzer = new SessionAnalyzer();
    const result = analyzer.analyze(events);
    const aliceSession = result.sessions.find(s => s.playerName === 'Alice');
    expect(aliceSession).toBeDefined();
    expect(aliceSession!.durationMs).toBe(3600000); // 1 hour
  });

  it('produces player summaries sorted by total time', () => {
    const analyzer = new SessionAnalyzer();
    const result = analyzer.analyze(events);
    expect(result.summaries).toHaveLength(2);
    // Bob has 1.5h, Alice has 1h => Bob first
    expect(result.summaries[0].playerName).toBe('Bob');
  });

  it('produces 24 hourly buckets', () => {
    const analyzer = new SessionAnalyzer();
    const result = analyzer.analyze(events);
    expect(result.hourly).toHaveLength(24);
  });

  it('tracks peak concurrent players', () => {
    const analyzer = new SessionAnalyzer();
    const result = analyzer.analyze(events);
    expect(result.peakConcurrent).toBe(2);
  });
});
