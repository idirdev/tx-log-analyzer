import { describe, it, expect } from 'vitest';
import { PATTERNS, matchPattern } from '../src/patterns';

describe('patterns', () => {
  it('has ban pattern', () => {
    expect(PATTERNS.ban).toBeDefined();
  });
  it('has kick pattern', () => {
    expect(PATTERNS.kick).toBeDefined();
  });
  it('has warn pattern', () => {
    expect(PATTERNS.warn).toBeDefined();
  });
  it('matches ban pattern', () => {
    const match = matchPattern('admin banned player "Test" (reason: hack)', 'ban');
    expect(match).not.toBeNull();
    expect(match?.player).toBe('Test');
  });
  it('matches kick pattern', () => {
    const match = matchPattern('admin kicked player "Test"', 'kick');
    expect(match?.player).toBe('Test');
  });
  it('returns null for no match', () => {
    expect(matchPattern('random text', 'ban')).toBeNull();
  });
  it('handles special characters in names', () => {
    const match = matchPattern('admin banned player "Test [TAG]" (reason: x)', 'ban');
    expect(match?.player).toContain('Test');
  });
});
