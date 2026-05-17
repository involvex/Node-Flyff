import { EventEmitter } from "events";
import { createConnection, Socket, Server as NetServer } from "net";
import { Logger } from "../helpers/logger";
import { ServerType } from "../common/serverType";

export interface InterServerMessage {
  type: string;
  source: ServerType;
  target: ServerType;
  timestamp: number;
  data: any;
}

export interface ServerConnection {
  serverType: ServerType;
  socket: Socket;
  connected: boolean;
  lastPing: number;
}

export class InterServerClient extends EventEmitter {
  private logger: Logger;
  private connections: Map<ServerType, ServerConnection> = new Map();
  private server: NetServer | null = null;
  private serverType: ServerType;
  private port: number;
  private host: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, (message: InterServerMessage) => void> =
    new Map();

  constructor(serverType: ServerType, host: string, port: number) {
    super();
    this.logger = new Logger(`InterServer-${ServerType[serverType]}`);
    this.serverType = serverType;
    this.host = host;
    this.port = port;
  }

  async start(): Promise<void> {
    this.logger.info(
      `Starting inter-server communication on ${this.host}:${this.port}`,
    );

    // Start listening for incoming connections
    this.server = new NetServer();
    this.server.on("connection", (socket) =>
      this.handleIncomingConnection(socket),
    );
    this.server.listen(this.port, this.host, () => {
      this.logger.success(
        `Inter-server server listening on ${this.host}:${this.port}`,
      );
    });

    // Start heartbeat
    this.startHeartbeat();
  }

  async connectToServer(
    targetServer: ServerType,
    targetHost: string,
    targetPort: number,
  ): Promise<void> {
    if (this.connections.has(targetServer)) {
      this.logger.warn(`Already connected to ${ServerType[targetServer]}`);
      return;
    }

    this.logger.info(
      `Connecting to ${ServerType[targetServer]} at ${targetHost}:${targetPort}`,
    );

    return new Promise((resolve, reject) => {
      const socket = createConnection(
        { host: targetHost, port: targetPort },
        () => {
          this.logger.success(`Connected to ${ServerType[targetServer]}`);

          const connection: ServerConnection = {
            serverType: targetServer,
            socket,
            connected: true,
            lastPing: Date.now(),
          };

          this.connections.set(targetServer, connection);
          this.setupSocketHandlers(socket, targetServer);
          this.emit("connected", targetServer);
          resolve();
        },
      );

      socket.on("error", (error) => {
        this.logger.error(
          `Failed to connect to ${ServerType[targetServer]}:`,
          error,
        );
        reject(error);
      });
    });
  }

  private handleIncomingConnection(socket: Socket): void {
    const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    this.logger.info(`Incoming connection from ${remoteAddress}`);

    socket.on("data", (data) => this.handleMessage(data, socket));
    socket.on("error", (error) => {
      this.logger.error(`Connection error from ${remoteAddress}:`, error);
    });
    socket.on("close", () => {
      this.logger.info(`Connection closed from ${remoteAddress}`);
    });
  }

  private setupSocketHandlers(socket: Socket, serverType: ServerType): void {
    socket.on("data", (data) => this.handleMessage(data, socket));

    socket.on("error", (error) => {
      this.logger.error(`Error with ${ServerType[serverType]}:`, error);
      this.handleDisconnection(serverType);
    });

    socket.on("close", () => {
      this.logger.warn(`Connection to ${ServerType[serverType]} closed`);
      this.handleDisconnection(serverType);
    });

    socket.on("end", () => {
      this.logger.info(`${ServerType[serverType]} ended connection`);
      this.handleDisconnection(serverType);
    });
  }

  private handleMessage(data: Buffer, socket: Socket): void {
    try {
      const message = this.deserializeMessage(data);

      // Update last ping for the connection
      for (const [_serverType, conn] of this.connections.entries()) {
        if (conn.socket === socket) {
          conn.lastPing = Date.now();
          break;
        }
      }

      // Handle the message
      this.handleIncomingMessage(message);
    } catch (error) {
      this.logger.error("Error handling message:", error);
    }
  }

