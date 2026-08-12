"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { money, ratio } from "@/lib/format";
import {
  ACCROCHE_STATUS_LABEL,
  ACCROCHE_TYPE_LABEL,
  ACCROCHE_TYPES,
  type AccrocheStatus,
  type AccrocheType,
} from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

export type AccrocheCard = {
  id: string;
  code: string;
  kind: "HOOK" | "HEADLINE";
  verbatim: string;
  type: AccrocheType;
  deepDesire: string | null;
  status: AccrocheStatus;
  creativeCount: number;
  creativeCodes: string[];
  spend: number;
  revenue: number;
  roas: number | null;
  significant: boolean;
};

const ALL = "__all__";

const STATUS_TONE: Record<AccrocheStatus, string> = {
  A_TESTER: "text-muted-foreground",
  EN_TEST: "text-verdict-surveiller",
  VALIDE: "text-verdict-garder",
  MORT: "text-verdict-kill",
};

export function AccrocheGrid({ cards }: { cards: AccrocheCard[] }) {
  const focus = useSearchParams().get("focus");
  const [type, setType] = useState<string>(ALL);

  // Sorted by aggregated ROAS, never by date: the point of this table is that
  // an accroche accumulates evidence across every creative that carries it.
  const sorted = useMemo(() => {
    const filtered = type === ALL ? cards : cards.filter((c) => c.type === type);
    return [...filtered].sort((a, b) => {
      if (a.significant !== b.significant) return a.significant ? -1 : 1;
      return (b.roas ?? -1) - (a.roas ?? -1);
    });
  }, [cards, type]);

  if (cards.length === 0) {
    return (
      <Empty className="rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyTitle className="text-sm">Aucune accroche</EmptyTitle>
          <EmptyDescription className="text-xs">
            Les accroches apparaissent ici dès qu&apos;une créative en porte une.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger size="sm" className="h-8 w-44 text-xs">
            <SelectValue placeholder="Type d'accroche" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL} className="text-xs">
              Tous les types
            </SelectItem>
            {ACCROCHE_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-xs">
                {ACCROCHE_TYPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Link
          href="/creative/scoreboard"
          className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
        >
          Voir le bloc correspondant dans les enseignements
        </Link>
        <span className="text-muted-foreground num ml-auto text-[11px]">
          {sorted.length} accroche{sorted.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((card) => (
          <Card
            key={card.id}
            id={card.code}
            className={cn(
              "gap-0 py-3 transition-colors",
              focus === card.code && "border-primary",
              !card.significant && "opacity-70",
            )}
          >
            <CardContent className="space-y-2 px-3">
              <p className="text-sm leading-snug font-medium">
                « {card.verbatim} »
              </p>

              {card.deepDesire && (
                <p className="text-muted-foreground text-xs">
                  {card.deepDesire}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-1.5">
                <code className="code text-muted-foreground text-[11px]">
                  {card.code}
                </code>
                <Badge
                  variant="outline"
                  className="rounded-sm px-1 py-0 text-[10px]"
                >
                  {ACCROCHE_TYPE_LABEL[card.type]}
                </Badge>
                <span
                  className={cn("text-[10px] font-medium", STATUS_TONE[card.status])}
                >
                  {ACCROCHE_STATUS_LABEL[card.status]}
                </span>
              </div>

              <div className="border-border grid grid-cols-3 gap-1 border-t pt-2 text-center">
                <Metric label="Créatives" value={String(card.creativeCount)} />
                <Metric label="Spend" value={money(card.spend)} />
                <Metric
                  label="ROAS"
                  value={ratio(card.roas)}
                  strong={card.significant}
                />
              </div>

              {!card.significant && (
                <p className="text-muted-foreground text-[10px]">
                  Données insuffisantes pour conclure.
                </p>
              )}

              {card.creativeCodes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {card.creativeCodes.map((code) => (
                    <Link
                      key={code}
                      href={`/creative/library/${encodeURIComponent(code)}`}
                      className="code bg-muted hover:bg-accent rounded-sm px-1 py-0.5 text-[10px] transition-colors"
                    >
                      {code}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <div className="text-muted-foreground text-[9px] tracking-wide uppercase">
        {label}
      </div>
      <div className={cn("num text-sm", strong && "font-semibold")}>{value}</div>
    </div>
  );
}
