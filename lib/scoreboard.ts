import type { AccrocheType, Angle, Layout, VideoFormat } from "./taxonomy";

/**
 * A scoreboard row aggregates several creatives, so it needs more spend than
 * a single creative's MIN_SPEND before it says anything. Roughly four tested
 * creatives' worth: below this the ranking is noise, and the screen's main
 * danger is manufacturing conclusions out of noise.
 */
export const SIGNIFICANT_SPEND = 150;

export type ScoredItem = {
  kind: "VIDEO" | "STATIC";
  angle: Angle;
  videoFormat: VideoFormat | null;
  layout: Layout | null;
  changedElement: string | null;
  accrocheType: AccrocheType | null;
  spendCum: number;
  revenueCum: number;
  impressions: number;
  views3s: number;
  outboundClicks: number;
};

export type ScoreRow = {
  key: string;
  label: string;
  count: number;
  spend: number;
  revenue: number;
  roas: number | null;
  hookRate: number | null;
  ctr: number | null;
  significant: boolean;
};

function aggregate(
  items: readonly ScoredItem[],
  keyOf: (item: ScoredItem) => string | null,
  labelOf: (key: string) => string,
): ScoreRow[] {
  const buckets = new Map<string, ScoredItem[]>();
  for (const item of items) {
    const key = keyOf(item);
    if (key === null) continue;
    const list = buckets.get(key) ?? [];
    list.push(item);
    buckets.set(key, list);
  }

  const rows: ScoreRow[] = [];
  for (const [key, list] of buckets) {
    const spend = list.reduce((s, i) => s + i.spendCum, 0);
    const revenue = list.reduce((s, i) => s + i.revenueCum, 0);
    const impressions = list.reduce((s, i) => s + i.impressions, 0);
    const views3s = list.reduce((s, i) => s + i.views3s, 0);
    const clicks = list.reduce((s, i) => s + i.outboundClicks, 0);
    rows.push({
      key,
      label: labelOf(key),
      count: list.length,
      spend,
      revenue,
      roas: spend > 0 ? revenue / spend : null,
      hookRate: impressions > 0 ? views3s / impressions : null,
      ctr: impressions > 0 ? clicks / impressions : null,
      significant: spend >= SIGNIFICANT_SPEND,
    });
  }
  return rows;
}

/**
 * Significant rows rank first and by ROAS; insufficient rows always sink to
 * the bottom regardless of how flattering their ratio looks.
 */
export function sortRows(rows: readonly ScoreRow[]): ScoreRow[] {
  return [...rows].sort((a, b) => {
    if (a.significant !== b.significant) return a.significant ? -1 : 1;
    if (!a.significant && !b.significant) return b.spend - a.spend;
    return (b.roas ?? -1) - (a.roas ?? -1);
  });
}

export type ScoreBlock = {
  id: string;
  title: string;
  hint: string;
  rows: ScoreRow[];
};

export function buildBlocks(
  items: readonly ScoredItem[],
  labels: {
    angle: (k: string) => string;
    videoFormat: (k: string) => string;
    layout: (k: string) => string;
    changedElement: (k: string) => string;
    accrocheType: (k: string) => string;
  },
): ScoreBlock[] {
  const videos = items.filter((i) => i.kind === "VIDEO");
  const statics = items.filter((i) => i.kind === "STATIC");

  const block = (
    id: string,
    title: string,
    hint: string,
    source: readonly ScoredItem[],
    keyOf: (i: ScoredItem) => string | null,
    labelOf: (k: string) => string,
  ): ScoreBlock => ({
    id,
    title,
    hint,
    rows: sortRows(aggregate(source, keyOf, labelOf)),
  });

  return [
    block(
      "video-angle",
      "Vidéo par angle",
      "Quel désir profond porte le mieux en vidéo.",
      videos,
      (i) => i.angle,
      labels.angle,
    ),
    block(
      "video-format",
      "Vidéo par format",
      "Quelle mise en scène convertit.",
      videos,
      (i) => i.videoFormat,
      labels.videoFormat,
    ),
    block(
      "video-changed",
      "Vidéo par élément changé",
      "Quels leviers d'itération paient réellement.",
      videos,
      (i) => i.changedElement,
      labels.changedElement,
    ),
    block(
      "video-accroche",
      "Vidéo par type d'accroche",
      "Quelle famille de hook retient l'attention.",
      videos,
      (i) => i.accrocheType,
      labels.accrocheType,
    ),
    block(
      "static-layout",
      "Statique par layout",
      "Quelle composition fonctionne.",
      statics,
      (i) => i.layout,
      labels.layout,
    ),
    block(
      "static-angle",
      "Statique par angle",
      "Le même axe que la vidéo, sur l'image fixe.",
      statics,
      (i) => i.angle,
      labels.angle,
    ),
    block(
      "static-accroche",
      "Statique par type d'accroche",
      "Quelle famille de titre fonctionne.",
      statics,
      (i) => i.accrocheType,
      labels.accrocheType,
    ),
    block(
      "static-changed",
      "Statique par élément changé",
      "Quels leviers d'itération paient sur le statique.",
      statics,
      (i) => i.changedElement,
      labels.changedElement,
    ),
    {
      id: "video-vs-static",
      title: "Vidéo contre statique",
      hint: "Où mettre l'effort de production.",
      rows: sortRows(
        aggregate(
          items,
          (i) => i.kind,
          (k) => (k === "VIDEO" ? "Vidéo" : "Statique"),
        ),
      ),
    },
  ];
}

export type Invariant = {
  key: string;
  label: string;
  videoRoas: number;
  staticRoas: number;
};

/**
 * A hook type that wins on both video and static is not a format trick — it
 * is a property of the market. This is the rarest and most reusable thing the
 * system can produce, so it only counts when both sides are significant.
 */
export function findInvariants(
  videoAccroche: readonly ScoreRow[],
  staticAccroche: readonly ScoreRow[],
): Invariant[] {
  const topVideo = bestSignificant(videoAccroche);
  const topStatic = bestSignificant(staticAccroche);
  if (!topVideo || !topStatic || topVideo.key !== topStatic.key) return [];
  return [
    {
      key: topVideo.key,
      label: topVideo.label,
      videoRoas: topVideo.roas ?? 0,
      staticRoas: topStatic.roas ?? 0,
    },
  ];
}

function bestSignificant(rows: readonly ScoreRow[]): ScoreRow | null {
  const eligible = rows.filter((r) => r.significant && r.roas !== null);
  if (eligible.length === 0) return null;
  return eligible.reduce((best, r) => ((r.roas ?? 0) > (best.roas ?? 0) ? r : best));
}
