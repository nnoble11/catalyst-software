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
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-8 py-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-bold">
            Catalyst Labs
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/admin/analytics"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Analytics
            </Link>
            <Link
              href="/admin/users"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Users
            </Link>
            <Link
              href="/admin/interactions"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Interactions
            </Link>
            <Link
              href="/admin/momentum"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Momentum
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{profile?.full_name}</span>
          <SignOutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
