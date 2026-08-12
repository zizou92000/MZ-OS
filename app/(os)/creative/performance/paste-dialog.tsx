"use client";

import { useMemo, useState } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Textarea } from "@/components/ui/textarea";
import {
  applyMapping,
  matchCreative,
  parsePaste,
  PERF_FIELDS,
  type ColumnMapping,
  type PerfField,
} from "@/lib/paste-import";
import type { GridCreative } from "./perf-grid";

const NONE = "__none__";

export function PasteDialog({
  creatives,
  onApply,
  trigger,
}: {
  creatives: GridCreative[];
  onApply: (
    matched: Record<string, Partial<Record<string, number | null>>>,
  ) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [overrides, setOverrides] = useState<ColumnMapping>({});

  const parsed = useMemo(() => (text.trim() ? parsePaste(text) : null), [text]);
  const mapping = useMemo<ColumnMapping>(
    () => ({ ...(parsed?.mapping ?? {}), ...overrides }),
    [parsed, overrides],
  );

  const preview = useMemo(() => {
    if (!parsed) return [];
    const rows = applyMapping(parsed, mapping);
    return rows.map((row) => ({
      ...row,
      code: matchCreative(row.name, creatives),
    }));
  }, [parsed, mapping, creatives]);

  const matchedCount = preview.filter((p) => p.code).length;

  const apply = () => {
    const byCreative: Record<string, Partial<Record<string, number | null>>> = {};
    for (const row of preview) {
      if (!row.code) continue;
      const creative = creatives.find((c) => c.code === row.code);
      if (!creative) continue;
      byCreative[creative.id] = row.values;
    }
    onApply(byCreative);
    setOpen(false);
    setText("");
    setOverrides({});
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-sm">Coller un export Meta</DialogTitle>
          <DialogDescription className="text-xs">
            Colle directement depuis le gestionnaire de publicités. Les colonnes
            sont reconnues par leur en-tête ; corrige-les si besoin.
          </DialogDescription>
        </DialogHeader>

        {!parsed ? (
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="code text-xs"
            placeholder="Colle ici (Ctrl+V) — en-têtes compris."
            autoFocus
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="rounded-sm">
                {parsed.rows.length} lignes
              </Badge>
              <Badge
                variant="outline"
                className={
                  matchedCount === parsed.rows.length
                    ? "border-verdict-garder/50 text-verdict-garder rounded-sm"
                    : "border-destructive/50 text-destructive rounded-sm"
                }
              >
                {matchedCount} reconnues
              </Badge>
              <Badge variant="outline" className="rounded-sm">
                format {parsed.locale === "eu" ? "1.234,56" : "1,234.56"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 text-xs"
                onClick={() => {
                  setText("");
                  setOverrides({});
                }}
              >
                Recommencer
              </Button>
            </div>

            {parsed.unmapped.length > 0 && (
              <div className="border-destructive/40 bg-destructive/5 space-y-2 rounded-md border p-2">
                <p className="text-xs font-medium">
                  {parsed.unmapped.length} colonne
                  {parsed.unmapped.length > 1 ? "s" : ""} non reconnue
                  {parsed.unmapped.length > 1 ? "s" : ""} — indique-les
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {parsed.unmapped.map((field) => (
                    <MappingSelect
                      key={field}
                      field={field}
                      headers={parsed.headers}
                      value={mapping[field]}
                      onChange={(index) =>
                        setOverrides((o) => ({ ...o, [field]: index }))
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            <ScrollArea className="h-64 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-8 text-[11px]">Ligne</TableHead>
                    <TableHead className="h-8 text-[11px]">Créative</TableHead>
                    <TableHead className="h-8 text-right text-[11px]">
                      Spend
                    </TableHead>
                    <TableHead className="h-8 text-right text-[11px]">
                      Impr.
                    </TableHead>
                    <TableHead className="h-8 text-right text-[11px]">
                      Achats
                    </TableHead>
                    <TableHead className="h-8 text-right text-[11px]">
                      CA
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="max-w-64 truncate py-1 text-[11px]">
                        {row.name ?? "—"}
                      </TableCell>
                      <TableCell className="py-1">
                        {row.code ? (
                          <span className="text-verdict-garder inline-flex items-center gap-1">
                            <CircleCheck className="size-3" />
                            <span className="code text-[11px]">{row.code}</span>
                          </span>
                        ) : (
                          <span className="text-destructive inline-flex items-center gap-1 text-[11px]">
                            <CircleAlert className="size-3" />
                            ignorée
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="num py-1 text-right text-[11px]">
                        {row.values.spend ?? "—"}
                      </TableCell>
                      <TableCell className="num py-1 text-right text-[11px]">
                        {row.values.impressions ?? "—"}
                      </TableCell>
                      <TableCell className="num py-1 text-right text-[11px]">
                        {row.values.purchases ?? "—"}
                      </TableCell>
                      <TableCell className="num py-1 text-right text-[11px]">
                        {row.values.revenue ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button size="sm" onClick={apply} disabled={matchedCount === 0}>
            Remplir {matchedCount} ligne{matchedCount > 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MappingSelect({
  field,
  headers,
  value,
  onChange,
}: {
  field: PerfField;
  headers: string[];
  value: number | undefined;
  onChange: (index: number | undefined) => void;
}) {
  const label = PERF_FIELDS.find((f) => f.key === field)?.label ?? field;
  return (
    <div className="space-y-1">
      <Label className="text-[11px]">{label}</Label>
      <Select
        value={value === undefined ? NONE : String(value)}
        onValueChange={(v) => onChange(v === NONE ? undefined : Number(v))}
      >
        <SelectTrigger size="sm" className="h-7 w-full text-xs">
          <SelectValue placeholder="Colonne…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE} className="text-xs">
            Absente
          </SelectItem>
          {headers.map((h, i) => (
            <SelectItem key={i} value={String(i)} className="text-xs">
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
