export type RawWeekly = {
  spend: number;
  impressions: number;
  views3s?: number | null;
  thruplays?: number | null;
  outboundClicks: number;
  lpViews: number;
  atc: number;
  checkouts: number;
  purchases: number;
  revenue: number;
};

export type DerivedWeekly = {
  hookRate: number | null;
  holdRate: number | null;
  ctr: number | null;
  cpm: number | null;
  clickToVisitDrop: number | null;
  cpa: number | null;
  roas: number | null;
};

function ratio(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  const value = numerator / denominator;
  return Number.isFinite(value) ? value : null;
}

export function deriveWeekly(row: RawWeekly): DerivedWeekly {
  return {
    hookRate: ratio(row.views3s ?? 0, row.impressions),
    holdRate:
      row.views3s && row.views3s > 0
        ? ratio(row.thruplays ?? 0, row.views3s)
        : null,
    ctr: ratio(row.outboundClicks, row.impressions),
    cpm: row.impressions ? (row.spend / row.impressions) * 1000 : null,
    clickToVisitDrop: row.outboundClicks
      ? 1 - row.lpViews / row.outboundClicks
      : null,
    cpa: ratio(row.spend, row.purchases),
    roas: ratio(row.revenue, row.spend),
  };
}

export function sumWeekly(rows: readonly RawWeekly[]): RawWeekly {
  return rows.reduce<RawWeekly>(
    (acc, r) => ({
      spend: acc.spend + r.spend,
      impressions: acc.impressions + r.impressions,
      views3s: (acc.views3s ?? 0) + (r.views3s ?? 0),
      thruplays: (acc.thruplays ?? 0) + (r.thruplays ?? 0),
      outboundClicks: acc.outboundClicks + r.outboundClicks,
      lpViews: acc.lpViews + r.lpViews,
      atc: acc.atc + r.atc,
      checkouts: acc.checkouts + r.checkouts,
      purchases: acc.purchases + r.purchases,
      revenue: acc.revenue + r.revenue,
    }),
    {
      spend: 0,
      impressions: 0,
      views3s: 0,
      thruplays: 0,
      outboundClicks: 0,
      lpViews: 0,
      atc: 0,
      checkouts: 0,
      purchases: 0,
      revenue: 0,
    },
  );
}
