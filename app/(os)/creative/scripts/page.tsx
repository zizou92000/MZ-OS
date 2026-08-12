import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { getCreativesWithPerf } from "@/lib/queries";
import { ScriptsView, type FamilyRow, type Scene } from "./scripts-view";

export default async function ScriptsPage() {
  const [families, creatives] = await Promise.all([
    prisma.scriptFamily.findMany({
      include: { scripts: { orderBy: { creativeCode: "asc" } } },
      orderBy: { code: "asc" },
    }),
    getCreativesWithPerf(),
  ]);

  const byCode = new Map(creatives.map((c) => [c.code, c]));

  const rows: FamilyRow[] = families.map((f) => ({
    code: f.code,
    nickname: f.nickname,
    promise: f.promise,
    visibleMechanism: f.visibleMechanism,
    narrativeStructure: f.narrativeStructure,
    competitiveFrame: f.competitiveFrame,
    emotionalDriver: f.emotionalDriver,
    neverTouch: f.neverTouch,
    scripts: f.scripts.map((s) => {
      const creative = byCode.get(s.creativeCode);
      return {
        creativeCode: s.creativeCode,
        familyCode: s.familyCode,
        hypothesis: s.hypothesis,
        hookVisual: s.hookVisual,
        hookDialogue: s.hookDialogue,
        hookScreenText: s.hookScreenText,
        hookType: s.hookType,
        scenes: (s.scenes as Scene[]) ?? [],
        learning: s.learning,
        verdict: creative?.verdict ?? null,
        spendCum: creative?.spendCum ?? 0,
        roasCum: creative?.roasCum ?? null,
        killed: creative?.status === "KILL",
      };
    }),
  }));

  return (
    <div className="p-4">
      <PageHeader
        title="Scripts"
        subtitle="L'ADN d'une famille et le détail de ses plans. Une créative tuée garde sa leçon."
      />
      <Suspense fallback={<Skeleton className="h-[70vh] w-full rounded-lg" />}>
        <ScriptsView families={rows} />
      </Suspense>
    </div>
  );
}
