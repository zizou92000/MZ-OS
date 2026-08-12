"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BacklogForm } from "@/components/backlog-form";
import { deleteBacklogItem, updateBacklogStatus } from "@/lib/actions/backlog";
import {
  CHANGED_ELEMENT_LABEL,
  PERIOD_LABEL,
  PROD_STATUS_LABEL,
  PROD_STATUSES,
  PRODUCTION_TYPE_LABEL,
  type Period,
  type ProdStatus,
  type ProductionType,
} from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

export type BacklogCard = {
  id: string;
  targetCode: string | null;
  parentCode: string | null;
  creativeKind: "VIDEO" | "STATIC";
  productionType: ProductionType;
  elementToChange: string;
  hypothesis: string;
  targetPeriod: Period;
  targetWeek: string | null;
  prodStatus: ProdStatus;
};

/** The mix the operation is aiming for, from the spec. */
const TARGET_MIX: Record<ProductionType, number> = {
  ITERATION_MAJEURE: 0.5,
  ITERATION_MINEURE: 0.2,
  NEW_CONCEPT: 0.3,
};

export function Kanban({ items }: { items: BacklogCard[] }) {
  const [dragged, setDragged] = useState<string | null>(null);
  const [over, setOver] = useState<ProdStatus | null>(null);
  const [, startTransition] = useTransition();

  const move = (id: string, status: ProdStatus) => {
    const item = items.find((i) => i.id === id);
    if (!item || item.prodStatus === status) return;
    startTransition(async () => {
      const res = await updateBacklogStatus(id, status);
      if (res.ok) toast.success(`${item.targetCode ?? "Élément"} → ${PROD_STATUS_LABEL[status]}`);
      else toast.error(res.error);
    });
  };

  return (
    <div className="space-y-3">
      <MixGauge items={items} />

      <div className="grid gap-2 lg:grid-cols-6">
        {PROD_STATUSES.map((status) => {
          const column = items.filter((i) => i.prodStatus === status);
          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(status);
              }}
              onDragLeave={() => setOver((s) => (s === status ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                if (dragged) move(dragged, status);
                setDragged(null);
              }}
              className={cn(
                "bg-surface/40 min-h-40 rounded-lg border p-1.5 transition-colors",
                over === status && "border-primary bg-primary/5",
              )}
            >
              <div className="mb-1.5 flex items-center gap-1.5 px-1">
                <span className="text-[11px] font-medium">
                  {PROD_STATUS_LABEL[status]}
                </span>
                <Badge
                  variant="outline"
                  className="ml-auto rounded-sm px-1 py-0 text-[9px]"
                >
                  {column.length}
                </Badge>
              </div>

              <div className="space-y-1.5">
                {column.map((item) => (
                  <KanbanCard
                    key={item.id}
                    item={item}
                    onDragStart={() => setDragged(item.id)}
                    onDragEnd={() => setDragged(null)}
                    onMove={move}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanCard({
  item,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  item: BacklogCard;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMove: (id: string, status: ProdStatus) => void;
}) {
  const [pending, startTransition] = useTransition();
  const index = PROD_STATUSES.indexOf(item.prodStatus);

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="cursor-grab gap-0 py-2 active:cursor-grabbing"
    >
      <CardContent className="space-y-1.5 px-2">
        <div className="flex items-center gap-1">
          <code className="code text-[11px] font-medium">
            {item.targetCode ?? "—"}
          </code>
          <Badge
            variant="outline"
            className="rounded-sm px-1 py-0 text-[9px]"
          >
            {item.creativeKind === "VIDEO" ? "V" : "S"}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto size-5"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await deleteBacklogItem(item.id);
                toast.success("Élément retiré");
              })
            }
          >
            <Trash2 className="size-3" />
            <span className="sr-only">Retirer</span>
          </Button>
        </div>

        {item.parentCode && (
          <div className="text-muted-foreground code text-[10px]">
            ← {item.parentCode}
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          <Badge
            variant="secondary"
            className="rounded-sm px-1 py-0 text-[9px] font-normal"
          >
            {CHANGED_ELEMENT_LABEL[item.elementToChange] ?? item.elementToChange}
          </Badge>
          <Badge
            variant="outline"
            className="rounded-sm px-1 py-0 text-[9px] font-normal"
          >
            {PERIOD_LABEL[item.targetPeriod]}
          </Badge>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-muted-foreground line-clamp-3 cursor-help text-[11px] leading-snug">
              {item.hypothesis}
            </p>
          </TooltipTrigger>
          <TooltipContent className="max-w-72">
            <span className="text-xs">{item.hypothesis}</span>
          </TooltipContent>
        </Tooltip>

        {/* Keyboard path for moving a card without a mouse. */}
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-5 flex-1 px-1 text-[10px]"
            disabled={index === 0}
            onClick={() => onMove(item.id, PROD_STATUSES[index - 1])}
          >
            ←
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-5 flex-1 px-1 text-[10px]"
            disabled={index === PROD_STATUSES.length - 1}
            onClick={() => onMove(item.id, PROD_STATUSES[index + 1])}
          >
            →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MixGauge({ items }: { items: BacklogCard[] }) {
  const total = items.length;

  return (
    <Card className="gap-0 py-3">
      <CardContent className="px-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium">Ratio de production</span>
          <BacklogForm
            trigger={
              <Button size="sm" className="h-7 gap-1.5 text-xs">
                <Plus className="size-3.5" />
                Ajouter
              </Button>
            }
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(TARGET_MIX) as ProductionType[]).map((type) => {
            const count = items.filter((i) => i.productionType === type).length;
            const actual = total > 0 ? count / total : 0;
            const target = TARGET_MIX[type];
            return (
              <div key={type}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-[11px]">
                    {PRODUCTION_TYPE_LABEL[type]}
                  </span>
                  <span className="num text-[11px]">
                    <span className="font-medium">
                      {Math.round(actual * 100)} %
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      / {Math.round(target * 100)} %
                    </span>
                  </span>
                </div>
                <Progress value={actual * 100} className="h-1.5" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
