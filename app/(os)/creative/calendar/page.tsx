import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";
import { isLegacyWeek } from "@/lib/derive";
import { LEAD_WEEKS, windowStatus } from "@/lib/periods";
import { prisma } from "@/lib/prisma";
import { getCreativesWithPerf } from "@/lib/queries";
import { PeriodCard, type PeriodRow } from "./period-card";

export default async function CalendarPage() {
  const [periods, creatives] = await Promise.all([
    prisma.commercialPeriod.findMany({ orderBy: { orderIndex: "asc" } }),
    getCreativesWithPerf(),
  ]);

  const { current } = windowStatus(periods, new Date());

  const rows: PeriodRow[] = periods.map((p) => {
    const inPeriod = creatives.filter((c) => c.period === p.code);

    const perYear = new Map<number, { spend: number; revenue: number }>();
    for (const c of inPeriod) {
      for (const w of c.weeklyPerfs) {
        // Legacy cumulative history has no meaningful year of its own.
        if (isLegacyWeek(w.isoWeek)) continue;
        const year = w.startDate.getFullYear();
        const acc = perYear.get(year) ?? { spend: 0, revenue: 0 };
        acc.spend += w.spend;
        acc.revenue += w.revenue;
        perYear.set(year, acc);
      }
    }

    return {
      code: p.code,
      startWeek: p.startWeek,
      endWeek: p.endWeek,
      consumerTension: p.consumerTension,
      recommendedAngle: p.recommendedAngle,
      recommendedFormat: p.recommendedFormat,
      recommendedLayout: p.recommendedLayout,
      memo: p.memo,
      relaunchNextYear: p.relaunchNextYear,
      isCurrent: current?.period.code === p.code,
      byYear: [...perYear.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([year, v]) => ({
          year,
          spend: v.spend,
          revenue: v.revenue,
          roas: v.spend > 0 ? v.revenue / v.spend : null,
        })),
      winners: inPeriod
        .filter((c) => c.verdict === "WINNER")
        .map((c) => c.code),
    };
  });

  return (
    <div className="p-4">
      <PageHeader
        title="Saisonnalité"
        subtitle="Douze fenêtres commerciales espagnoles, comparées d'une année sur l'autre."
      />

      <Alert className="mb-3">
        <Info />
        <AlertTitle className="text-xs">
          Ce sont des fenêtres de diffusion, pas des dates d&apos;événement
        </AlertTitle>
        <AlertDescription className="text-xs">
          Une créative Navidad part en W49, pas le 20 décembre. Compte{" "}
          {LEAD_WEEKS} semaines de production avant l&apos;ouverture de chaque
          fenêtre.
        </AlertDescription>
      </Alert>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <PeriodCard key={row.code} period={row} />
        ))}
      </div>
    </div>
  );
}
