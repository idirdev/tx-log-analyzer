import { describe, it, expect } from 'vitest';
import { exportToJson } from '../src/exporters/json';
import { exportToCsv } from '../src/exporters/csv';

describe('exporters', () => {
  const actions = [
    { action: 'ban', target: 'Alice', admin: 'mod1', timestamp: '2024-08-10 14:00:00', reason: 'cheat' },
    { action: 'kick', target: 'Bob', admin: 'mod2', timestamp: '2024-08-10 15:00:00' },
  ];

  describe('JSON', () => {
    it('exports valid JSON', () => {
      const result = exportToJson(actions);
      const parsed = JSON.parse(result);
      expect(parsed.actions).toHaveLength(2);
      expect(parsed.summary.total).toBe(2);
    });
    it('includes metadata when requested', () => {
      const result = JSON.parse(exportToJson(actions, { includeMetadata: true }));
      expect(result.metadata.exportedAt).toBeDefined();
    });
    it('pretty prints', () => {
      const result = exportToJson(actions, { pretty: true });
      expect(result).toContain('\n');
    });
  });

  describe('CSV', () => {
    it('exports with header', () => {
      const result = exportToCsv(actions);
      const lines = result.split('\n');
      expect(lines[0]).toContain('timestamp');
      expect(lines).toHaveLength(3);
    });
    it('exports without header', () => {
      const result = exportToCsv(actions, { includeHeader: false });
      expect(result.split('\n')).toHaveLength(2);
    });
    it('escapes fields with commas', () => {
      const data = [{ ...actions[0], reason: 'cheat, exploit' }];
      const result = exportToCsv(data);
      expect(result).toContain('"cheat, exploit"');
    });
  });
});
