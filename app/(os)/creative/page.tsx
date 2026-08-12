import Link from "next/link";
import {
  CalendarClock,
  CircleAlert,
  Scissors,
  Sprout,
  Target,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { isLegacyWeek, recentIsoWeeks, toIsoWeek } from "@/lib/derive";
import { money, ratio } from "@/lib/format";
import { formatWindow, LEAD_WEEKS, windowStatus } from "@/lib/periods";
import { prisma } from "@/lib/prisma";
import { getCreativesWithPerf, getThresholds } from "@/lib/queries";
import { PERIOD_LABEL, type Period, type Verdict } from "@/lib/taxonomy";
import { CutButton, IterateButton, OpenButton } from "./cockpit-actions";
import { RoasSparkline } from "./roas-sparkline";

export default async function CockpitPage() {
  const now = new Date();
  const thisWeek = toIsoWeek(now);
  const last8 = recentIsoWeeks(thisWeek, 8);

  const [creatives, thresholds, offer, periods] = await Promise.all([
    getCreativesWithPerf(),
    getThresholds(),
    prisma.offer.findFirst({ where: { isActive: true } }),
    prisma.commercialPeriod.findMany({ orderBy: { orderIndex: "asc" } }),
  ]);

  const live = creatives.filter(
    (c) => c.status === "LIVE" || c.status === "WINNER",
  );

  // Last 7 days ≈ the most recent completed ISO week.
  const lastWeek = last8.at(-1)!;
  const weekRows = creatives.flatMap((c) =>
    c.weeklyPerfs.filter((w) => w.isoWeek === lastWeek),
  );
  const spend7 = weekRows.reduce((s, w) => s + w.spend, 0);
  const revenue7 = weekRows.reduce((s, w) => s + w.revenue, 0);

  const weeklySeries = last8.map((isoWeek) => {
    const rows = creatives.flatMap((c) =>
      c.weeklyPerfs.filter((w) => w.isoWeek === isoWeek),
    );
    const spend = rows.reduce((s, w) => s + w.spend, 0);
    const revenue = rows.reduce((s, w) => s + w.revenue, 0);
    return { isoWeek, spend, roas: spend > 0 ? revenue / spend : null };
  });

  const group = (verdict: Verdict) =>
    creatives
      .filter((c) => c.verdict === verdict && c.status !== "KILL")
      .sort((a, b) => b.spendCum - a.spendCum);

  const toCut = group("KILL");
  const toIterate = group("WINNER");
  const toArbitrate = group("SOUS_MARGE");
  const pendingDecisions = toCut.length + toIterate.length + toArbitrate.length;

  const missingWeek = !creatives.some((c) =>
    c.weeklyPerfs.some((w) => w.isoWeek === thisWeek && !isLegacyWeek(w.isoWeek)),
  );
  const anyLive = live.length > 0;

  const { current, next } = windowStatus(periods, now);

  return (
    <div className="p-4">
      <PageHeader
        title="Cockpit"
        subtitle="Ce qu'il faut trancher aujourd'hui."
        actions={
          <Button asChild size="sm" className="h-7 text-xs">
            <Link href="/creative/performance">Saisir la semaine</Link>
          </Button>
        }
      />

      {missingWeek && anyLive && (
        <Alert className="border-destructive/40 mb-3">
          <CircleAlert className="text-destructive" />
          <AlertTitle className="text-xs">
            La semaine {thisWeek} n&apos;est pas saisie
          </AlertTitle>
          <AlertDescription className="text-xs">
            Sans saisie, les verdicts vieillissent et l&apos;argent continue de
            partir sur des créatives qui ne sont plus arbitrées.
            <Button asChild size="sm" variant="outline" className="mt-1.5 h-7 text-xs">
              <Link href="/creative/performance">Saisir maintenant</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-3 grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <Card className="gap-0 py-3">
            <CardContent className="px-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Counter label={`Spend ${lastWeek}`} value={money(spend7)} />
                <Counter
                  label={`ROAS ${lastWeek}`}
                  value={ratio(spend7 > 0 ? revenue7 / spend7 : null)}
                  strong
                />
                <Counter label="En diffusion" value={String(live.length)} />
                <Counter
                  label="À arbitrer"
                  value={String(pendingDecisions)}
                  strong={pendingDecisions > 0}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 py-3">
            <CardHeader className="px-4 pb-1">
              <CardTitle className="text-sm">ROAS sur 8 semaines</CardTitle>
            </CardHeader>
            <CardContent className="px-2">
              <RoasSparkline data={weeklySeries} target={thresholds.roasTarget} />
            </CardContent>
          </Card>
        </div>

        <Link href="/creative/economics" className="block rounded-xl">
          <Card className="hover:border-primary/40 h-full gap-0 py-3 transition-colors">
            <CardHeader className="px-4 pb-2">
              <CardTitle className="text-sm">
                {offer?.name ?? "Aucune offre active"}
              </CardTitle>
              <CardDescription className="text-xs">
                Les trois seuils qui décident de tout.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <Threshold label="Break-even" value={thresholds.roasBreakEven} />
                <Threshold label="Marge mini" value={thresholds.roasMinMargin} />
                <Threshold label="Cible" value={thresholds.roasTarget} />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <h2 className="mb-2 text-xs font-medium tracking-wide uppercase">
        À traiter
      </h2>
      <div className="grid gap-3 lg:grid-cols-3">
        <DecisionCard
          title="À couper"
          icon={<Scissors className="size-3.5" />}
          description="Budget consommé sans atteindre le seuil de rentabilité."
          items={toCut}
          empty="Rien à couper."
          render={(c) => <CutButton id={c.id} code={c.code} />}
        />
        <DecisionCard
          title="À itérer"
          icon={<Sprout className="size-3.5" />}
          description="Au-dessus de la cible : la lignée mérite une génération de plus."
          items={toIterate}
          empty="Aucun winner pour l'instant."
          render={(c) => (
            <IterateButton code={c.code} kind={c.kind} period={c.period} />
          )}
        />
        <DecisionCard
          title="À arbitrer"
          icon={<Target className="size-3.5" />}
          description="Rentable mais sous la marge : ni tuer, ni scaler."
          items={toArbitrate}
          empty="Aucun arbitrage en attente."
          render={(c) => <OpenButton code={c.code} />}
        />
      </div>

      <h2 className="mt-4 mb-2 text-xs font-medium tracking-wide uppercase">
        Fenêtre commerciale
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <WindowCard
          label="Période en cours"
          code={current?.period.code ?? null}
          window={current ? formatWindow(current.period) : null}
          note={
            current
              ? `En diffusion depuis ${Math.abs(current.weeksUntilStart)} semaine${Math.abs(current.weeksUntilStart) > 1 ? "s" : ""}.`
              : "Aucune fenêtre active cette semaine."
          }
        />
        <WindowCard
          label="Prochaine fenêtre"
          code={next?.period.code ?? null}
          window={next ? formatWindow(next.period) : null}
          note={
            next
              ? next.weeksUntilLaunch > 0
                ? `Les créatives doivent être en ligne dans ${next.weeksUntilLaunch} semaine${next.weeksUntilLaunch > 1 ? "s" : ""} (J−${LEAD_WEEKS * 7}).`
                : "La fenêtre de lancement est ouverte — les créatives devraient déjà être en ligne."
              : ""
          }
          urgent={next ? next.weeksUntilLaunch <= 0 : false}
        />
      </div>
    </div>
  );
}

function Counter({
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
      <div className="text-muted-foreground text-[10px] tracking-wide uppercase">
        {label}
      </div>
      <div
        className={`num mt-0.5 leading-none ${strong ? "text-xl font-semibold" : "text-lg"}`}
      >
        {value}
      </div>
    </div>
  );
}

function Threshold({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="bg-muted/40 rounded-md px-1 py-1.5">
      <div className="text-muted-foreground text-[9px] tracking-wide uppercase">
        {label}
      </div>
      <div className="num text-sm font-semibold">{ratio(value)}</div>
    </div>
  );
}

type DecisionItem = {
  id: string;
  code: string;
  spendCum: number;
  roasCum: number | null;
  verdict: Verdict;
  kind: "VIDEO" | "STATIC";
  period: Period;
};

function DecisionCard({
  title,
  icon,
  description,
  items,
  empty,
  render,
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  items: DecisionItem[];
  empty: string;
  render: (item: DecisionItem) => React.ReactNode;
}) {
  return (
    <Card className="gap-0 py-3">
      <CardHeader className="px-3 pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          {icon}
          {title}
          <Badge variant="outline" className="ml-auto rounded-sm px-1 text-[10px]">
            {items.length}
          </Badge>
        </CardTitle>
        <CardDescription className="text-[11px]">{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-2">
        {items.length === 0 ? (
          <p className="text-muted-foreground px-1 py-3 text-xs">{empty}</p>
        ) : (
          <ul className="divide-border divide-y">
            {items.slice(0, 6).map((item) => (
              <li key={item.id} className="flex items-center gap-2 px-1 py-1.5">
                <Link
                  href={`/creative/library/${encodeURIComponent(item.code)}`}
                  className="code hover:text-primary w-20 shrink-0 text-xs font-medium"
                >
                  {item.code}
                </Link>
                <span className="num text-muted-foreground text-[11px]">
                  {money(item.spendCum)}
                </span>
                <span className="num text-xs font-medium">
                  {ratio(item.roasCum)}
                </span>
                <span className="ml-auto">{render(item)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function WindowCard({
  label,
  code,
  window,
  note,
  urgent,
}: {
  label: string;
  code: Period | null;
  window: string | null;
  note: string;
  urgent?: boolean;
}) {
  return (
    <Card className="gap-0 py-3">
      <CardContent className="px-4">
        <div className="flex items-start gap-2">
          <CalendarClock
            className={`mt-0.5 size-4 shrink-0 ${urgent ? "text-destructive" : "text-muted-foreground"}`}
          />
          <div className="min-w-0">
            <div className="text-muted-foreground text-[10px] tracking-wide uppercase">
              {label}
            </div>
            <div className="text-sm font-medium">
              {code ? PERIOD_LABEL[code] : "—"}
              {window && (
                <span className="code text-muted-foreground ml-1.5 text-[11px]">
                  {window}
                </span>
              )}
            </div>
            <p
              className={`mt-0.5 text-xs ${urgent ? "text-destructive" : "text-muted-foreground"}`}
            >
              {note}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
