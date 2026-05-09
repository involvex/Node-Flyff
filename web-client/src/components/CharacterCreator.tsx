import React, { useState, useEffect } from "react";
import WebSocketAdapter from "../net/WebSocketAdapter";
import AvatarPreview from "./AvatarPreview";
import AvatarAnimator from "./AvatarAnimator";
import {
  encodeCertify,
  parseWelcome,
  parseServerList,
  encodeSelectServer,
  parseAck,
} from "../net/flyffPacket";

const genders = ["male", "female"] as const;

export default function CharacterCreator() {
  const [name, setName] = useState("");
  const [genderIdx, setGenderIdx] = useState(0);
  const [face, setFace] = useState(0);
  const [hair, setHair] = useState(0);
  const [hairColor, setHairColor] = useState(0);
  const [animPart, setAnimPart] = useState<"body" | "head" | "hair">("body");

  const [wsAdapter] = useState(
    () => new WebSocketAdapter("ws://localhost:8080"),
  );
  const [sessionInfo, setSessionInfo] = useState<string | null>(null);
  const [servers, setServers] = useState<string[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleStart() {
    try {
      wsAdapter.connect();
      wsAdapter.onMessage = (data) => {
        const parsed = parseWelcome(data);
        if (parsed && parsed.session) {
          setSessionInfo(String(parsed.session));
          return;
        }
        const sl = parseServerList(data);
        if (sl && sl.servers) {
          setServers(sl.servers);
          return;
        }
        const ack = parseAck(data);
        if (ack && ack.message) {
          setStatus(ack.message);
        }
      };
      // send CERTIFY using name as account and a dummy password for demo
      const buf = encodeCertify(name || "guest", "password");
      // small delay to allow connection to open
      setTimeout(() => wsAdapter.send(buf), 200);
    } catch (err) {
      console.error("Start error", err);
    }
  }

  function handleSelectServer(name: string) {
    setStatus(`Selecting server ${name}...`);
    const buf = encodeSelectServer(name);
    wsAdapter.send(buf);
  }

  // When the user changes face or hair, briefly show that part's sheet in the animator,
  // then revert to the body sheet after a short timeout for context.
  useEffect(() => {
    setAnimPart("head");
    const t = setTimeout(() => setAnimPart("body"), 3000);
    return () => clearTimeout(t);
  }, [face]);

  useEffect(() => {
    setAnimPart("hair");
    const t = setTimeout(() => setAnimPart("body"), 3000);
    return () => clearTimeout(t);
  }, [hair]);

  return (
    <div className="cc-overlay">
      <div className="cc-modal">
        <h2 className="cc-title">Gastcharakter</h2>
        <div className="cc-grid">
          <div className="cc-form">
            <label className="cc-label">Name</label>
            <input
              className="cc-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
            />

            <div className="cc-row">
              <button
                className="cc-gender"
                onClick={() => setGenderIdx((g) => (g + 1) % genders.length)}
              >
                {genders[genderIdx]}
              </button>
            </div>

            <div className="cc-attr">
              <div>
                <div className="attr-label">Gesicht</div>
                <div className="attr-controls">
                  <button onClick={() => setFace((f) => Math.max(0, f - 1))}>
                    {"<"}
                  </button>
                  <div className="attr-value">{face}</div>
                  <button onClick={() => setFace((f) => f + 1)}>{">"}</button>
                </div>
              </div>

              <div>
                <div className="attr-label">Haare</div>
                <div className="attr-controls">
                  <button onClick={() => setHair((h) => Math.max(0, h - 1))}>
                    {"<"}
                  </button>
                  <div className="attr-value">{hair}</div>
                  <button onClick={() => setHair((h) => h + 1)}>{">"}</button>
                </div>
              </div>

              <div>
                <div className="attr-label">Haarfarbe</div>
                <div className="attr-controls">
                  <button
                    onClick={() => setHairColor((c) => Math.max(0, c - 1))}
                  >
                    {"<"}
                  </button>
                  <div className="attr-value">{hairColor}</div>
                  <button onClick={() => setHairColor((c) => c + 1)}>
                    {">"}
                  </button>
                </div>
              </div>
            </div>

            <label className="cc-accept">
              <input type="checkbox" /> Ich akzeptiere die Bedingungen. Lesen
            </label>

            <div className="start-row">
              <button className="cc-start" onClick={handleStart}>
                Start
              </button>
            </div>
          </div>

          <div className="cc-preview">
            <div className="preview-box">
              <div className="preview-canvas-wrap">
                <AvatarPreview
                  gender={genders[genderIdx]}
                  face={face}
                  hair={hair}
                  hairColor={hairColor}
                  width={140}
                  height={140}
                />
              </div>
              <div className="animator-wrap">
                <AvatarAnimator part={animPart} fps={8} />
              </div>
            </div>
            {sessionInfo ? (
              <div className="session-box">Session: {sessionInfo}</div>
            ) : null}
            {servers ? (
              <div className="server-list">
                <h4>Servers</h4>
                <ul>
                  {servers.map((s) => (
                    <li
                      key={s}
                      className="server-item"
                      onClick={() => handleSelectServer(s)}
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {status ? <div className="status-box">{status}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
