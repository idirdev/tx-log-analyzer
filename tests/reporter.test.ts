import { describe, it, expect } from 'vitest';
import { ConsoleReporter } from '../src/reporter';

describe('ConsoleReporter', () => {
  const actions = [
    { action: 'ban', target: 'Alice', admin: 'mod1', timestamp: '2024-08-10 14:00:00', reason: 'cheat' },
    { action: 'kick', target: 'Bob', admin: 'mod2', timestamp: '2024-08-10 15:00:00' },
  ];

  it('generates summary', () => {
    const reporter = new ConsoleReporter(actions);
    const summary = reporter.summary();
    expect(summary).toContain('2');
    expect(summary).toContain('ban');
  });
  it('generates player report', () => {
    const reporter = new ConsoleReporter(actions);
    const report = reporter.playerReport('Alice');
    expect(report).toContain('Alice');
    expect(report).toContain('ban');
  });
  it('generates admin report', () => {
    const reporter = new ConsoleReporter(actions);
    const report = reporter.adminReport();
    expect(report).toContain('mod1');
    expect(report).toContain('mod2');
  });
  it('handles empty data', () => {
    const reporter = new ConsoleReporter([]);
    expect(reporter.summary()).toContain('0');
  });
});
