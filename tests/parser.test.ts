import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LogParser } from '../src/parser/log-parser';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('LogParser', () => {
  let parser: LogParser;
  const tmpDir = tmpdir();
  const tmpFile = join(tmpDir, 'test-log.txt');

  beforeEach(() => {
    parser = new LogParser();
  });

  afterEach(() => {
    try { unlinkSync(tmpFile); } catch {}
  });

  it('parses a log file with ban action', () => {
    const content = '[2024-08-10 14:30:22] [info] [txAdmin] "admin1" banned "TestUser" (reason: cheating)';
    writeFileSync(tmpFile, content, 'utf-8');
    const result = parser.parse(tmpFile);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].action).toBe('player.ban');
    expect(result.entries[0].message).toContain('TestUser');
  });

  it('parses a log file with kick action', () => {
    const content = '[2024-08-10 15:00:01] [info] [txAdmin] "admin1" kicked "User123" (reason: breaking rules)';
    writeFileSync(tmpFile, content, 'utf-8');
    const result = parser.parse(tmpFile);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].action).toBe('player.kick');
  });

  it('parses a log file with warn action', () => {
    const content = '[2024-08-10 15:30:00] [info] [txAdmin] "admin1" warned "SomePlayer" (reason: language)';
    writeFileSync(tmpFile, content, 'utf-8');
    const result = parser.parse(tmpFile);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].action).toBe('player.warn');
  });

  it('skips lines that do not match log format', () => {
    const content = [
      '[2024-08-10 14:30:22] [info] [txAdmin] "admin1" banned "A" (reason: x)',
      'some random log line without proper format',
      '[2024-08-10 14:31:00] [info] [txAdmin] "admin1" kicked "B" (reason: y)',
    ].join('\n');
    writeFileSync(tmpFile, content, 'utf-8');
    const result = parser.parse(tmpFile);
    expect(result.entries).toHaveLength(2);
    expect(result.parseErrors).toBe(1);
  });

  it('extracts timestamps', () => {
    const content = '[2024-08-10 14:30:22] [info] [txAdmin] "admin1" banned "X" (reason: y)';
    writeFileSync(tmpFile, content, 'utf-8');
    const result = parser.parse(tmpFile);
    expect(result.entries[0].timestamp.getFullYear()).toBe(2024);
    expect(result.entries[0].timestamp.getMonth()).toBe(7); // August is month 7 (0-indexed)
    expect(result.entries[0].timestamp.getDate()).toBe(10);
  });

  it('provides time range in parse result', () => {
    const content = [
      '[2024-08-10 14:00:00] [info] Server started',
      '[2024-08-10 16:00:00] [info] Server stopped',
    ].join('\n');
    writeFileSync(tmpFile, content, 'utf-8');
    const result = parser.parse(tmpFile);
    expect(result.timeRange.start.getTime()).toBeLessThan(result.timeRange.end.getTime());
  });

  it('reports file path and size', () => {
    const content = '[2024-08-10 14:00:00] [info] Server started';
    writeFileSync(tmpFile, content, 'utf-8');
    const result = parser.parse(tmpFile);
    expect(result.filePath).toBe(tmpFile);
    expect(result.fileSize).toBeGreaterThan(0);
  });

  it('extracts player events from parsed entries', () => {
    const content = [
      '[2024-08-10 14:00:00] [info] Player "Alice" connected (id: 1, identifiers: steam:abc)',
      '[2024-08-10 15:00:00] [info] Player "Alice" disconnected (id: 1, reason: quit)',
    ].join('\n');
    writeFileSync(tmpFile, content, 'utf-8');
    parser.parse(tmpFile);
    const playerEvents = parser.extractPlayerEvents();
    expect(playerEvents).toHaveLength(2);
    expect(playerEvents[0].playerName).toBe('Alice');
    expect(playerEvents[0].action).toBe('player.join');
    expect(playerEvents[1].action).toBe('player.leave');
  });
});
