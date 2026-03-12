"use client";

import { useState, useEffect } from "react";

export function SystemTimestamp() {
  const [time, setTime] = useState("");

  useEffect(() => {
    function update() {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, "0");
      const m = now.getMinutes().toString().padStart(2, "0");
      const s = now.getSeconds().toString().padStart(2, "0");
      setTime(`${h}:${m}:${s} UTC${now.getTimezoneOffset() <= 0 ? "+" : "-"}${Math.abs(Math.floor(now.getTimezoneOffset() / 60))}`);
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span>{time}</span>;
}
