"use client";

import { useEffect, useMemo, useRef } from "react";
import { CATEGORIES } from "@/lib/types";

/**
 * SkillGraph — the domain-correct hero visual for a skill registry:
 * an interactive dependency network (agent hub → categories → skills),
 * rendered on lightweight 2D canvas. No globe: a planet metaphor would be
 * decoration here; the network IS the product structure.
 */
interface Props {
  counts: Record<string, number>;
}

interface Node {
  x: number;
  y: number;
  r: number;
  color: string;
  label?: string;
  orbit?: { cx: number; cy: number; rad: number; speed: number; phase: number };
}

export default function SkillGraph({ counts }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const paused = useRef(false);

  const palette = useMemo(() => CATEGORIES, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = {
        x: (e.clientX - rect.left) / Math.max(1, rect.width),
        y: (e.clientY - rect.top) / Math.max(1, rect.height),
      };
    };
    const onDown = () => {
      paused.current = true;
      window.setTimeout(() => {
        paused.current = false;
      }, 2500);
    };
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduced) loop();
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    document.addEventListener("visibilitychange", onVis);

    // Deterministic layout: hub center, 6 category nodes on ellipse, skill dots orbiting each
    const build = (): { hubs: Node[]; sats: Node[] } => {
      const cx = w / 2;
      const cy = h / 2;
      const rx = Math.min(w * 0.36, 320);
      const ry = Math.min(h * 0.34, 200);
      const hubs: Node[] = palette.map((c, i) => {
        const a = (i / palette.length) * Math.PI * 2 - Math.PI / 2;
        return {
          x: cx + Math.cos(a) * rx,
          y: cy + Math.sin(a) * ry,
          r: 16,
          color: c.color,
          label: c.label,
        };
      });
      const sats: Node[] = [];
      hubs.forEach((hub, hi) => {
        const n = 3 + (hi % 3);
        for (let k = 0; k < n; k++) {
          sats.push({
            x: hub.x,
            y: hub.y,
            r: 3.5,
            color: hub.color,
            orbit: {
              cx: hub.x,
              cy: hub.y,
              rad: 30 + k * 13,
              speed: 0.25 + (k % 3) * 0.12,
              phase: (k / n) * Math.PI * 2 + hi,
            },
          });
        }
      });
      return { hubs, sats };
    };

    let layout = build();
    // Starfield behind the network — seeded drift, twinkle, wrap-around
    const parts = Array.from({ length: 90 }, (_, i) => ({
      x: ((i * 137.5) % 100) / 100,
      y: ((i * 89.3) % 100) / 100,
      s: 0.6 + ((i * 37) % 10) / 8,
      v: 0.008 + ((i * 53) % 10) / 900,
      tw: (i * 0.7) % (Math.PI * 2),
    }));
    const PCOLORS = ["#34d399", "#fbbf24", "#22d3ee", "#f97316", "#e11d48", "#a3e635"];
    const rebuildOnResize = () => {
      layout = build();
    };
    ro.disconnect();
    const ro2 = new ResizeObserver(() => {
      resize();
      rebuildOnResize();
    });
    ro2.observe(canvas);

    const draw = () => {
      t += paused.current ? 0.002 : 0.016;
      const px = (mouse.current.x - 0.5) * 14;
      const py = (mouse.current.y - 0.5) * 14;
      ctx.clearRect(0, 0, w, h);
      // starfield
      parts.forEach((p, i) => {
        const sx2 = ((p.x + t * p.v * 0.06) % 1) * w;
        const sy2 = (((p.y * h + Math.sin(t * 0.4 + p.tw) * 6) % h) + h) % h;
        ctx.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.4 + p.tw));
        ctx.fillStyle = PCOLORS[i % PCOLORS.length];
        ctx.beginPath();
        ctx.arc(sx2, sy2, p.s, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      const cx = w / 2 + px;
      const cy = h / 2 + py;

      // Edges hub → categories with traveling pulses
      layout.hubs.forEach((hub, i) => {
        const hx = hub.x + px * (1 + i * 0.06);
        const hy = hub.y + py * (1 + i * 0.06);
        const grad = ctx.createLinearGradient(cx, cy, hx, hy);
        grad.addColorStop(0, "rgba(34,211,238,0.5)");
        grad.addColorStop(1, `${hub.color}55`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(hx, hy);
        ctx.stroke();
        // pulse
        const p = (t * 0.5 + i * 0.17) % 1;
        const pxx = cx + (hx - cx) * p;
        const pyy = cy + (hy - cy) * p;
        ctx.fillStyle = hub.color;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(pxx, pyy, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Central hub
      const hubGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 34);
      hubGrad.addColorStop(0, "rgba(34,211,238,0.95)");
      hubGrad.addColorStop(0.5, "rgba(249,115,22,0.55)");
      hubGrad.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = hubGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#04060c";
      ctx.font = "700 11px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#eef2ff";
      ctx.font = "700 10px 'JetBrains Mono', monospace";
      ctx.fillText("AGENT", cx, cy - 1);

      // Category nodes + labels
      ctx.textAlign = "center";
      layout.hubs.forEach((hub, i) => {
        const hx = hub.x + px * (1 + i * 0.06);
        const hy = hub.y + py * (1 + i * 0.06);
        ctx.fillStyle = "#04060c";
        ctx.strokeStyle = hub.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hx, hy, hub.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = hub.color;
        ctx.font = "700 11px 'JetBrains Mono', monospace";
        ctx.fillText(hub.label ?? "", hx, hy + hub.r + 14);
      });

      // Orbiting skill dots
      layout.sats.forEach((s) => {
        if (!s.orbit) return;
        const ox = s.orbit.cx + px;
        const oy = s.orbit.cy + py;
        const a = s.orbit.phase + t * s.orbit.speed;
        const sx = ox + Math.cos(a) * s.orbit.rad;
        const sy = oy + Math.sin(a) * s.orbit.rad * 0.7;
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    };

    const loop = () => {
      draw();
      if (!reduced) raf = requestAnimationFrame(loop);
    };
    if (reduced) draw();
    else loop();

    return () => {
      cancelAnimationFrame(raf);
      ro2.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="glass relative overflow-hidden rounded-3xl">
      <canvas
        ref={canvasRef}
        className="h-[340px] w-full cursor-crosshair sm:h-[420px]"
        aria-label={`Interactive skill network: ${total} skills across 6 categories`}
        role="img"
      />
      <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-mint/30 bg-void/70 px-3 py-1.5 font-mono text-[11px] text-mint backdrop-blur">
        <span className="size-1.5 animate-pulse-glow rounded-full bg-mint" />
        LIVE NETWORK · {total} SKILLS
      </div>
      <div className="pointer-events-none absolute bottom-4 right-4 rounded-full border border-line bg-void/70 px-3 py-1.5 font-mono text-[11px] text-mist backdrop-blur">
        move to parallax · click to pause rotation
      </div>
    </div>
  );
}
