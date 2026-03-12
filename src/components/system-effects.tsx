"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const STATUS_MESSAGES = [
  "SYNC COMPLETE",
  "SIGNAL ACQUIRED",
  "NODE UPDATED",
  "INDEX REFRESHED",
  "CONNECTION STABLE",
  "DATA VERIFIED",
  "SCAN COMPLETE",
];

export function SystemEffects({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    // Cursor proximity glow
    function handleMouseMove(e: MouseEvent) {
      if (containerRef.current) {
        containerRef.current.style.setProperty("--cursor-x", `${e.clientX}px`);
        containerRef.current.style.setProperty("--cursor-y", `${e.clientY}px`);
      }
    }

    window.addEventListener("mousemove", handleMouseMove);

    // Status flash — random interval between 30-60s
    function scheduleStatus() {
      const delay = 30000 + Math.random() * 30000;
      return setTimeout(() => {
        const msg = STATUS_MESSAGES[Math.floor(Math.random() * STATUS_MESSAGES.length)];
        setStatusMessage(msg);
        setTimeout(() => setStatusMessage(null), 2500);
        timerId = scheduleStatus();
      }, delay);
    }

    let timerId = scheduleStatus();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timerId);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Cursor glow overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-100"
        style={{
          background: "radial-gradient(300px circle at var(--cursor-x, 50%) var(--cursor-y, 50%), oklch(0.65 0.2 45 / 3%), transparent 80%)",
        }}
      />

      {children}

      {/* Status flash */}
      {statusMessage && (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
          style={{ animation: "fade-in-out 2.5s ease-in-out forwards" }}
        >
          <span className="text-[0.6rem] uppercase tracking-[0.2em] text-primary/30">
            // {statusMessage}
          </span>
        </div>
      )}
    </div>
  );
}
