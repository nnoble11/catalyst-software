"use client";

import Link from "next/link";
import Image from "next/image";

export function Logo({ size = "default" }: { size?: "default" | "large" }) {
  const textClass = size === "large" ? "text-2xl" : "text-xl";

  return (
    <Link href="/dashboard" className="group flex items-center gap-2">
      <Image
        src="/logo.svg"
        alt="Catalyst Sonar"
        width={size === "large" ? 32 : 24}
        height={size === "large" ? 32 : 24}
        className="hidden"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
        onLoad={(e) => {
          (e.target as HTMLImageElement).style.display = "block";
        }}
      />
      <span className={`${textClass} font-bold tracking-tight`}>
        catalyst <span className="text-primary transition-all group-hover:drop-shadow-[0_0_8px_oklch(0.65_0.2_45/40%)]">sonar</span>
      </span>
    </Link>
  );
}
