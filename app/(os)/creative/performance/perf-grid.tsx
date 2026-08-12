"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, ClipboardPaste, Lock, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { saveWeek } from "@/lib/actions/performance";
import { shiftIsoWeek } from "@/lib/derive";
import { money, percent, ratio } from "@/lib/format";
import { deriveWeekly } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import { PasteDialog } from "./paste-dialog";

export type GridCreative = {
  id: string;
  code: string;
  metaName: string;
  legacyMetaName: string | null;
  kind: "VIDEO" | "STATIC";
};

export type GridValues = Record<string, string>;

type GridColumn = {
  key:
    | "spend"
    | "impressions"
    | "views3s"
    | "thruplays"
    | "outboundClicks"
    | "lpViews"
    | "atc"
    | "checkouts"
    | "purchases"
    | "revenue";
  label: string;
  width: string;
  videoOnly?: boolean;
};

/** Order defines the Tab path across a row — keep it the order Meta exports. */
const COLUMNS: readonly GridColumn[] = [
  { key: "spend", label: "Spend", width: "w-20" },
  { key: "impressions", label: "Impr.", width: "w-24" },
  { key: "views3s", label: "Vues 3s", width: "w-20", videoOnly: true },
  { key: "thruplays", label: "ThruPlay", width: "w-20", videoOnly: true },
  { key: "outboundClicks", label: "Clics", width: "w-20" },
  { key: "lpViews", label: "Visites", width: "w-20" },
  { key: "atc", label: "ATC", width: "w-16" },
  { key: "checkouts", label: "Checkout", width: "w-20" },
  { key: "purchases", label: "Achats", width: "w-16" },
  { key: "revenue", label: "CA", width: "w-24" },
];

type ColumnKey = GridColumn["key"];

