import { describe, it, expect } from 'vitest';
import { parseLogLine, parseLogFile } from '../src/parser';

describe('parser', () => {
  it('parses ban action', () => {
    const line = '[2024-08-10 14:30:22] [txAdmin] admin banned player "TestUser" (reason: cheating)';
    const result = parseLogLine(line);
    expect(result?.action).toBe('ban');
    expect(result?.target).toBe('TestUser');
    expect(result?.reason).toBe('cheating');
  });
  it('parses kick action', () => {
    const line = '[2024-08-10 15:00:01] [txAdmin] admin kicked player "User123"';
    const result = parseLogLine(line);
    expect(result?.action).toBe('kick');
    expect(result?.target).toBe('User123');
  });
  it('parses warn action', () => {
    const line = '[2024-08-10 15:30:00] [txAdmin] admin warned player "SomePlayer" (reason: language)';
    const result = parseLogLine(line);
    expect(result?.action).toBe('warn');
  });
  it('returns null for non-action lines', () => {
    expect(parseLogLine('Server started on port 3000')).toBeNull();
    expect(parseLogLine('')).toBeNull();
  });
  it('parses multiple lines', () => {
    const lines = [
      '[2024-08-10 14:30:22] [txAdmin] admin banned player "A"',
      'some random log line',
      '[2024-08-10 14:31:00] [txAdmin] admin kicked player "B"',
    ].join('\n');
    const results = parseLogFile(lines);
    expect(results).toHaveLength(2);
  });
  it('extracts timestamps', () => {
    const line = '[2024-08-10 14:30:22] [txAdmin] admin banned player "X"';
    const result = parseLogLine(line);
    expect(result?.timestamp).toContain('2024-08-10');
  });
});
