import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { SIGNIFICANT_SPEND } from "@/lib/scoreboard";
import { money } from "@/lib/format";
import { getCreativesWithPerf } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { AccrocheGrid, type AccrocheCard } from "./accroche-grid";

export default async function HooksPage() {
  const [accroches, creatives] = await Promise.all([
    prisma.accroche.findMany({ orderBy: { code: "asc" } }),
    getCreativesWithPerf(),
  ]);

  const cards: AccrocheCard[] = accroches.map((a) => {
    const used = creatives.filter((c) => c.accrocheId === a.id);
    const spend = used.reduce((s, c) => s + c.spendCum, 0);
    const revenue = used.reduce((s, c) => s + c.revenueCum, 0);
    return {
      id: a.id,
      code: a.code,
      kind: a.kind,
      verbatim: a.verbatim,
      type: a.type,
      deepDesire: a.deepDesire,
      status: a.status,
      creativeCount: used.length,
      creativeCodes: used.map((c) => c.code),
      spend,
      revenue,
      roas: spend > 0 ? revenue / spend : null,
      significant: spend >= SIGNIFICANT_SPEND,
    };
  });

  return (
    <div className="p-4">
      <PageHeader
        title="Accroches"
        subtitle={`Une accroche portée par plusieurs créatives franchit le seuil de ${money(SIGNIFICANT_SPEND)} qu'aucune ne franchit seule.`}
      />

      <Tabs defaultValue="HOOK">
        <TabsList className="mb-3">
          <TabsTrigger value="HOOK" className="text-xs">
            Hooks vidéo
          </TabsTrigger>
          <TabsTrigger value="HEADLINE" className="text-xs">
            Titres statiques
          </TabsTrigger>
        </TabsList>

        {/* AccrocheGrid reads ?focus= from the URL, so it needs a boundary. */}
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
          <TabsContent value="HOOK">
            <AccrocheGrid cards={cards.filter((c) => c.kind === "HOOK")} />
          </TabsContent>
          <TabsContent value="HEADLINE">
            <AccrocheGrid cards={cards.filter((c) => c.kind === "HEADLINE")} />
          </TabsContent>
        </Suspense>
      </Tabs>
    </div>
  );
}
