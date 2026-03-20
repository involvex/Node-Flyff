import React, { useEffect, useRef, useState } from "react";
import assetLoader from "../assets/assetLoader";

type Props = {
  gender: "male" | "female";
  face: number;
  hair: number;
  hairColor: number;
  width?: number;
  height?: number;
};

const HAIR_COLORS = ["#2b2b2b", "#7b3f00", "#f2d16b", "#d9644a", "#1e90ff"];

function makeAvatarSVG(gender: string, face: number, hair: number, hairColor: string) {
  // Simple inline SVG with separate hair and body shapes so we can tint hair dynamically.
  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>
    <rect width='100%' height='100%' fill='transparent' />
    <g id='body'>
      <ellipse cx='64' cy='86' rx='28' ry='18' fill='${gender === "female" ? "#fce0d6" : "#f0dcbf"}' />
      <circle cx='64' cy='52' r='26' fill='${gender === "female" ? "#ffe8d8" : "#ffe6c8"}' />
    </g>
    <g id='face'>
      <!-- simple eyes/mouth vary by face index -->
      ${face % 3 === 0 ? "<circle cx='52' cy='48' r='3' fill='#333' /><circle cx='76' cy='48' r='3' fill='#333'/>" : ""}
      ${face % 3 === 1 ? "<rect x='50' y='46' width='4' height='4' rx='2' fill='#333' /><rect x='74' y='46' width='4' height='4' rx='2' fill='#333'/>" : ""}
      ${face % 3 === 2 ? "<ellipse cx='52' cy='48' rx='3' ry='2' fill='#333' /><ellipse cx='76' cy='48' rx='3' ry='2' fill='#333'/>" : ""}
      <path d='M58 64 q6 6 12 0' stroke='#c66' stroke-width='2' fill='none' stroke-linecap='round' />
    </g>
    <g id='hair' fill='${hairColor}'>
      <!-- hair variants by hair index -->
      ${hair % 3 === 0 ? "<path d='M36 42 q28 -28 56 0 q-6 28 -56 0z' />" : ""}
      ${hair % 3 === 1 ? "<path d='M28 44 q36 -32 72 0 q-10 32 -72 0z' />" : ""}
      ${hair % 3 === 2 ? "<path d='M40 36 q20 -20 48 0 q-8 24 -48 0z' />" : ""}
    </g>
  </svg>`;
}

export default function AvatarPreview({ gender, face, hair, hairColor, width = 160, height = 160 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loadedParts, setLoadedParts] = useState<Record<string, HTMLImageElement[]>>();

  useEffect(() => {
    let cancelled = false;
    assetLoader.loadAvatarParts().then((parts) => {
      if (!cancelled) setLoadedParts(parts);
    }).catch(() => {
      // ignore; fallback to generated svg
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const color = HAIR_COLORS[hairColor % HAIR_COLORS.length] || HAIR_COLORS[0];

    if (loadedParts && loadedParts.head && loadedParts.body) {
      // compose parts from loaded images
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const imgs: HTMLImageElement[] = [];
      if (loadedParts.body[0]) imgs.push(loadedParts.body[0]);
      if (loadedParts.head[0]) imgs.push(loadedParts.head[0]);
      if (loadedParts.hair && loadedParts.hair[0]) imgs.push(loadedParts.hair[0]);
      for (const img of imgs) {
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        ctx.drawImage(img, x, y, w, h);
      }
      return;
    }

    // fallback: render generated SVG to canvas
    const svg = makeAvatarSVG(gender, face, hair, color);
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (canvas.width - w) / 2;
      const y = (canvas.height - h) / 2;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, x, y, w, h);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }, [gender, face, hair, hairColor, width, height, loadedParts]);

  return <canvas className="avatar-canvas" ref={canvasRef} width={width} height={height} />;
}
