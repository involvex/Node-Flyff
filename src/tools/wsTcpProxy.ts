import { WebSocketServer } from "ws";
import { createConnection } from "net";

// Usage: bun run src/tools/wsTcpProxy.ts [listenPort] [targetHost] [targetPort]
const args = process.argv.slice(2);
const listenPort = parseInt(args[0] || process.env.WS_PROXY_PORT || "8080", 10);
const targetHost = args[1] || process.env.WS_PROXY_TARGET_HOST || "127.0.0.1";
const targetPort = parseInt(args[2] || process.env.WS_PROXY_TARGET_PORT || "23000", 10);

console.log(`Starting WebSocket->TCP proxy: ws://0.0.0.0:${listenPort} -> ${targetHost}:${targetPort}`);

const wss = new WebSocketServer({ port: listenPort } as any);

wss.on("connection", (ws: any) => {
  console.log("WS client connected, opening TCP connection to target...");
  const tcp = createConnection({ host: targetHost, port: targetPort }, () => {
    console.log("TCP connected to target");
  });

  ws.on("message", (data: Buffer) => {
    // Forward binary/Buffer payloads to TCP
    try {
      if (Buffer.isBuffer(data)) {
        tcp.write(data);
      } else if (typeof data === "string") {
        tcp.write(Buffer.from(data, "utf8"));
      }
    } catch (err) {
      console.error("Error forwarding WS->TCP:", err);
    }
  });

  tcp.on("data", (chunk: Buffer) => {
    try {
      ws.send(chunk);
    } catch (err) {
      console.error("Error forwarding TCP->WS:", err);
    }
  });

  const cleanup = () => {
    try { tcp.end(); } catch {};
    try { ws.close(); } catch {};
  };

  ws.on("close", () => {
    console.log("WS client disconnected");
    cleanup();
  });
  ws.on("error", (err: any) => {
    console.error("WS error:", err);
    cleanup();
  });

  tcp.on("close", () => {
    console.log("TCP connection closed");
    cleanup();
  });
  tcp.on("error", (err: any) => {
    console.error("TCP error:", err);
    cleanup();
  });
});

wss.on("listening", () => console.log("WS->TCP proxy listening on port", listenPort));

export {};