  private handleIncomingMessage(message: InterServerMessage): void {
    this.logger.info(
      `Received message from ${ServerType[message.source]}: ${message.type}`,
    );

    // Emit to event listeners
    this.emit("message", message);

    // Call specific handler if registered
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      try {
        handler(message);
      } catch (error) {
        this.logger.error(
          `Error in message handler for ${message.type}:`,
          error,
        );
      }
    }
  }

  private handleDisconnection(serverType: ServerType): void {
    const connection = this.connections.get(serverType);
    if (connection) {
      connection.connected = false;
      this.connections.delete(serverType);
      this.emit("disconnected", serverType);

      // Attempt reconnection after delay
      setTimeout(() => {
        this.logger.info(
          `Attempting to reconnect to ${ServerType[serverType]}...`,
        );
        // Reconnection logic would go here
      }, 5000);
    }
  }

  async sendMessage(
    targetServer: ServerType,
    messageType: string,
    data: any = {},
  ): Promise<boolean> {
    const connection = this.connections.get(targetServer);

    if (!connection || !connection.connected) {
      this.logger.warn(`Not connected to ${ServerType[targetServer]}`);
      return false;
    }

    try {
      const message: InterServerMessage = {
        type: messageType,
        source: this.serverType,
        target: targetServer,
        timestamp: Date.now(),
        data,
      };

      const serialized = this.serializeMessage(message);
      connection.socket.write(serialized);

      this.logger.info(`Sent ${messageType} to ${ServerType[targetServer]}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send message to ${ServerType[targetServer]}:`,
        error,
      );
      return false;
    }
  }

  broadcast(messageType: string, data: any = {}): void {
    for (const [serverType, connection] of this.connections.entries()) {
      if (connection.connected) {
        this.sendMessage(serverType, messageType, data);
      }
    }
  }

  onMessage(
    messageType: string,
    handler: (message: InterServerMessage) => void,
  ): void {
    this.messageHandlers.set(messageType, handler);
  }

  private serializeMessage(message: InterServerMessage): Buffer {
    const json = JSON.stringify(message);
    const length = Buffer.byteLength(json);
    const buffer = Buffer.allocUnsafe(4 + length);

    buffer.writeUInt32LE(length, 0);
    buffer.write(json, 4);

    return buffer;
  }

  private deserializeMessage(buffer: Buffer): InterServerMessage {
    if (buffer.length < 4) {
      throw new Error("Invalid message: too short");
    }

    const length = buffer.readUInt32LE(0);
    if (buffer.length < 4 + length) {
      throw new Error("Invalid message: incomplete data");
    }

    const json = buffer.toString("utf-8", 4, 4 + length);
    return JSON.parse(json);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();

      for (const [serverType, connection] of this.connections.entries()) {
        if (connection.connected) {
          // Check if connection is stale (no ping for 30 seconds)
          if (now - connection.lastPing > 30000) {
            this.logger.warn(
              `Connection to ${ServerType[serverType]} appears stale`,
            );
            this.handleDisconnection(serverType);
          } else {
            // Send heartbeat
            this.sendMessage(serverType, "heartbeat", { timestamp: now });
          }
        }
      }
    }, 10000); // Check every 10 seconds
  }

  stop(): void {
    this.logger.info("Stopping inter-server communication");

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close all connections
    for (const [serverType, connection] of this.connections.entries()) {
      connection.socket.destroy();
      this.connections.delete(serverType);
    }

    // Close server
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  isConnected(targetServer: ServerType): boolean {
    const connection = this.connections.get(targetServer);
    return connection ? connection.connected : false;
  }

  getConnectedServers(): ServerType[] {
    const connected: ServerType[] = [];
    for (const [serverType, connection] of this.connections.entries()) {
      if (connection.connected) {
        connected.push(serverType);
      }
    }
    return connected;
  }
}
