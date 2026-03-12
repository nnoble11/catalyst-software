import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background system-grid-bg">
      <header className="flex items-center justify-between border-b border-border px-8 py-4" style={{ boxShadow: "0 1px 12px oklch(0.65 0.2 45 / 3%)" }}>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight">
            catalyst<span className="text-primary">_</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/admin/analytics"
              className="text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground hover:text-primary transition-colors"
            >
              Analytics
            </Link>
            <Link
              href="/admin/users"
              className="text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground hover:text-primary transition-colors"
            >
              Users
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500/60" />
            <span className="text-[0.625rem] uppercase tracking-[0.1em] text-muted-foreground">{profile?.full_name}</span>
          </div>
          <SignOutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
