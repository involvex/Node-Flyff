# Node-Flyff Web Client (Demo)

This is a small React + Vite demo scaffold to prototype a browser-based Flyff client UI.

Quick start:

1. cd web-client
2. npm install
3. npm run dev

Open http://localhost:5173

Notes:

- The client expects a WebSocket proxy at `ws://localhost:8080` that forwards to the game TCP server.
- `src/net/flyffPacket.ts` contains minimal helpers for demo CERTIFY/WELCOME framing.
