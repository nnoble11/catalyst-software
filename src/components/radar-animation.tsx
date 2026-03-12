"use client";

import { useEffect, useRef } from "react";

interface Blip {
  angle: number;
  distance: number;
  opacity: number;
  fadeSpeed: number;
  size: number;
}

interface Ripple {
  radius: number;
  opacity: number;
  speed: number;
}

export function RadarAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let sweepAngle = 0;
    const blips: Blip[] = [];
    const ripples: Ripple[] = [];
    const SWEEP_SPEED = 0.005;
    const RING_COUNT = 6;
    const ORANGE = { r: 252, g: 108, b: 0 };
    let lastRippleTime = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      canvas!.style.width = window.innerWidth + "px";
      canvas!.style.height = window.innerHeight + "px";
      ctx!.scale(dpr, dpr);
    }

    resize();
    window.addEventListener("resize", resize);

    // Seed initial blips — smaller and more precise
    for (let i = 0; i < 15; i++) {
      blips.push({
        angle: Math.random() * Math.PI * 2,
        distance: 0.2 + Math.random() * 0.7,
        opacity: 0,
        fadeSpeed: 0.002 + Math.random() * 0.004,
        size: 1 + Math.random() * 1.5,
      });
    }

    function draw() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h / 2;
      const maxRadius = Math.min(w, h) * 0.4;
      const now = performance.now();

      ctx!.clearRect(0, 0, w, h);

      // Dot grid (very subtle)
      ctx!.fillStyle = `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, 0.015)`;
      const gridSpacing = 32;
      const startX = (cx % gridSpacing) - gridSpacing;
      const startY = (cy % gridSpacing) - gridSpacing;
      for (let x = startX; x < w; x += gridSpacing) {
        for (let y = startY; y < h; y += gridSpacing) {
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
          if (dist < maxRadius * 1.2) {
            ctx!.beginPath();
            ctx!.arc(x, y, 0.5, 0, Math.PI * 2);
            ctx!.fill();
          }
        }
      }

      // Concentric rings
      for (let i = 1; i <= RING_COUNT; i++) {
        const r = (maxRadius / RING_COUNT) * i;
        ctx!.beginPath();
        ctx!.arc(cx, cy, r, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, 0.035)`;
        ctx!.lineWidth = 0.5;
        ctx!.stroke();
      }

      // Cross hairs
      ctx!.strokeStyle = `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, 0.025)`;
      ctx!.lineWidth = 0.5;
      ctx!.beginPath();
      ctx!.moveTo(cx - maxRadius, cy);
      ctx!.lineTo(cx + maxRadius, cy);
      ctx!.stroke();
      ctx!.beginPath();
      ctx!.moveTo(cx, cy - maxRadius);
      ctx!.lineTo(cx, cy + maxRadius);
      ctx!.stroke();

      // Signal pulse ripples
      if (now - lastRippleTime > 6000) {
        ripples.push({ radius: 0, opacity: 0.15, speed: 0.8 });
        lastRippleTime = now;
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        ripple.radius += ripple.speed;
        ripple.opacity -= 0.001;

        if (ripple.opacity <= 0) {
          ripples.splice(i, 1);
          continue;
        }

        ctx!.beginPath();
        ctx!.arc(cx, cy, ripple.radius, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, ${ripple.opacity})`;
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }

      // Sweep trail (gradient arc)
      const trailLength = Math.PI * 0.35;
      const gradient = ctx!.createConicGradient(
        sweepAngle - trailLength,
        cx,
        cy
      );
      gradient.addColorStop(0, `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, 0)`);
      gradient.addColorStop(0.7, `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, 0.03)`);
      gradient.addColorStop(1, `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, 0.08)`);

      ctx!.beginPath();
      ctx!.moveTo(cx, cy);
      ctx!.arc(cx, cy, maxRadius, sweepAngle - trailLength, sweepAngle);
      ctx!.closePath();
      ctx!.fillStyle = gradient;
      ctx!.fill();

      // Sweep line
      const lineX = cx + Math.cos(sweepAngle) * maxRadius;
      const lineY = cy + Math.sin(sweepAngle) * maxRadius;
      const lineGrad = ctx!.createLinearGradient(cx, cy, lineX, lineY);
      lineGrad.addColorStop(0, `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, 0.03)`);
      lineGrad.addColorStop(1, `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, 0.2)`);

      ctx!.beginPath();
      ctx!.moveTo(cx, cy);
      ctx!.lineTo(lineX, lineY);
      ctx!.strokeStyle = lineGrad;
      ctx!.lineWidth = 1;
      ctx!.stroke();

      // Center dot
      ctx!.beginPath();
      ctx!.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, 0.3)`;
      ctx!.fill();

      // Blips
      for (const blip of blips) {
        const angleDiff = ((sweepAngle - blip.angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        if (angleDiff < 0.08 && angleDiff > 0) {
          blip.opacity = 0.5 + Math.random() * 0.3;
        }

        if (blip.opacity > 0) {
          blip.opacity -= blip.fadeSpeed;
          if (blip.opacity < 0) blip.opacity = 0;

          const bx = cx + Math.cos(blip.angle) * (blip.distance * maxRadius);
          const by = cy + Math.sin(blip.angle) * (blip.distance * maxRadius);

          // Glow
          const glowGrad = ctx!.createRadialGradient(bx, by, 0, bx, by, blip.size * 5);
          glowGrad.addColorStop(0, `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, ${blip.opacity * 0.2})`);
          glowGrad.addColorStop(1, `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, 0)`);
          ctx!.beginPath();
          ctx!.arc(bx, by, blip.size * 5, 0, Math.PI * 2);
          ctx!.fillStyle = glowGrad;
          ctx!.fill();

          // Dot
          ctx!.beginPath();
          ctx!.arc(bx, by, blip.size, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, ${blip.opacity})`;
          ctx!.fill();
        }
      }

      sweepAngle += SWEEP_SPEED;
      if (sweepAngle > Math.PI * 2) sweepAngle -= Math.PI * 2;

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
