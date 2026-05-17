import { Logger } from "../helpers/logger";
import { ServerType } from "../common/serverType";
import { PlayerSessionData } from "../protocols/messageTypes";

export class SessionManager {
  private logger: Logger;
  private sessions: Map<number, PlayerSessionData> = new Map();
  private characterSessions: Map<number, number> = new Map(); // characterId -> sessionId
  private accountSessions: Map<number, number> = new Map(); // accountId -> sessionId
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.logger = new Logger("SessionManager");
    this.startCleanup();
  }

  createSession(
    accountId: number,
    characterId: number,
    username: string,
    characterName: string,
    serverType: ServerType,
    durationSeconds: number = 3600,
  ): number {
    const sessionId = this.generateSessionId();
    const now = Date.now();

    const sessionData: PlayerSessionData = {
      sessionId,
      accountId,
      characterId,
      username,
      characterName,
      serverType,
      createdAt: now,
      expiresAt: now + durationSeconds * 1000,
    };

    this.sessions.set(sessionId, sessionData);
    this.characterSessions.set(characterId, sessionId);
    this.accountSessions.set(accountId, sessionId);

    this.logger.info(
      `Created session ${sessionId} for account ${username} (${accountId}), character ${characterName} (${characterId})`,
    );

    return sessionId;
  }

  getSession(sessionId: number): PlayerSessionData | null {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      this.logger.warn(`Session ${sessionId} has expired`);
      this.destroySession(sessionId);
      return null;
    }

    return session;
  }

  getSessionByCharacter(characterId: number): PlayerSessionData | null {
    const sessionId = this.characterSessions.get(characterId);
    if (!sessionId) {
      return null;
    }
    return this.getSession(sessionId);
  }

  getSessionByAccount(accountId: number): PlayerSessionData | null {
    const sessionId = this.accountSessions.get(accountId);
    if (!sessionId) {
      return null;
    }
    return this.getSession(sessionId);
  }

  validateSession(
    sessionId: number,
    expectedAccountId?: number,
    expectedCharacterId?: number,
  ): boolean {
    const session = this.getSession(sessionId);

    if (!session) {
      return false;
    }

    if (
      expectedAccountId !== undefined &&
      session.accountId !== expectedAccountId
    ) {
      this.logger.warn(`Session ${sessionId} account mismatch`);
      return false;
    }

    if (
      expectedCharacterId !== undefined &&
      session.characterId !== expectedCharacterId
    ) {
      this.logger.warn(`Session ${sessionId} character mismatch`);
      return false;
    }

    return true;
  }

  updateSession(
    sessionId: number,
    updates: Partial<PlayerSessionData>,
  ): boolean {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return false;
    }

    Object.assign(session, updates);
    this.logger.info(`Updated session ${sessionId}`);
    return true;
  }

  extendSession(sessionId: number, additionalSeconds: number): boolean {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return false;
    }

    session.expiresAt = Date.now() + additionalSeconds * 1000;
    this.logger.info(
      `Extended session ${sessionId} by ${additionalSeconds} seconds`,
    );
    return true;
  }

  destroySession(sessionId: number): boolean {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return false;
    }

    this.sessions.delete(sessionId);
    this.characterSessions.delete(session.characterId);
    this.accountSessions.delete(session.accountId);

    this.logger.info(`Destroyed session ${sessionId}`);
    return true;
  }

  destroySessionsByAccount(accountId: number): number {
    const sessionId = this.accountSessions.get(accountId);
    if (!sessionId) {
      return 0;
    }
    return this.destroySession(sessionId) ? 1 : 0;
  }

  destroySessionsByCharacter(characterId: number): number {
    const sessionId = this.characterSessions.get(characterId);
    if (!sessionId) {
      return 0;
    }
    return this.destroySession(sessionId) ? 1 : 0;
  }

  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  getSessionsByServer(serverType: ServerType): PlayerSessionData[] {
    const sessions: PlayerSessionData[] = [];

    for (const session of this.sessions.values()) {
      if (session.serverType === serverType) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  getAllSessions(): PlayerSessionData[] {
    return Array.from(this.sessions.values());
  }

  private startCleanup(): void {
    // Clean up expired sessions every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60000);
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: number[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        expiredSessions.push(sessionId);
      }
    }

    if (expiredSessions.length > 0) {
      this.logger.info(
        `Cleaning up ${expiredSessions.length} expired sessions`,
      );

      for (const sessionId of expiredSessions) {
        this.destroySession(sessionId);
      }
    }
  }

  private generateSessionId(): number {
    // Generate a random session ID
    return Math.floor(Math.random() * 0xffffffff);
  }

  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Destroy all sessions
    const sessionIds = Array.from(this.sessions.keys());
    for (const sessionId of sessionIds) {
      this.destroySession(sessionId);
    }

    this.logger.info("SessionManager stopped");
  }

  getStats(): {
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    sessionsByServer: Record<string, number>;
  } {
    const now = Date.now();
    let activeCount = 0;
    let expiredCount = 0;
    const sessionsByServer: Record<string, number> = {};

    for (const session of this.sessions.values()) {
      if (now > session.expiresAt) {
        expiredCount++;
      } else {
        activeCount++;
      }

      const serverName = ServerType[session.serverType];
      sessionsByServer[serverName] = (sessionsByServer[serverName] || 0) + 1;
    }

    return {
      totalSessions: this.sessions.size,
      activeSessions: activeCount,
      expiredSessions: expiredCount,
      sessionsByServer,
    };
  }
}
