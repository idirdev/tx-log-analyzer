import { describe, it, expect } from 'vitest';
import {
  LOG_LINE,
  PLAYER_JOIN,
  PLAYER_LEAVE,
  PLAYER_KICK,
  PLAYER_BAN,
  PLAYER_WARN,
  SERVER_START,
  SERVER_STOP,
  SERVER_CRASH,
  RESOURCE_ACTION,
  RESOURCE_ERROR,
  CHAT_MESSAGE,
  IP_ADDRESS,
  IDENTIFIER,
  TXADMIN_ACTION,
  DURATION,
  PERMANENT,
} from '../src/parser/patterns';

describe('patterns', () => {
  describe('LOG_LINE', () => {
    it('matches a standard log line', () => {
      expect(LOG_LINE.test('[2024-08-10 14:30:22] [info] Some message here')).toBe(true);
    });

    it('captures timestamp, level, and message', () => {
      const match = '[2024-08-10 14:30:22] [info] Some message here'.match(LOG_LINE);
      expect(match).not.toBeNull();
      expect(match![1]).toBe('2024-08-10 14:30:22');
      expect(match![2]).toBe('info');
      expect(match![3]).toBe('Some message here');
    });

    it('does not match invalid lines', () => {
      expect(LOG_LINE.test('random text without timestamp')).toBe(false);
    });
  });

  describe('PLAYER_BAN', () => {
    it('matches a ban message', () => {
      expect(PLAYER_BAN.test('"admin1" banned "TestUser" (reason: cheating)')).toBe(true);
    });

    it('captures admin, player, and reason', () => {
      const match = '"admin1" banned "TestUser" (reason: cheating)'.match(PLAYER_BAN);
      expect(match).not.toBeNull();
      expect(match![1]).toBe('admin1');
      expect(match![2]).toBe('TestUser');
      expect(match![3]).toBe('cheating');
    });

    it('does not match non-ban text', () => {
      expect(PLAYER_BAN.test('random text')).toBe(false);
    });
  });

  describe('PLAYER_KICK', () => {
    it('matches a kick message', () => {
      expect(PLAYER_KICK.test('"admin1" kicked "TestUser" (reason: breaking rules)')).toBe(true);
    });

    it('captures admin and player', () => {
      const match = '"admin1" kicked "TestUser"'.match(PLAYER_KICK);
      expect(match).not.toBeNull();
      expect(match![1]).toBe('admin1');
      expect(match![2]).toBe('TestUser');
    });
  });

  describe('PLAYER_WARN', () => {
    it('matches a warn message', () => {
      expect(PLAYER_WARN.test('"admin1" warned "SomePlayer" (reason: language)')).toBe(true);
    });
  });

  describe('PLAYER_JOIN', () => {
    it('matches a player join message', () => {
      expect(PLAYER_JOIN.test('Player "Alice" connected (id: 42, identifiers: steam:abc)')).toBe(true);
    });

    it('captures player name and id', () => {
      const match = 'Player "Alice" connected (id: 42, identifiers: steam:abc)'.match(PLAYER_JOIN);
      expect(match).not.toBeNull();
      expect(match![1]).toBe('Alice');
      expect(match![2]).toBe('42');
    });
  });

  describe('PLAYER_LEAVE', () => {
    it('matches a player leave message', () => {
      expect(PLAYER_LEAVE.test('Player "Alice" disconnected (id: 42, reason: quit)')).toBe(true);
    });
  });

  describe('SERVER_START', () => {
    it('matches server start messages', () => {
      expect(SERVER_START.test('Server started')).toBe(true);
      expect(SERVER_START.test('Server starting')).toBe(true);
    });
  });

  describe('SERVER_STOP', () => {
    it('matches server stop messages', () => {
      expect(SERVER_STOP.test('Server stopped')).toBe(true);
      expect(SERVER_STOP.test('Server shutting down')).toBe(true);
    });
  });

  describe('SERVER_CRASH', () => {
    it('matches crash-related messages', () => {
      expect(SERVER_CRASH.test('server crash detected')).toBe(true);
      expect(SERVER_CRASH.test('unhandled exception occurred')).toBe(true);
      expect(SERVER_CRASH.test('fatal error in module')).toBe(true);
      expect(SERVER_CRASH.test('out of memory')).toBe(true);
    });
  });

  describe('RESOURCE_ACTION', () => {
    it('matches resource start/stop messages', () => {
      expect(RESOURCE_ACTION.test('[script:myResource] Started resource')).toBe(true);
      expect(RESOURCE_ACTION.test('[script:myResource] Stopped resource')).toBe(true);
    });
  });

  describe('RESOURCE_ERROR', () => {
    it('matches resource error messages', () => {
      expect(RESOURCE_ERROR.test('[script:myResource] SCRIPT ERROR: something went wrong')).toBe(true);
    });
  });

  describe('IP_ADDRESS', () => {
    it('matches IP addresses', () => {
      const match = 'connected from 192.168.1.1 on port 30120'.match(IP_ADDRESS);
      expect(match).not.toBeNull();
      expect(match![1]).toBe('192.168.1.1');
    });
  });

  describe('DURATION', () => {
    it('matches duration strings', () => {
      expect(DURATION.test('7d')).toBe(true);
      expect(DURATION.test('24h')).toBe(true);
      expect(DURATION.test('30m')).toBe(true);
    });

    it('does not match permanent', () => {
      expect(DURATION.test('permanent')).toBe(false);
    });
  });

  describe('PERMANENT', () => {
    it('matches permanent strings', () => {
      expect(PERMANENT.test('permanent')).toBe(true);
      expect(PERMANENT.test('perm')).toBe(true);
    });
  });
});
