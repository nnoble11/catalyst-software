import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Rocket,
  TrendingUp,
  Users,
  Zap,
  BarChart3,
  Shield,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b bg-background/95 backdrop-blur px-6 py-4 md:px-8">
        <div className="text-xl font-bold">Catalyst Labs</div>
        <div className="flex gap-2 sm:gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="sm:size-default">
              Log in
            </Button>
          </Link>
          <Link href="/signup/founder">
            <Button size="sm" className="sm:size-default">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center gap-6 px-6 py-20 text-center md:px-8 md:py-32">
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
          <Zap className="h-3 w-3" />
          Powered by Momentum — our proprietary growth score
        </div>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Where student startups get discovered
        </h1>
        <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
          Build your startup profile, track your momentum, and get in front of
          the investors and accelerators that matter — all in one place.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link href="/signup/founder">
            <Button size="lg" className="w-full gap-2 sm:w-auto">
              <Rocket className="h-4 w-4" />
              I&apos;m a Founder
            </Button>
          </Link>
          <Link href="/signup/vc">
            <Button size="lg" variant="outline" className="w-full gap-2 sm:w-auto">
              <TrendingUp className="h-4 w-4" />
              I&apos;m an Investor
            </Button>
          </Link>
        </div>
      </section>

      {/* Features for Founders */}
      <section className="border-t bg-muted/30 px-6 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-sm font-medium text-primary">For Founders</p>
          <h2 className="mb-3 text-2xl font-bold sm:text-3xl">
            Your startup&apos;s home base
          </h2>
          <p className="mb-10 max-w-2xl text-muted-foreground">
            Everything you need to showcase your startup, track progress, and
            connect with top-tier investors and accelerators.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border bg-background p-6">
              <Rocket className="mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-2 font-semibold">Launch Your Profile</h3>
              <p className="text-sm text-muted-foreground">
                Create a rich startup profile in minutes — team, metrics,
                funding, and more. Your profile is your pitch.
              </p>
            </div>
            <div className="rounded-lg border bg-background p-6">
              <TrendingUp className="mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-2 font-semibold">Track Momentum</h3>
              <p className="text-sm text-muted-foreground">
                Our proprietary Momentum score measures your growth velocity.
                Post updates and watch your score climb.
              </p>
            </div>
            <div className="rounded-lg border bg-background p-6">
              <Zap className="mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-2 font-semibold">1-Click Apply</h3>
              <p className="text-sm text-muted-foreground">
                Apply to accelerator programs with a single click. Your profile
                is your application — no extra forms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features for VCs */}
      <section className="border-t px-6 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-sm font-medium text-primary">For Investors</p>
          <h2 className="mb-3 text-2xl font-bold sm:text-3xl">
            Discover the next generation
          </h2>
          <p className="mb-10 max-w-2xl text-muted-foreground">
            Get early access to the most promising student startups before
            anyone else. Sort, filter, and engage — all on one platform.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-6">
              <BarChart3 className="mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-2 font-semibold">Deal Flow Table</h3>
              <p className="text-sm text-muted-foreground">
                Browse all startups in a sortable, filterable table. Search by
                stage, industry, school, momentum, and more.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <Users className="mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-2 font-semibold">Direct Messaging</h3>
              <p className="text-sm text-muted-foreground">
                Reach out to founders directly through the platform. Build
                relationships before anyone else does.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <Shield className="mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-2 font-semibold">List Accelerators</h3>
              <p className="text-sm text-muted-foreground">
                Post your accelerator program and receive 1-click applications
                from qualified startups.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 px-6 py-16 text-center md:px-8 md:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
            Ready to get started?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Join hundreds of student founders and top investors already on
            Catalyst Labs.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link href="/signup/founder">
              <Button size="lg" className="w-full gap-2 sm:w-auto">
                Create Founder Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/signup/vc">
              <Button size="lg" variant="outline" className="w-full gap-2 sm:w-auto">
                Join as Investor
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-6 md:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-sm font-medium">Catalyst Labs</div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Catalyst Labs. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
