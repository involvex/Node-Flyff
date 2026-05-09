// Minimal Flyff packet helpers for the web client demo.
// This is intentionally tiny: extend with full framing/fields as needed.

export function encodeCertify(account: string, password: string) {
  const enc = new TextEncoder();
  const a = enc.encode(account);
  const p = enc.encode(password);
  const buf = new ArrayBuffer(4 + a.length + 1 + p.length);
  const dv = new DataView(buf);
  // length (uint16) + type (uint8) + payload... (very small demo framing)
  dv.setUint16(0, a.length + 1 + p.length + 1, true);
  dv.setUint8(2, 1); // type 1 = CERTIFY (demo)
  let offset = 3;
  new Uint8Array(buf, offset, a.length).set(a);
  offset += a.length;
  dv.setUint8(offset++, 0);
  new Uint8Array(buf, offset, p.length).set(p);
  offset += p.length;
  dv.setUint8(offset++, 0);
  return buf;
}

export function parseWelcome(buffer: ArrayBuffer) {
  // very tiny parse: expect type 2 and session id uint32
  const dv = new DataView(buffer);
  const type = dv.getUint8(2);
  if (type !== 2) return null;
  const session = dv.getUint32(3, true);
  return { type: "WELCOME", session };
}

export function parseServerList(buffer: ArrayBuffer) {
  // Demo parse: expect type 3 and a null-terminated list of server names separated by '|'
  const dv = new DataView(buffer);
  const type = dv.getUint8(2);
  if (type !== 3) return null;
  // payload starts at offset 3
  const bytes = new Uint8Array(buffer, 3);
  const text = new TextDecoder().decode(bytes);
  // Trim any trailing nulls
  const trimmed = text.replace(/\0+$/, "");
  const servers = trimmed.length ? trimmed.split("|") : [];
  return { type: "SERVER_LIST", servers };
}

export function encodeSelectServer(name: string) {
  const enc = new TextEncoder();
  const n = enc.encode(name);
  const buf = new ArrayBuffer(4 + n.length + 1);
  const dv = new DataView(buf);
  dv.setUint16(0, n.length + 1 + 1, true);
  dv.setUint8(2, 4); // type 4 = SELECT_SERVER (demo)
  let offset = 3;
  new Uint8Array(buf, offset, n.length).set(n);
  offset += n.length;
  dv.setUint8(offset++, 0);
  return buf;
}

export function encodeSelectCluster(clusterId: number) {
  const buf = new ArrayBuffer(4 + 4);
  const dv = new DataView(buf);
  dv.setUint16(0, 1 + 4, true);
  dv.setUint8(2, 5); // type 5 = SELECT_CLUSTER
  dv.setUint32(3, clusterId, true);
  return buf;
}

export function encodeSelectCharacter(name: string) {
  const enc = new TextEncoder();
  const n = enc.encode(name);
  const buf = new ArrayBuffer(4 + n.length + 1);
  const dv = new DataView(buf);
  dv.setUint16(0, n.length + 1 + 1, true);
  dv.setUint8(2, 6); // type 6 = SELECT_CHARACTER
  let offset = 3;
  new Uint8Array(buf, offset, n.length).set(n);
  offset += n.length;
  dv.setUint8(offset++, 0);
  return buf;
}

export function encodeJoin(characterId: number) {
  const buf = new ArrayBuffer(4 + 4);
  const dv = new DataView(buf);
  dv.setUint16(0, 1 + 4, true);
  dv.setUint8(2, 7); // type 7 = JOIN
  dv.setUint32(3, characterId, true);
  return buf;
}

export function parseAck(buffer: ArrayBuffer) {
  const dv = new DataView(buffer);
  const type = dv.getUint8(2);
  // type 9 = ACK with message string
  if (type === 9) {
    const bytes = new Uint8Array(buffer, 3);
    const text = new TextDecoder().decode(bytes).replace(/\0+$/, "");
    return { type: "ACK", message: text };
  }
  return null;
}
