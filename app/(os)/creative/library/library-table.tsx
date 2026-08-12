"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  useTable,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, ListTree, Rows3 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LineageThread } from "@/components/lineage-thread";
import { VerdictBadge } from "@/components/verdict-badge";
import { bulkSetStatus } from "@/lib/actions/creatives";
import { money, ratio } from "@/lib/format";
import { buildTree } from "@/lib/lineage";
import {
  ANGLE_LABEL,
  CREATIVE_STATUS_LABEL,
  CREATIVE_STATUSES,
  PERIOD_LABEL,
  VERDICT_LABEL,
  VERDICTS,
  VIDEO_FORMAT_LABEL,
  type Angle,
  type CreativeStatus,
  type Layout,
  type Period,
  type Verdict,
  type VideoFormat,
} from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

export type LibraryRow = {
  id: string;
  code: string;
  kind: "VIDEO" | "STATIC";
  angle: Angle;
  videoFormat: VideoFormat | null;
  layout: Layout | null;
  accrocheCode: string | null;
  accrocheVerbatim: string | null;
  period: Period;
  status: CreativeStatus;
  metaName: string;
  spendCum: number;
  roasCum: number | null;
  verdict: Verdict;
};

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
});

const helper = createColumnHelper<typeof features, LibraryRow>();

const ALL = "__all__";

