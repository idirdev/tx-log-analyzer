/**
 * Regex patterns for parsing txAdmin log formats.
 * Supports txAdmin v6.x and v7.x log structures.
 */

// Main log line: [2024-01-15 14:32:01] [info] message
export const LOG_LINE =
  /^\[(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})\]\s*\[(\w+)\]\s*(.+)$/;

// Player join: [txAdmin] Player "Name" connected (id: 42, identifiers: license:abc, steam:def)
export const PLAYER_JOIN =
  /Player\s+"([^"]+)"\s+connected\s*\(id:\s*(\d+),\s*identifiers?:\s*(.+)\)/i;

// Player leave: [txAdmin] Player "Name" disconnected (id: 42, reason: quit)
export const PLAYER_LEAVE =
  /Player\s+"([^"]+)"\s+disconnected\s*\(id:\s*(\d+)(?:,\s*reason:\s*(.+))?\)/i;

// Player kick: [txAdmin] "AdminName" kicked "PlayerName" (reason: breaking rules)
export const PLAYER_KICK =
  /"([^"]+)"\s+kicked\s+"([^"]+)"(?:\s*\(reason:\s*(.+)\))?/i;

// Player ban: [txAdmin] "AdminName" banned "PlayerName" (reason: cheating, duration: permanent)
export const PLAYER_BAN =
  /"([^"]+)"\s+banned\s+"([^"]+)"(?:\s*\(reason:\s*([^,)]+)(?:,\s*duration:\s*([^)]+))?\))?/i;

// Player warn: [txAdmin] "AdminName" warned "PlayerName" (reason: language)
export const PLAYER_WARN =
  /"([^"]+)"\s+warned\s+"([^"]+)"(?:\s*\(reason:\s*(.+)\))?/i;

// Server start: Server started successfully
export const SERVER_START = /Server\s+start(?:ed|ing)/i;

// Server stop/shutdown
export const SERVER_STOP = /Server\s+(?:stopped|shutting\s+down|shutdown)/i;

// Server crash detection
export const SERVER_CRASH =
  /(?:server\s+crash|unhandled\s+exception|fatal\s+error|SIGKILL|SIGTERM|out\s+of\s+memory)/i;

// Resource start: [script:resourceName] Started resource
export const RESOURCE_ACTION =
  /\[script:([^\]]+)\]\s+(Started|Stopped|Error|Restarting)\s*(?:resource)?/i;

// Resource error with details
export const RESOURCE_ERROR =
  /\[script:([^\]]+)\]\s+(?:SCRIPT ERROR|Error|Exception):\s*(.+)/i;

// Chat message: [chat] PlayerName: message
export const CHAT_MESSAGE = /\[chat\]\s+([^:]+):\s+(.+)/i;

// IP address extraction
export const IP_ADDRESS = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/;

// Identifier patterns
export const IDENTIFIER =
  /(license|steam|discord|xbl|live|fivem|license2):[a-f0-9]+/gi;

// txAdmin action: [txAdmin] Admin action performed
export const TXADMIN_ACTION = /\[txAdmin\]\s+(.+)/i;

// Timestamp formats
export const ISO_TIMESTAMP = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
export const SIMPLE_TIMESTAMP = /\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/;

// Duration parsing: "2h", "30m", "7d", "permanent"
export const DURATION = /^(\d+)([smhdw])$/i;
export const PERMANENT = /^perm(?:anent)?$/i;
