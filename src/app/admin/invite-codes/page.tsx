"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { InviteCode } from "@/lib/types";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${part()}-${part()}`;
}

export default function InviteCodesPage() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Create form state
  const [newCode, setNewCode] = useState(generateCode());
  const [codeType, setCodeType] = useState<"single_use" | "multi_use">("single_use");
  const [maxUses, setMaxUses] = useState("1");
  const [roleRestriction, setRoleRestriction] = useState<"any" | "founder" | "vc">("any");
  const [expiresAt, setExpiresAt] = useState("");

  async function fetchCodes() {
    const supabase = createClient();
    const { data } = await supabase
      .from("invite_codes")
      .select("*")
      .order("created_at", { ascending: false });
    setCodes(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchCodes();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: insertError } = await supabase.from("invite_codes").insert({
      code: newCode.trim().toUpperCase(),
      type: codeType,
      max_uses: codeType === "single_use" ? 1 : parseInt(maxUses),
      created_by: user?.id,
      role_restriction: roleRestriction,
      is_active: true,
      expires_at: expiresAt || null,
    });

    if (insertError) {
      setError(insertError.message);
      setCreating(false);
      return;
    }

    setNewCode(generateCode());
    setCodeType("single_use");
    setMaxUses("1");
    setRoleRestriction("any");
    setExpiresAt("");
    setCreating(false);
    fetchCodes();
  }

  async function toggleActive(id: string, currentActive: boolean) {
    const supabase = createClient();
    await supabase
      .from("invite_codes")
      .update({ is_active: !currentActive })
      .eq("id", id);
    fetchCodes();
  }

  return (
    <main className="mx-auto max-w-5xl px-8 py-8">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-pulse" />
        <span className="system-label">access control</span>
      </div>
      <h1 className="mb-8 text-2xl font-bold uppercase tracking-[0.05em]">
        Invite Codes
      </h1>

      {/* Create form */}
      <div className="mb-8 rounded-lg border border-border bg-card p-6 system-glow">
        <h2 className="system-label text-sm mb-4">Generate New Code</h2>
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label className="system-label">Code</Label>
            <Input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              className="font-mono tracking-widest"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="system-label">Type</Label>
            <select
              value={codeType}
              onChange={(e) => setCodeType(e.target.value as "single_use" | "multi_use")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-primary/40"
            >
              <option value="single_use">Single Use</option>
              <option value="multi_use">Multi Use</option>
            </select>
          </div>
          {codeType === "multi_use" && (
            <div className="space-y-2">
              <Label className="system-label">Max Uses</Label>
              <Input
                type="number"
                min="2"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label className="system-label">Role Restriction</Label>
            <select
              value={roleRestriction}
              onChange={(e) => setRoleRestriction(e.target.value as "any" | "founder" | "vc")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-primary/40"
            >
              <option value="any">Any Role</option>
              <option value="founder">Founders Only</option>
              <option value="vc">Investors Only</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="system-label">Expires At (optional)</Label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating}
              className="w-full border border-primary/30 bg-transparent px-4 py-2 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-primary transition-all hover:border-primary/60 hover:bg-primary/5 disabled:opacity-50"
            >
              {creating ? "Creating..." : "[ Generate Code ]"}
            </button>
          </div>
        </form>
        {error && (
          <p className="mt-3 text-xs text-destructive">{error}</p>
        )}
      </div>

      {/* Codes table */}
      <div className="rounded-lg border border-border bg-card system-glow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-[0.6rem] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-[0.6rem] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-[0.6rem] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Uses
                </th>
                <th className="px-4 py-3 text-left text-[0.6rem] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-[0.6rem] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[0.6rem] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-[0.6rem] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : codes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    No codes generated
                  </td>
                </tr>
              ) : (
                codes.map((code) => {
                  const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
                  const isExhausted =
                    code.type === "single_use"
                      ? code.uses_count >= 1
                      : code.uses_count >= code.max_uses;

                  return (
                    <tr
                      key={code.id}
                      className="border-b border-border/50 transition-colors hover:bg-primary/[0.02]"
                    >
                      <td className="px-4 py-3 font-mono text-xs tracking-widest">
                        {code.code}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[0.6rem] uppercase tracking-wider">
                          {code.type === "single_use" ? "Single" : "Multi"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {code.uses_count} / {code.max_uses}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[0.6rem] uppercase tracking-wider">
                          {code.role_restriction}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {!code.is_active ? (
                          <Badge variant="outline" className="text-[0.6rem] text-muted-foreground">
                            Disabled
                          </Badge>
                        ) : isExpired ? (
                          <Badge variant="outline" className="text-[0.6rem] text-destructive">
                            Expired
                          </Badge>
                        ) : isExhausted ? (
                          <Badge variant="outline" className="text-[0.6rem] text-muted-foreground">
                            Exhausted
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[0.6rem] text-green-500">
                            Active
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(code.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => toggleActive(code.id, code.is_active)}
                          className="text-[0.6rem] uppercase tracking-[0.1em] text-primary/60 hover:text-primary transition-colors"
                        >
                          {code.is_active ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
