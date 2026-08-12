import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { PageHeader } from "@/components/page-header";
import { deriveMetaName, toIsoWeek } from "@/lib/derive";
import { prisma } from "@/lib/prisma";
import { PerfGrid, type GridCreative, type GridValues } from "./perf-grid";

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const isoWeek = week ?? toIsoWeek(new Date());

  const creatives = await prisma.creative.findMany({
    where: { status: { in: ["LIVE", "WINNER", "PAUSE"] } },
    include: { accroche: true, weeklyPerfs: { where: { isoWeek } } },
    orderBy: { code: "asc" },
  });

  const gridCreatives: GridCreative[] = creatives.map((c) => ({
    id: c.id,
    code: c.code,
    kind: c.kind,
    legacyMetaName: c.legacyMetaName,
    metaName: deriveMetaName({
      code: c.code,
      kind: c.kind,
      angle: c.angle,
      videoFormat: c.videoFormat,
      layout: c.layout,
      accrocheCode: c.accroche?.code ?? null,
      changedElement: c.changedElement,
      launchDate: c.launchDate,
    }),
  }));

  const initial: Record<string, GridValues> = {};
  let saved = 0;
  for (const c of creatives) {
    const perf = c.weeklyPerfs[0];
    if (!perf) continue;
    saved += 1;
    initial[c.id] = {
      spend: String(perf.spend),
      impressions: String(perf.impressions),
      views3s: perf.views3s === null ? "" : String(perf.views3s),
      thruplays: perf.thruplays === null ? "" : String(perf.thruplays),
      outboundClicks: String(perf.outboundClicks),
      lpViews: String(perf.lpViews),
      atc: String(perf.atc),
      checkouts: String(perf.checkouts),
      purchases: String(perf.purchases),
      revenue: String(perf.revenue),
    };
  }

  return (
    <div className="p-4">
      <PageHeader
        title="Performance"
        subtitle="Une ligne par créative en diffusion. Tab, Entrée et les flèches suffisent."
      />

      {gridCreatives.length === 0 ? (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyTitle className="text-sm">
              Aucune créative en diffusion
            </EmptyTitle>
            <EmptyDescription className="text-xs">
              Passe une créative en diffusion depuis la librairie pour la voir
              apparaître ici.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild size="sm">
              <Link href="/creative/library">Ouvrir la librairie</Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <PerfGrid
          creatives={gridCreatives}
          isoWeek={isoWeek}
          initial={initial}
          alreadySaved={saved > 0}
        />
      )}
    </div>
  );
}
