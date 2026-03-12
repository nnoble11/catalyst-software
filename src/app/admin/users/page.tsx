import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .order("created_at", { ascending: false });

  // Get startup counts per founder
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

  // Get VC firm names
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
    founder: "bg-blue-100 text-blue-800",
    vc: "bg-purple-100 text-purple-800",
    admin: "bg-red-100 text-red-800",
  };

  return (
    <main className="mx-auto max-w-5xl px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">{users?.length || 0} total users</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{user.full_name || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs capitalize ${roleBadgeColor[user.role] || ""}`}>
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
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
