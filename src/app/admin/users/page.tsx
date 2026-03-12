import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .order("created_at", { ascending: false });

  const founderIds = users?.filter((u) => u.role === "founder").map((u) => u.id) || [];
  const startupCountMap: Record<string, number> = {};
  if (founderIds.length > 0) {
    const { data: links } = await supabase
      .from("startup_founders")
      .select("founder_id")
      .in("founder_id", founderIds);
    for (const l of links || []) {
      startupCountMap[l.founder_id] = (startupCountMap[l.founder_id] || 0) + 1;
    }
  }

  const vcIds = users?.filter((u) => u.role === "vc").map((u) => u.id) || [];
  const firmNameMap: Record<string, string> = {};
  if (vcIds.length > 0) {
    const { data: vcProfiles } = await supabase
      .from("vc_profiles")
      .select("id, firm_name")
      .in("id", vcIds);
    for (const vp of vcProfiles || []) {
      firmNameMap[vp.id] = vp.firm_name;
    }
  }

  const roleBadgeColor: Record<string, string> = {
    founder: "bg-orange-500/15 text-orange-400",
    vc: "bg-purple-500/15 text-purple-400",
    admin: "bg-red-500/15 text-red-400",
  };

  return (
    <main className="mx-auto max-w-5xl px-8 py-8">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-pulse" />
        <span className="system-label">user registry</span>
      </div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-[0.05em]">User Management</h1>
          <p className="text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mt-1">
            {users?.length || 0} total users
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground font-medium">Name</th>
                <th className="px-4 py-3 text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground font-medium">Role</th>
                <th className="px-4 py-3 text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground font-medium">Details</th>
                <th className="px-4 py-3 text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0 transition-all hover:bg-primary/[0.02] hover:shadow-[inset_0_0_30px_oklch(0.65_0.2_45/3%)]">
                  <td className="px-4 py-3 font-medium">{user.full_name || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-[0.55rem] uppercase tracking-wider ${roleBadgeColor[user.role] || ""}`}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.role === "founder" && (
                      <span>{startupCountMap[user.id] || 0} startup(s)</span>
                    )}
                    {user.role === "vc" && (
                      <span>{firmNameMap[user.id] || "No firm"}</span>
                    )}
                    {user.role === "admin" && <span>—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!users || users.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center">
                    <span className="text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
                      No users found
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
