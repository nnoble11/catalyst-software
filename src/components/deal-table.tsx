"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  STAGE_LABELS,
  type Startup,
  type StartupStage,
} from "@/lib/types";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Bookmark,
  BookmarkCheck,
  Search,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type SortField =
  | "name"
  | "school"
  | "stage"
  | "momentum_score"
  | "team_size"
  | "funding_raised"
  | "created_at";
type SortDir = "asc" | "desc";

interface DealTableProps {
  startups: Startup[];
  bookmarkedIds: string[];
  userId: string;
}

export function DealTable({ startups, bookmarkedIds: initialBookmarked, userId }: DealTableProps) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("momentum_score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(
    new Set(initialBookmarked)
  );

  // Collect all unique industries
  const allIndustries = useMemo(() => {
    const set = new Set<string>();
    startups.forEach((s) => s.industries?.forEach((i) => set.add(i)));
    return Array.from(set).sort();
  }, [startups]);

  // Filter and sort
  const filtered = useMemo(() => {
    let result = [...startups];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.one_liner?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.school?.toLowerCase().includes(q) ||
          s.location?.toLowerCase().includes(q)
      );
    }

    // Stage filter
    if (stageFilter !== "all") {
      result = result.filter((s) => s.stage === stageFilter);
    }

    // Industry filter
    if (industryFilter !== "all") {
      result = result.filter((s) => s.industries?.includes(industryFilter));
    }

    // Sort
    result.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "school":
          aVal = (a.school || "").toLowerCase();
          bVal = (b.school || "").toLowerCase();
          break;
        case "stage":
          const stageOrder = ["idea", "pre_seed", "seed", "series_a", "series_b_plus"];
          aVal = stageOrder.indexOf(a.stage);
          bVal = stageOrder.indexOf(b.stage);
          break;
        case "momentum_score":
          aVal = a.momentum_score;
          bVal = b.momentum_score;
          break;
        case "team_size":
          aVal = a.team_size;
          bVal = b.team_size;
          break;
        case "funding_raised":
          aVal = Number(a.funding_raised);
          bVal = Number(b.funding_raised);
          break;
        case "created_at":
          aVal = a.created_at;
          bVal = b.created_at;
          break;
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [startups, search, stageFilter, industryFilter, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field)
      return <ArrowUpDown className="ml-1 inline h-3 w-3 text-muted-foreground" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    );
  }

  async function toggleBookmark(startupId: string) {
    const supabase = createClient();
    const isBookmarked = bookmarkedIds.has(startupId);

    if (isBookmarked) {
      // Remove from default list
      const { data: lists } = await supabase
        .from("bookmark_lists")
        .select("id")
        .eq("vc_user_id", userId)
        .limit(1);

      if (lists && lists.length > 0) {
        await supabase
          .from("bookmark_list_items")
          .delete()
          .eq("list_id", lists[0].id)
          .eq("startup_id", startupId);
      }

      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        next.delete(startupId);
        return next;
      });
    } else {
      // Ensure default list exists
      let listId: string;
      const { data: lists } = await supabase
        .from("bookmark_lists")
        .select("id")
        .eq("vc_user_id", userId)
        .limit(1);

      if (lists && lists.length > 0) {
        listId = lists[0].id;
      } else {
        const { data: newList } = await supabase
          .from("bookmark_lists")
          .insert({ vc_user_id: userId, name: "Watchlist" })
          .select()
          .single();
        listId = newList!.id;
      }

      await supabase
        .from("bookmark_list_items")
        .insert({ list_id: listId, startup_id: startupId });

      setBookmarkedIds((prev) => new Set(prev).add(startupId));
    }

    // Log interaction
    await supabase.from("vc_interactions").insert({
      vc_user_id: userId,
      startup_id: startupId,
      interaction_type: isBookmarked ? "unbookmark" : "bookmark",
    });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search startups..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <Select value={stageFilter} onValueChange={(v) => v && setStageFilter(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {Object.entries(STAGE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={industryFilter} onValueChange={(v) => v && setIndustryFilter(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {allIndustries.map((ind) => (
              <SelectItem key={ind} value={ind}>
                {ind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(stageFilter !== "all" || industryFilter !== "all" || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStageFilter("all");
              setIndustryFilter("all");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {startups.length} startups
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("name")}
              >
                Name
                <SortIcon field="name" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("school")}
              >
                School
                <SortIcon field="school" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("stage")}
              >
                Stage
                <SortIcon field="stage" />
              </TableHead>
              <TableHead>Industries</TableHead>
              <TableHead
                className="cursor-pointer select-none text-right"
                onClick={() => toggleSort("momentum_score")}
              >
                Momentum
                <SortIcon field="momentum_score" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right"
                onClick={() => toggleSort("team_size")}
              >
                Team
                <SortIcon field="team_size" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right"
                onClick={() => toggleSort("funding_raised")}
              >
                Funding
                <SortIcon field="funding_raised" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("created_at")}
              >
                Added
                <SortIcon field="created_at" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                  No startups found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((startup) => (
                <TableRow key={startup.id} className="group">
                  <TableCell>
                    <button
                      onClick={() => toggleBookmark(startup.id)}
                      className="opacity-50 group-hover:opacity-100 transition-opacity"
                    >
                      {bookmarkedIds.has(startup.id) ? (
                        <BookmarkCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/deals/${startup.id}`}
                      className="font-medium hover:underline"
                    >
                      {startup.name}
                    </Link>
                    {startup.one_liner && (
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {startup.one_liner}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {startup.school || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {STAGE_LABELS[startup.stage as StartupStage]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap max-w-[150px]">
                      {startup.industries?.slice(0, 2).map((ind) => (
                        <Badge key={ind} variant="outline" className="text-xs">
                          {ind}
                        </Badge>
                      ))}
                      {(startup.industries?.length || 0) > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{startup.industries.length - 2}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {startup.momentum_score > 0
                      ? startup.momentum_score.toFixed(0)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {startup.team_size}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {Number(startup.funding_raised) > 0
                      ? `$${Number(startup.funding_raised).toLocaleString()}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(startup.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
