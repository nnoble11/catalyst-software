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
import {
  STAGE_LABELS,
  type Startup,
  type StartupStage,
} from "@/lib/types";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Search,
  X,
} from "lucide-react";

type SortField =
  | "name"
  | "school"
  | "stage"
  | "team_size"
  | "funding_raised"
  | "created_at";
type SortDir = "asc" | "desc";

interface DealTableProps {
  startups: Startup[];
}

export function DealTable({ startups }: DealTableProps) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const allIndustries = useMemo(() => {
    const set = new Set<string>();
    startups.forEach((s) => s.industries?.forEach((i) => set.add(i)));
    return Array.from(set).sort();
  }, [startups]);

  const filtered = useMemo(() => {
    let result = [...startups];

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

    if (stageFilter !== "all") {
      result = result.filter((s) => s.stage === stageFilter);
    }

    if (industryFilter !== "all") {
      result = result.filter((s) => s.industries?.includes(industryFilter));
    }

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
      return <ArrowUpDown className="ml-1 inline h-3 w-3 text-muted-foreground/50" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3 text-primary/60" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3 text-primary/60" />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            className="pl-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <Select value={stageFilter} onValueChange={(v) => v && setStageFilter(v)}>
          <SelectTrigger className="w-[140px] text-xs">
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
          <SelectTrigger className="w-[160px] text-xs">
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
          <button
            onClick={() => {
              setSearch("");
              setStageFilter("all");
              setIndustryFilter("all");
            }}
            className="text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      <p className="text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
        Showing {filtered.length} of {startups.length} results
      </p>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-[40px] text-[0.6rem] uppercase tracking-[0.12em]" />
              <TableHead
                className="cursor-pointer select-none text-[0.6rem] uppercase tracking-[0.12em]"
                onClick={() => toggleSort("name")}
              >
                Name
                <SortIcon field="name" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-[0.6rem] uppercase tracking-[0.12em]"
                onClick={() => toggleSort("school")}
              >
                School
                <SortIcon field="school" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-[0.6rem] uppercase tracking-[0.12em]"
                onClick={() => toggleSort("stage")}
              >
                Stage
                <SortIcon field="stage" />
              </TableHead>
              <TableHead className="text-[0.6rem] uppercase tracking-[0.12em]">Industries</TableHead>
              <TableHead
                className="cursor-pointer select-none text-right text-[0.6rem] uppercase tracking-[0.12em]"
                onClick={() => toggleSort("team_size")}
              >
                Team
                <SortIcon field="team_size" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right text-[0.6rem] uppercase tracking-[0.12em]"
                onClick={() => toggleSort("funding_raised")}
              >
                Funding
                <SortIcon field="funding_raised" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-[0.6rem] uppercase tracking-[0.12em]"
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
                <TableCell colSpan={8} className="py-12 text-center">
                  <span className="text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
                    No results // adjust parameters
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((startup) => (
                <TableRow key={startup.id} className="group border-border transition-all hover:bg-primary/[0.02] hover:shadow-[inset_0_0_30px_oklch(0.65_0.2_45/3%)]">
                  <TableCell className="w-[40px] pr-0">
                    {startup.logo_url ? (
                      <Image
                        src={startup.logo_url}
                        alt={startup.name}
                        width={28}
                        height={28}
                        className="rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-[0.6rem] font-bold text-muted-foreground uppercase">
                        {startup.name.charAt(0)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/deals/${startup.id}`}
                      className="font-medium text-sm hover:text-primary transition-colors"
                    >
                      {startup.name}
                    </Link>
                    {startup.one_liner && (
                      <p className="text-[0.65rem] text-muted-foreground truncate max-w-[200px]">
                        {startup.one_liner}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {startup.school || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[0.6rem] uppercase tracking-wider">
                      {STAGE_LABELS[startup.stage as StartupStage]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap max-w-[150px]">
                      {startup.industries?.slice(0, 2).map((ind) => (
                        <Badge key={ind} variant="outline" className="text-[0.6rem]">
                          {ind}
                        </Badge>
                      ))}
                      {(startup.industries?.length || 0) > 2 && (
                        <span className="text-[0.6rem] text-muted-foreground">
                          +{startup.industries.length - 2}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {startup.team_size}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {Number(startup.funding_raised) > 0
                      ? `$${Number(startup.funding_raised).toLocaleString()}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
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
