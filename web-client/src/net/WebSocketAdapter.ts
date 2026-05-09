export default class WebSocketAdapter {
  ws: WebSocket | null = null;
  url: string;
  onMessage: ((data: ArrayBuffer) => void) | null = null;

  constructor(url = "ws://localhost:8080") {
    this.url = url;
  }

  connect() {
    this.ws = new WebSocket(this.url);
    this.ws.binaryType = "arraybuffer";
    this.ws.onopen = () => console.log("WS connected");
    this.ws.onmessage = (ev) => {
      if (this.onMessage && ev.data instanceof ArrayBuffer) {
        this.onMessage(ev.data);
      }
    };
    this.ws.onclose = () => console.log("WS closed");
    this.ws.onerror = (e) => console.error("WS error", e);
  }

  send(buffer: ArrayBuffer) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(buffer);
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}
