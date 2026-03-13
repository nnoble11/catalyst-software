"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  char: string;
  brightness: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface CelestialBody {
  x: number;
  y: number;
  z: number;
  type: "planet" | "galaxy" | "nebula";
  chars: string[];
  vx: number;
  vy: number;
  brightness: number;
}

const STAR_CHARS = [".", "·", "∗", "✦", "+", "⋅", "∘", "°"];
const PLANET_SHAPES = [
  ["◯"],
  ["⊙"],
  ["◉"],
  ["●"],
  ["○"],
];
const GALAXY_SHAPES = [
  ["~ ≈ ~", " ≋≋ ", "~ ≈ ~"],
  [" ※ ", "※✧※", " ※ "],
  ["⌁⌁", "⌁⌁"],
];
const NEBULA_SHAPES = [
  [" ░░ ", "░▒▒░", " ░░ "],
  ["·:·", ":∴:", "·:·"],
];

const ORANGE = { r: 252, g: 108, b: 0 };

export function GalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const stars: Star[] = [];
    const bodies: CelestialBody[] = [];
    let time = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      canvas!.style.width = window.innerWidth + "px";
      canvas!.style.height = window.innerHeight + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    const w = () => window.innerWidth;
    const h = () => window.innerHeight;

    // Seed stars
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: Math.random(),
        char: STAR_CHARS[Math.floor(Math.random() * STAR_CHARS.length)],
        brightness: 0.1 + Math.random() * 0.5,
        twinkleSpeed: 0.5 + Math.random() * 2,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }

    // Seed celestial bodies
    for (let i = 0; i < 4; i++) {
      const type = i < 2 ? "planet" : i < 3 ? "galaxy" : "nebula";
      const shapes =
        type === "planet"
          ? PLANET_SHAPES
          : type === "galaxy"
          ? GALAXY_SHAPES
          : NEBULA_SHAPES;
      bodies.push({
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: 0.2 + Math.random() * 0.6,
        type,
        chars: shapes[Math.floor(Math.random() * shapes.length)],
        vx: (Math.random() - 0.5) * 0.00015,
        vy: (Math.random() - 0.5) * 0.00008,
        brightness: 0.15 + Math.random() * 0.25,
      });
    }

    function draw() {
      const cw = w();
      const ch = h();
      const cx = cw / 2;
      const cy = ch / 2;

      ctx!.clearRect(0, 0, cw, ch);
      ctx!.textBaseline = "middle";
      ctx!.textAlign = "center";

      // Slow global rotation for parallax feel
      const globalAngle = time * 0.00003;
      const cosA = Math.cos(globalAngle);
      const sinA = Math.sin(globalAngle);

      // Draw stars
      for (const star of stars) {
        // Gentle parallax rotation
        const rx = star.x * cosA - star.y * sinA;
        const ry = star.x * sinA + star.y * cosA;

        const sx = cx + rx * cw * 0.55;
        const sy = cy + ry * ch * 0.55;

        if (sx < -20 || sx > cw + 20 || sy < -20 || sy > ch + 20) continue;

        const twinkle =
          Math.sin(time * 0.001 * star.twinkleSpeed + star.twinkleOffset) *
            0.5 +
          0.5;
        const alpha = star.brightness * (0.4 + twinkle * 0.6);

        const size = 8 + star.z * 6;
        ctx!.font = `${size}px "JetBrains Mono", monospace`;

        // Subtle orange tint for brighter stars, white for dim ones
        if (star.brightness > 0.35) {
          ctx!.fillStyle = `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, ${alpha * 0.7})`;
        } else {
          ctx!.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        }

        ctx!.fillText(star.char, sx, sy);
      }

      // Draw celestial bodies
      for (const body of bodies) {
        body.x += body.vx;
        body.y += body.vy;

        // Wrap around
        if (body.x > 1.2) body.x = -1.2;
        if (body.x < -1.2) body.x = 1.2;
        if (body.y > 1.2) body.y = -1.2;
        if (body.y < -1.2) body.y = 1.2;

        const rx = body.x * cosA - body.y * sinA;
        const ry = body.x * sinA + body.y * cosA;

        const bx = cx + rx * cw * 0.45;
        const by = cy + ry * ch * 0.45;

        const pulse =
          Math.sin(time * 0.0008 + body.x * 10) * 0.15 + 0.85;
        const alpha = body.brightness * pulse;

        const fontSize = body.type === "planet" ? 14 : 10;
        ctx!.font = `${fontSize}px "JetBrains Mono", monospace`;
        ctx!.fillStyle = `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, ${alpha})`;

        const lineHeight = fontSize * 1.4;
        const startY = by - ((body.chars.length - 1) * lineHeight) / 2;

        for (let i = 0; i < body.chars.length; i++) {
          ctx!.fillText(body.chars[i], bx, startY + i * lineHeight);
        }

        // Glow effect for planets
        if (body.type === "planet") {
          const glowGrad = ctx!.createRadialGradient(bx, by, 0, bx, by, 30);
          glowGrad.addColorStop(
            0,
            `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, ${alpha * 0.08})`
          );
          glowGrad.addColorStop(1, `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, 0)`);
          ctx!.beginPath();
          ctx!.arc(bx, by, 30, 0, Math.PI * 2);
          ctx!.fillStyle = glowGrad;
          ctx!.fill();
        }
      }

      // Shooting star (rare)
      if (Math.random() < 0.002) {
        const sx = Math.random() * cw;
        const sy = Math.random() * ch * 0.4;
        const len = 40 + Math.random() * 60;
        const angle = Math.PI * 0.15 + Math.random() * 0.3;

        const grad = ctx!.createLinearGradient(
          sx, sy,
          sx + Math.cos(angle) * len,
          sy + Math.sin(angle) * len
        );
        grad.addColorStop(0, `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, 0.4)`);
        grad.addColorStop(0.3, `rgba(255, 255, 255, 0.3)`);
        grad.addColorStop(1, `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, 0)`);

        ctx!.beginPath();
        ctx!.moveTo(sx, sy);
        ctx!.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }

      time += 16;
      animationId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0"
      style={{ pointerEvents: "none" }}
    />
  );
}
