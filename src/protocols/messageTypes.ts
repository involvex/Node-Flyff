import { ServerType } from "../common/serverType";

export enum MessageType {
  // Connection management
  HEARTBEAT = "heartbeat",
  SERVER_ONLINE = "server_online",
  SERVER_OFFLINE = "server_offline",

  // Cluster ↔ World communication
  CHANNEL_ADD = "channel_add",
  CHANNEL_REMOVE = "channel_remove",
  CHANNEL_UPDATE = "channel_update",
  CHANNEL_LIST = "channel_list",
  PLAYER_JOIN_WORLD = "player_join_world",
  PLAYER_LEAVE_WORLD = "player_leave_world",

  // Login ↔ Cluster communication
  PLAYER_LOGIN = "player_login",
  PLAYER_LOGOUT = "player_logout",
  CHARACTER_CREATE = "character_create",
  CHARACTER_DELETE = "character_delete",
  CHARACTER_SELECT = "character_select",

  // Session management
  SESSION_CREATE = "session_create",
  SESSION_VALIDATE = "session_validate",
  SESSION_DESTROY = "session_destroy",

  // Data synchronization
  PLAYER_DATA_SYNC = "player_data_sync",
  INVENTORY_SYNC = "inventory_sync",
  GUILD_DATA_SYNC = "guild_data_sync",

  // Chat and messaging
  BROADCAST_MESSAGE = "broadcast_message",
  WHISPER_MESSAGE = "whisper_message",
  GUILD_MESSAGE = "guild_message",
  PARTY_MESSAGE = "party_message",

  // Game events
  PLAYER_DEATH = "player_death",
  PLAYER_RESPAWN = "player_respawn",
  MONSTER_KILL = "monster_kill",
  ITEM_DROP = "item_drop",
  ITEM_PICKUP = "item_pickup",

  // Trading
  TRADE_REQUEST = "trade_request",
  TRADE_ACCEPT = "trade_accept",
  TRADE_CANCEL = "trade_cancel",
  TRADE_COMPLETE = "trade_complete",

  // Party system
  PARTY_CREATE = "party_create",
  PARTY_INVITE = "party_invite",
  PARTY_LEAVE = "party_leave",
  PARTY_DISBAND = "party_disband",

  // Guild system
  GUILD_CREATE = "guild_create",
  GUILD_INVITE = "guild_invite",
  GUILD_LEAVE = "guild_leave",
  GUILD_KICK = "guild_kick",
  GUILD_DISBAND = "guild_disband",

  // Admin commands
  ADMIN_COMMAND = "admin_command",
  SERVER_SHUTDOWN = "server_shutdown",
  SERVER_RESTART = "server_restart",

  // Statistics and monitoring
  PLAYER_COUNT_UPDATE = "player_count_update",
  SERVER_STATS = "server_stats",
  ERROR_REPORT = "error_report",
}

export interface ChannelInfo {
  id: number;
  name: string;
  host: string;
  port: number;
  currentUsers: number;
  maxUsers: number;
  enabled: boolean;
  pkEnabled: boolean;
}

export interface PlayerSessionData {
  sessionId: number;
  accountId: number;
  characterId: number;
  username: string;
  characterName: string;
  serverType: ServerType;
  createdAt: number;
  expiresAt: number;
}

export interface PlayerDataSync {
  characterId: number;
  position: { x: number; y: number; z: number };
  health: { hp: number; maxHp: number; mp: number; maxMp: number };
  level: number;
  experience: number;
  gold: number;
  lastUpdate: number;
}

export interface ServerStats {
  serverType: ServerType;
  uptime: number;
  playerCount: number;
  memoryUsage: number;
  cpuUsage: number;
  lastUpdate: number;
}
