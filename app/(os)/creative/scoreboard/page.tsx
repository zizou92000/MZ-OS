import { Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { money, ratio } from "@/lib/format";
import { sumWeekly } from "@/lib/metrics";
import { getCreativesWithPerf } from "@/lib/queries";
import {
  buildBlocks,
  findInvariants,
  SIGNIFICANT_SPEND,
  type ScoredItem,
} from "@/lib/scoreboard";
import {
  ACCROCHE_TYPE_LABEL,
  ANGLE_LABEL,
  CHANGED_ELEMENT_LABEL,
  LAYOUT_LABEL,
  VIDEO_FORMAT_LABEL,
} from "@/lib/taxonomy";
import { ScoreBlock } from "./score-block";

const GROUPS = [
  { value: "video", label: "Vidéo", ids: ["video-angle", "video-format", "video-accroche", "video-changed"] },
  { value: "static", label: "Statique", ids: ["static-layout", "static-angle", "static-accroche", "static-changed"] },
  { value: "compare", label: "Comparaison", ids: ["video-vs-static"] },
];

export default async function ScoreboardPage() {
  const creatives = await getCreativesWithPerf();

  const items: ScoredItem[] = creatives.map((c) => {
    const totals = sumWeekly(c.weeklyPerfs);
    return {
      kind: c.kind,
      angle: c.angle,
      videoFormat: c.videoFormat,
      layout: c.layout,
      changedElement: c.changedElement,
      accrocheType: c.accroche?.type ?? null,
      spendCum: c.spendCum,
      revenueCum: c.revenueCum,
      impressions: totals.impressions,
      views3s: totals.views3s ?? 0,
      outboundClicks: totals.outboundClicks,
    };
  });

  const blocks = buildBlocks(items, {
    angle: (k) => ANGLE_LABEL[k as keyof typeof ANGLE_LABEL] ?? k,
    videoFormat: (k) =>
      VIDEO_FORMAT_LABEL[k as keyof typeof VIDEO_FORMAT_LABEL] ?? k,
    layout: (k) => `${k} — ${LAYOUT_LABEL[k as keyof typeof LAYOUT_LABEL] ?? ""}`,
    changedElement: (k) => CHANGED_ELEMENT_LABEL[k] ?? k,
    accrocheType: (k) =>
      ACCROCHE_TYPE_LABEL[k as keyof typeof ACCROCHE_TYPE_LABEL] ?? k,
  });

  const byId = new Map(blocks.map((b) => [b.id, b]));
  const invariants = findInvariants(
    byId.get("video-accroche")?.rows ?? [],
    byId.get("static-accroche")?.rows ?? [],
  );

  return (
    <div className="p-4">
      <PageHeader
        title="Enseignements"
        subtitle={`Une ligne compte à partir de ${money(SIGNIFICANT_SPEND)} de spend cumulé. En dessous, c'est du bruit.`}
      />

      {invariants.map((inv) => (
        <Alert key={inv.key} className="border-verdict-winner/40 mb-3">
          <Sparkles className="text-verdict-winner" />
          <AlertTitle className="text-xs">
            Invariant de marché — {inv.label}
          </AlertTitle>
          <AlertDescription className="text-xs">
            Ce type d&apos;accroche gagne des deux côtés : ROAS{" "}
            <span className="num font-medium">{ratio(inv.videoRoas)}</span> en
            vidéo,{" "}
            <span className="num font-medium">{ratio(inv.staticRoas)}</span> en
            statique. Ce n&apos;est pas un effet de format, c&apos;est une
            propriété du marché espagnol. Réutilise-le sur les deux supports.
          </AlertDescription>
        </Alert>
      ))}

      <Tabs defaultValue="video">
        <TabsList className="mb-3">
          {GROUPS.map((g) => (
            <TabsTrigger key={g.value} value={g.value} className="text-xs">
              {g.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {GROUPS.map((group) => (
          <TabsContent key={group.value} value={group.value}>
            <div className="grid gap-3 xl:grid-cols-2">
              {group.ids.map((id) => {
                const block = byId.get(id);
                if (!block) return null;
                return (
                  <ScoreBlock
                    key={id}
                    block={block}
                    rateLabel={id.startsWith("static") ? "CTR" : "Hook"}
                  />
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