export function PerfGrid({
  creatives,
  isoWeek,
  initial,
  alreadySaved,
}: {
  creatives: GridCreative[];
  isoWeek: string;
  initial: Record<string, GridValues>;
  alreadySaved: boolean;
}) {
  const [week, setWeek] = useState(isoWeek);
  const [values, setValues] = useState<Record<string, GridValues>>(initial);
  const [locked, setLocked] = useState(alreadySaved);
  const [pending, startTransition] = useTransition();
  const gridRef = useRef<HTMLTableSectionElement>(null);

  const setCell = useCallback(
    (creativeId: string, key: ColumnKey, value: string) =>
      setValues((prev) => ({
        ...prev,
        [creativeId]: { ...prev[creativeId], [key]: value },
      })),
    [],
  );

  /**
   * Enter moves down the column, arrows move in both axes. Tab is left to the
   * browser so the natural row-wise path still works.
   */
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const row = Number(target.dataset.row);
    const col = Number(target.dataset.col);
    if (Number.isNaN(row) || Number.isNaN(col)) return;

    const move = (dr: number, dc: number) => {
      e.preventDefault();
      const next = gridRef.current?.querySelector<HTMLInputElement>(
        `input[data-row="${row + dr}"][data-col="${col + dc}"]`,
      );
      next?.focus();
      next?.select();
    };

    if (e.key === "Enter" || (e.key === "ArrowDown" && !e.shiftKey)) move(1, 0);
    else if (e.key === "ArrowUp") move(-1, 0);
    else if (e.key === "ArrowLeft" && target.selectionStart === 0) move(0, -1);
    else if (
      e.key === "ArrowRight" &&
      target.selectionStart === target.value.length
    )
      move(0, 1);
  };

  const save = () => {
    const rows = creatives
      .map((c) => {
        const v = values[c.id] ?? {};
        const num = (k: ColumnKey) => {
          const raw = v[k];
          if (raw === undefined || raw.trim() === "") return null;
          const parsed = Number(raw.replace(",", "."));
          return Number.isFinite(parsed) ? parsed : null;
        };
        const spend = num("spend");
        const impressions = num("impressions");
        // A row with neither spend nor impressions was never filled in.
        if (spend === null && impressions === null) return null;
        return {
          creativeId: c.id,
          spend: spend ?? 0,
          impressions: impressions ?? 0,
          views3s: num("views3s"),
          thruplays: num("thruplays"),
          outboundClicks: num("outboundClicks") ?? 0,
          lpViews: num("lpViews") ?? 0,
          atc: num("atc") ?? 0,
          checkouts: num("checkouts") ?? 0,
          purchases: num("purchases") ?? 0,
          revenue: num("revenue") ?? 0,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length === 0) {
      toast.error("Aucune ligne remplie.");
      return;
    }

    startTransition(async () => {
      const res = await saveWeek({ isoWeek: week, rows });
      if (res.ok) {
        toast.success(`${res.count} lignes enregistrées pour ${week}`);
        setLocked(true);
      } else toast.error(res.error);
    });
  };

  const applyPaste = (matched: Record<string, Partial<Record<string, number | null>>>) => {
    setValues((prev) => {
      const next = { ...prev };
      for (const [creativeId, fields] of Object.entries(matched)) {
        const row: GridValues = { ...next[creativeId] };
        for (const [key, value] of Object.entries(fields)) {
          if (value !== null && value !== undefined) row[key] = String(value);
        }
        next[creativeId] = row;
      }
      return next;
    });
    setLocked(false);
  };

  const totals = useMemo(() => {
    let spend = 0;
    let revenue = 0;
    let filled = 0;
    for (const c of creatives) {
      const v = values[c.id] ?? {};
      const s = Number((v.spend ?? "").replace(",", "."));
      const r = Number((v.revenue ?? "").replace(",", "."));
      if (Number.isFinite(s) && v.spend) {
        spend += s;
        filled += 1;
      }
      if (Number.isFinite(r) && v.revenue) revenue += r;
    }
    return { spend, revenue, filled, roas: spend > 0 ? revenue / spend : null };
  }, [creatives, values]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setWeek(shiftIsoWeek(week, -1))}
          >
            <ChevronLeft className="size-4" />
            <span className="sr-only">Semaine précédente</span>
          </Button>
          <Input
            value={week}
            onChange={(e) => setWeek(e.target.value.toUpperCase())}
            className="code h-8 w-24 text-center text-sm font-medium"
          />
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setWeek(shiftIsoWeek(week, 1))}
          >
            <ChevronRight className="size-4" />
            <span className="sr-only">Semaine suivante</span>
          </Button>
        </div>

        <PasteDialog
          creatives={creatives}
          onApply={applyPaste}
          trigger={
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <ClipboardPaste className="size-3.5" />
              Coller un export Meta
            </Button>
          }
        />

        <div className="ml-auto flex items-center gap-3">
          <span className="text-muted-foreground num text-[11px]">
            {totals.filled}/{creatives.length} lignes · {money(totals.spend)} ·
            ROAS {ratio(totals.roas)}
          </span>
          {locked ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setLocked(false)}
            >
              <Pencil className="size-3.5" />
              Corriger
            </Button>
          ) : (
            <Button size="sm" className="h-8 text-xs" onClick={save} disabled={pending}>
              Enregistrer {week}
            </Button>
          )}
        </div>
      </div>

      {locked && (
        <Alert>
          <Lock />
          <AlertTitle className="text-xs">
            Semaine {week} déjà saisie — lecture seule
          </AlertTitle>
          <AlertDescription className="text-xs">
            Les chiffres existants ne peuvent pas être écrasés par inadvertance.
            Utilise « Corriger » pour les modifier volontairement.
          </AlertDescription>
        </Alert>
      )}

      <Card className="overflow-x-auto py-0">
        <Table className="min-w-[68rem]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 z-20 bg-card h-8 min-w-32 text-[11px]">Créative</TableHead>
              {COLUMNS.map((c) => (
                <TableHead
                  key={c.key}
                  className={cn("h-8 text-right text-[11px]", c.width)}
                >
                  {c.label}
                </TableHead>
              ))}
              <TableHead className="h-8 text-right text-[11px]">Hook</TableHead>
              <TableHead className="h-8 text-right text-[11px]">CTR</TableHead>
              <TableHead className="h-8 text-right text-[11px]">CPA</TableHead>
              <TableHead className="h-8 text-right text-[11px]">ROAS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody ref={gridRef}>
            {creatives.map((creative, rowIndex) => {
              const v = values[creative.id] ?? {};
              const n = (k: ColumnKey) => {
                const raw = v[k];
                if (!raw) return 0;
                const parsed = Number(raw.replace(",", "."));
                return Number.isFinite(parsed) ? parsed : 0;
              };
              const derived = deriveWeekly({
                spend: n("spend"),
                impressions: n("impressions"),
                views3s: n("views3s"),
                thruplays: n("thruplays"),
                outboundClicks: n("outboundClicks"),
                lpViews: n("lpViews"),
                atc: n("atc"),
                checkouts: n("checkouts"),
                purchases: n("purchases"),
                revenue: n("revenue"),
              });

              return (
                <TableRow key={creative.id}>
                  <TableCell className="sticky left-0 z-20 bg-card py-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="code text-xs font-medium">
                        {creative.code}
                      </span>
                      <Badge
                        variant="outline"
                        className="rounded-sm px-1 py-0 text-[9px]"
                      >
                        {creative.kind === "VIDEO" ? "V" : "S"}
                      </Badge>
                    </div>
                  </TableCell>

                  {COLUMNS.map((col, colIndex) => {
                    const disabled =
                      locked || (col.videoOnly && creative.kind !== "VIDEO");
                    return (
                      <TableCell key={col.key} className="p-0.5">
                        <input
                          type="text"
                          inputMode="decimal"
                          data-row={rowIndex}
                          data-col={colIndex}
                          disabled={disabled}
                          value={v[col.key] ?? ""}
                          onChange={(e) =>
                            setCell(creative.id, col.key, e.target.value)
                          }
                          onKeyDown={onKeyDown}
                          onFocus={(e) => e.target.select()}
                          aria-label={`${col.label} pour ${creative.code}`}
                          className={cn(
                            "num border-input/40 h-7 w-full rounded-sm border bg-transparent px-1.5 text-right text-xs",
                            // The focused cell must be unmistakable: this grid
                            // is driven entirely from the keyboard.
                            "focus:border-ring focus:bg-surface-raised focus:ring-ring focus:ring-2 focus:outline-none",
                            "disabled:cursor-not-allowed disabled:opacity-35",
                          )}
                        />
                      </TableCell>
                    );
                  })}

                  <Derived value={percent(derived.hookRate, 0)} />
                  <Derived value={percent(derived.ctr, 2)} />
                  <Derived value={money(derived.cpa, true)} />
                  <Derived value={ratio(derived.roas)} strong />
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Derived({ value, strong }: { value: string; strong?: boolean }) {
  return (
    <TableCell
      className={cn(
        "num text-muted-foreground py-0.5 text-right text-xs",
        strong && "text-foreground font-medium",
      )}
    >
      {value}
    </TableCell>
  );
}
