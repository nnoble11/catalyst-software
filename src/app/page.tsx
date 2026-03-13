import Link from "next/link";
import { GalaxyBackground } from "@/components/galaxy-background";
import { SystemTimestamp } from "@/components/system-timestamp";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background system-grid-bg">
      <GalaxyBackground />

      {/* System readouts */}
      <div className="absolute top-6 left-6 z-10 system-text select-none">
        SYS.ONLINE
      </div>
      <div className="absolute top-6 right-6 z-10 system-text select-none">
        <SystemTimestamp />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-12 px-4 text-center">
        {/* Logo */}
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          catalyst <span className="text-primary">sonar</span>
        </h1>

        {/* CTA buttons — system command style */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/invite/founder">
            <button className="w-52 border border-primary/30 bg-transparent px-6 py-3 text-xs font-medium uppercase tracking-[0.15em] text-primary transition-all hover:border-primary/60 hover:bg-primary/5 hover:shadow-[0_0_20px_oklch(0.65_0.2_45/10%)]">
              [Founder Access]
            </button>
          </Link>
          <Link href="/invite/vc">
            <button className="w-52 border border-[oklch(1_0_0/10%)] bg-transparent px-6 py-3 text-xs font-medium uppercase tracking-[0.15em] text-foreground/70 transition-all hover:border-[oklch(1_0_0/20%)] hover:text-foreground hover:shadow-[0_0_20px_oklch(1_0_0/5%)]">
              [Investor Access]
            </button>
          </Link>
        </div>

        <Link
          href="/login"
          className="text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground/60"
        >
          already have an account? access system
        </Link>
      </div>

      {/* Bottom pulse line */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="glow-line" />
      </div>
    </div>
  );
}
