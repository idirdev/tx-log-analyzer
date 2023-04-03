import { describe, it, expect } from 'vitest';
import { byAction, byPlayer, byDateRange, and, or, not, applyFilters } from '../src/filters';

describe('filters', () => {
  const actions = [
    { action: 'ban', target: 'Alice', admin: 'mod1', timestamp: '2024-08-10 14:00:00', reason: 'cheat' },
    { action: 'kick', target: 'Bob', admin: 'mod2', timestamp: '2024-08-10 15:00:00' },
    { action: 'warn', target: 'Alice', admin: 'mod1', timestamp: '2024-08-10 16:00:00', reason: 'lang' },
  ];

  it('filters by action type', () => {
    expect(applyFilters(actions, byAction('ban'))).toHaveLength(1);
  });
  it('filters by player name', () => {
    expect(applyFilters(actions, byPlayer('alice'))).toHaveLength(2);
  });
  it('filters by date range', () => {
    expect(applyFilters(actions, byDateRange('2024-08-10 14:00:00', '2024-08-10 15:00:00'))).toHaveLength(2);
  });
  it('combines with and', () => {
    const f = and(byAction('ban', 'warn'), byPlayer('alice'));
    expect(applyFilters(actions, f)).toHaveLength(2);
  });
  it('combines with or', () => {
    const f = or(byAction('ban'), byPlayer('bob'));
    expect(applyFilters(actions, f)).toHaveLength(2);
  });
  it('negates with not', () => {
    expect(applyFilters(actions, not(byAction('ban')))).toHaveLength(2);
  });
});
