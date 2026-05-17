import React, { useEffect, useRef } from "react";

type SheetInfo = {
  sheet: string;
  frameWidth: number;
  frameHeight: number;
  count: number;
};

export default function AvatarAnimator ({
  part = "body",
  fps = 8
}: {
  part?: string;
  fps?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    let img: HTMLImageElement | null = null;
    let sheetInfo: SheetInfo | null = null;

    async function loadManifest () {
      const resp = await fetch("/assets/manifest.json");
      if (!resp.ok) return;
      const manifest = await resp.json();
      const sheets = manifest.assets?.avatar_sheets || {};
      if (!sheets[part]) return;
      sheetInfo = sheets[part] as SheetInfo;
      img = new Image();
      img.src = sheetInfo.sheet;
      await new Promise((resolve, reject) => {
        img!.onload = () => resolve(null);
        img!.onerror = reject;
      });
      if (!mounted) return;
      startAnimation();
    }

    let frame = 0;
    let last = performance.now();
    const interval = 1000 / fps;

    function draw () {
      if (!canvasRef.current || !img || !sheetInfo) return;
      const now = performance.now();
      const delta = now - last;
      if (delta >= interval) {
        frame = (frame + 1) % sheetInfo.count;
        last = now - (delta % interval);
      }
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      canvasRef.current.width = sheetInfo.frameWidth;
      canvasRef.current.height = sheetInfo.frameHeight;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(
        img,
        frame * sheetInfo.frameWidth,
        0,
        sheetInfo.frameWidth,
        sheetInfo.frameHeight,
        0,
        0,
        sheetInfo.frameWidth,
        sheetInfo.frameHeight
      );
      rafRef.current = requestAnimationFrame(draw);
    }

    function startAnimation () {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    }

    loadManifest().catch(() => {});

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [part, fps]);

  return <canvas ref={canvasRef} className="avatar-canvas" />;
}
