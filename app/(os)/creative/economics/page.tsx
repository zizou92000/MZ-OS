import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { isLegacyWeek } from "@/lib/derive";
import { deriveWeekly, sumWeekly } from "@/lib/metrics";
import { prisma } from "@/lib/prisma";
import { getThresholds } from "@/lib/queries";
import { OfferEditor } from "./offer-editor";
import { Simulator, type RealBaseline } from "./simulator";

export default async function EconomicsPage() {
  const [offers, scenarios, thresholds, perfs] = await Promise.all([
    prisma.offer.findMany({
      include: { lines: { orderBy: { position: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.simulationScenario.findMany({ orderBy: { createdAt: "desc" } }),
    getThresholds(),
    prisma.weeklyPerf.findMany({ orderBy: { isoWeek: "asc" } }),
  ]);

  const real = buildBaseline(perfs);

  return (
    <div className="p-4">
      <PageHeader
        title="Économie"
        subtitle="L'offre active fixe les seuils. Les seuils fixent les verdicts."
      />

      <Tabs defaultValue="offers">
        <TabsList className="mb-4">
          <TabsTrigger value="offers" className="text-xs">
            Offres
          </TabsTrigger>
          <TabsTrigger value="simulator" className="text-xs">
            Simulateur
          </TabsTrigger>
        </TabsList>

        <TabsContent value="offers">
          <OfferEditor offers={offers} />
        </TabsContent>

        <TabsContent value="simulator">
          <Simulator
            roasTarget={thresholds.roasTarget}
            scenarios={scenarios}
            real={real}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type PerfRow = Awaited<ReturnType<typeof prisma.weeklyPerf.findMany>>[number];

/**
 * The "real" column comes from what was actually entered, so the simulator is
 * always read against observed behaviour rather than against itself.
 */
function buildBaseline(perfs: PerfRow[]): RealBaseline {
  if (perfs.length === 0) return null;

  const total = sumWeekly(perfs);
  const derived = deriveWeekly(total);

  const weeks = [...new Set(perfs.map((p) => p.isoWeek))]
    .filter((w) => !isLegacyWeek(w))
    .sort();
  const previousWeek = weeks.at(-2);
  const previous = previousWeek
    ? deriveWeekly(sumWeekly(perfs.filter((p) => p.isoWeek === previousWeek)))
    : null;

  return {
    spend: total.spend,
    cpm: derived.cpm,
    ctr: derived.ctr,
    clickToVisitDrop: derived.clickToVisitDrop,
    cvr: total.lpViews > 0 ? total.purchases / total.lpViews : null,
    aov: total.purchases > 0 ? total.revenue / total.purchases : null,
    roas: derived.roas,
    previousCpm: previous?.cpm ?? null,
    previousCtr: previous?.ctr ?? null,
  };
}