export function LibraryTable({ rows }: { rows: LibraryRow[] }) {
  const [view, setView] = useState<"tree" | "flat">("tree");
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<string>(ALL);
  const [verdict, setVerdict] = useState<string>(ALL);
  const [angle, setAngle] = useState<string>(ALL);
  const [period, setPeriod] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (kind !== ALL && r.kind !== kind) return false;
      if (verdict !== ALL && r.verdict !== verdict) return false;
      if (angle !== ALL && r.angle !== angle) return false;
      if (period !== ALL && r.period !== period) return false;
      if (status !== ALL && r.status !== status) return false;
      if (!q) return true;
      return (
        r.code.toLowerCase().includes(q) ||
        r.metaName.toLowerCase().includes(q) ||
        (r.accrocheVerbatim?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [rows, search, kind, verdict, angle, period, status]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const applyStatus = (value: CreativeStatus) =>
    startTransition(async () => {
      const res = await bulkSetStatus([...selected], value);
      if (res.ok) {
        toast.success(
          `${selected.size} créative${selected.size > 1 ? "s" : ""} → ${CREATIVE_STATUS_LABEL[value]}`,
        );
        setSelected(new Set());
      } else toast.error(res.error);
    });

  const hasFilters =
    search.trim() !== "" ||
    [kind, verdict, angle, period, status].some((f) => f !== ALL);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Code, nom Meta, verbatim…"
          className="h-8 w-56 text-xs"
        />
        <FilterSelect
          value={kind}
          onChange={setKind}
          placeholder="Type"
          options={[
            { value: "VIDEO", label: "Vidéo" },
            { value: "STATIC", label: "Statique" },
          ]}
        />
        <FilterSelect
          value={verdict}
          onChange={setVerdict}
          placeholder="Verdict"
          options={VERDICTS.map((v) => ({ value: v, label: VERDICT_LABEL[v] }))}
        />
        <FilterSelect
          value={angle}
          onChange={setAngle}
          placeholder="Angle"
          options={Object.entries(ANGLE_LABEL).map(([value, label]) => ({
            value,
            label,
          }))}
        />
        <FilterSelect
          value={period}
          onChange={setPeriod}
          placeholder="Période"
          options={Object.entries(PERIOD_LABEL).map(([value, label]) => ({
            value,
            label,
          }))}
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          placeholder="Statut"
          options={CREATIVE_STATUSES.map((s) => ({
            value: s,
            label: CREATIVE_STATUS_LABEL[s],
          }))}
        />

        <div className="ml-auto flex items-center gap-2">
          <span className="text-muted-foreground num text-[11px]">
            {filtered.length} / {rows.length}
          </span>
          <ToggleGroup
            type="single"
            size="sm"
            value={view}
            onValueChange={(v) => v && setView(v as "tree" | "flat")}
            variant="outline"
          >
            <ToggleGroupItem value="tree" aria-label="Vue arborescente">
              <ListTree className="size-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="flat" aria-label="Vue plate">
              <Rows3 className="size-3.5" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {selected.size > 0 && (
        <Card className="flex flex-row items-center gap-2 px-3 py-2">
          <span className="text-xs font-medium">
            {selected.size} sélectionnée{selected.size > 1 ? "s" : ""}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={pending}
              onClick={() => applyStatus("KILL")}
            >
              Couper
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={pending}
              onClick={() => applyStatus("PAUSE")}
            >
              Mettre en pause
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={pending}
              onClick={() => applyStatus("LIVE")}
            >
              Remettre en diffusion
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setSelected(new Set())}
            >
              Annuler
            </Button>
          </div>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyTitle className="text-sm">
              {rows.length === 0
                ? "Aucune créative"
                : "Rien ne correspond à ces filtres"}
            </EmptyTitle>
            <EmptyDescription className="text-xs">
              {rows.length === 0
                ? "Commence par définir ton offre, puis enregistre ta première créative."
                : "Élargis la recherche pour retrouver tes créatives."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {rows.length === 0 ? (
              <Button asChild size="sm">
                <Link href="/creative/economics">Définir l&apos;offre</Link>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setKind(ALL);
                  setVerdict(ALL);
                  setAngle(ALL);
                  setPeriod(ALL);
                  setStatus(ALL);
                }}
                disabled={!hasFilters}
              >
                Effacer les filtres
              </Button>
            )}
          </EmptyContent>
        </Empty>
      ) : view === "tree" ? (
        <TreeView rows={filtered} selected={selected} onToggle={toggle} />
      ) : (
        <FlatView rows={filtered} selected={selected} onToggle={toggle} />
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className="h-8 w-auto min-w-24 text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL} className="text-xs">
          {placeholder} · tout
        </SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AccrocheCell({
  code,
  verbatim,
}: {
  code: string | null;
  verbatim: string | null;
}) {
  if (!code) return <span className="text-muted-foreground text-[11px]">—</span>;
  if (!verbatim) {
    return <span className="code text-muted-foreground text-[11px]">{code}</span>;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="code text-muted-foreground cursor-help text-[11px] underline decoration-dotted underline-offset-2">
          {code}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-72">
        <span className="text-xs">{verbatim}</span>
      </TooltipContent>
    </Tooltip>
  );
}

function slotLabel(row: LibraryRow) {
  if (row.kind === "VIDEO") {
    return row.videoFormat ? VIDEO_FORMAT_LABEL[row.videoFormat] : "—";
  }
  return row.layout ?? "—";
}

function TreeView({
  rows,
  selected,
  onToggle,
}: {
  rows: LibraryRow[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const tree = useMemo(() => buildTree(rows, (r) => r.code), [rows]);

  return (
    <Card className="overflow-hidden py-0">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-8 w-8" />
            <TableHead className="h-8 text-[11px]">Lignée</TableHead>
            <TableHead className="h-8 text-[11px]">Angle</TableHead>
            <TableHead className="h-8 text-[11px]">Format</TableHead>
            <TableHead className="h-8 text-[11px]">Accroche</TableHead>
            <TableHead className="h-8 text-right text-[11px]">Spend</TableHead>
            <TableHead className="h-8 text-right text-[11px]">ROAS</TableHead>
            <TableHead className="h-8 text-[11px]">Verdict</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tree.map((node) => (
            <TableRow key={node.item.id} className="group">
              <TableCell className="py-1 pr-0">
                <Checkbox
                  checked={selected.has(node.item.id)}
                  onCheckedChange={() => onToggle(node.item.id)}
                  aria-label={`Sélectionner ${node.code}`}
                  className="size-3.5"
                />
              </TableCell>
              <TableCell className="py-1">
                <div className="flex items-center">
                  <LineageThread
                    depth={node.depth}
                    guides={node.guides}
                    isLast={node.isLast}
                    hasChildren={node.hasChildren}
                    className="min-h-7"
                  />
                  <Link
                    href={`/creative/library/${encodeURIComponent(node.code)}`}
                    className="code hover:text-primary ml-1 text-xs font-medium"
                  >
                    {node.code}
                  </Link>
                  <Badge
                    variant="outline"
                    className="ml-1.5 rounded-sm px-1 py-0 text-[9px]"
                  >
                    {node.item.kind === "VIDEO" ? "V" : "S"}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="py-1 text-xs">
                {ANGLE_LABEL[node.item.angle]}
              </TableCell>
              <TableCell className="py-1 text-xs">
                {slotLabel(node.item)}
              </TableCell>
              <TableCell className="max-w-52 py-1">
                <AccrocheCell
                  code={node.item.accrocheCode}
                  verbatim={node.item.accrocheVerbatim}
                />
              </TableCell>
              <TableCell className="num py-1 text-right text-xs">
                {money(node.item.spendCum)}
              </TableCell>
              <TableCell className="num py-1 text-right text-xs font-medium">
                {ratio(node.item.roasCum)}
              </TableCell>
              <TableCell className="py-1">
                <VerdictBadge verdict={node.item.verdict} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function FlatView({
  rows,
  selected,
  onToggle,
}: {
  rows: LibraryRow[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "spendCum", desc: true },
  ]);

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor("code", {
          header: "Code",
          sortFn: "alphanumeric",
          cell: ({ row }) => (
            <Link
              href={`/creative/library/${encodeURIComponent(row.original.code)}`}
              className="code hover:text-primary text-xs font-medium"
            >
              {row.original.code}
            </Link>
          ),
        }),
        helper.accessor("metaName", {
          header: "Nom Meta",
          sortFn: "alphanumeric",
          cell: ({ row }) => (
            <span className="code text-muted-foreground text-[11px]">
              {row.original.metaName}
            </span>
          ),
        }),
        helper.accessor("angle", {
          header: "Angle",
          sortFn: "alphanumeric",
          cell: ({ row }) => (
            <span className="text-xs">{ANGLE_LABEL[row.original.angle]}</span>
          ),
        }),
        helper.accessor((r) => slotLabel(r), {
          id: "slot",
          header: "Format",
          sortFn: "alphanumeric",
          cell: ({ row }) => (
            <span className="text-xs">{slotLabel(row.original)}</span>
          ),
        }),
        helper.accessor("accrocheCode", {
          header: "Accroche",
          sortFn: "alphanumeric",
          cell: ({ row }) => (
            <span className="code text-muted-foreground text-[11px]">
              {row.original.accrocheCode ?? "—"}
            </span>
          ),
        }),
        helper.accessor("spendCum", {
          header: "Spend",
          sortFn: "basic",
          cell: ({ row }) => (
            <span className="num text-xs">{money(row.original.spendCum)}</span>
          ),
        }),
        helper.accessor((r) => r.roasCum ?? -1, {
          id: "roasCum",
          header: "ROAS",
          sortFn: "basic",
          cell: ({ row }) => (
            <span className="num text-xs font-medium">
              {ratio(row.original.roasCum)}
            </span>
          ),
        }),
        helper.accessor("verdict", {
          header: "Verdict",
          sortFn: "alphanumeric",
          cell: ({ row }) => <VerdictBadge verdict={row.original.verdict} />,
        }),
      ]),
    [],
  );

  const table = useTable({
    features,
    columns,
    data: rows,
    state: { sorting },
    onSortingChange: setSorting,
    enableSortingRemoval: false,
  });

  const numeric = new Set(["spendCum", "roasCum"]);

  return (
    <Card className="overflow-hidden py-0">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="hover:bg-transparent">
              <TableHead className="h-8 w-8" />
              {group.headers.map((header) => {
                const dir = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "h-8 text-[11px]",
                      numeric.has(header.column.id) && "text-right",
                    )}
                  >
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      className={cn(
                        "hover:text-foreground inline-flex items-center gap-1",
                        numeric.has(header.column.id) && "flex-row-reverse",
                      )}
                    >
                      <table.FlexRender header={header} />
                      {dir === "asc" ? (
                        <ArrowUp className="size-3" />
                      ) : dir === "desc" ? (
                        <ArrowDown className="size-3" />
                      ) : (
                        <ChevronsUpDown className="size-3 opacity-30" />
                      )}
                    </button>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="py-1 pr-0">
                <Checkbox
                  checked={selected.has(row.original.id)}
                  onCheckedChange={() => onToggle(row.original.id)}
                  aria-label={`Sélectionner ${row.original.code}`}
                  className="size-3.5"
                />
              </TableCell>
              {row.getAllCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cn(
                    "py-1",
                    numeric.has(cell.column.id) && "text-right",
                  )}
                >
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
