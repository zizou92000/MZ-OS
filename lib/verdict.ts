import type { Thresholds } from "./economics";
import type { Verdict } from "./taxonomy";

/** Below this, the sample is noise, whatever the ROAS says. */
export const MIN_SPEND = 30;
/** Above this with no verdict earned, the test has had its budget. */
export const MAX_SPEND = 60;

export type Cumulative = {
  spendCum: number;
  revenueCum: number;
};

export function cumulate(
  perfs: readonly { spend: number; revenue: number }[],
): Cumulative {
  return perfs.reduce(
    (acc, p) => ({
      spendCum: acc.spendCum + p.spend,
      revenueCum: acc.revenueCum + p.revenue,
    }),
    { spendCum: 0, revenueCum: 0 },
  );
}

export function roasCum({ spendCum, revenueCum }: Cumulative): number | null {
  if (spendCum <= 0) return null;
  return revenueCum / spendCum;
}

/**
 * Order is load-bearing: a creative above target is a WINNER even once it has
 * passed MAX_SPEND, and an under-spent creative is never judged at all.
 * Thresholds are always passed in from the active offer — never stored on the
 * creative — so re-pricing reclassifies the whole library at once.
 */
export function computeVerdict(
  cum: Cumulative,
  thresholds: Pick<
    Thresholds,
    "roasBreakEven" | "roasMinMargin" | "roasTarget"
  >,
): Verdict {
  if (cum.spendCum < MIN_SPEND) return "TEST_EN_COURS";

  const roas = roasCum(cum);
  if (roas === null) return "TEST_EN_COURS";

  const { roasTarget, roasMinMargin, roasBreakEven } = thresholds;

  if (roasTarget !== null && roas >= roasTarget) return "WINNER";
  if (roasMinMargin !== null && roas >= roasMinMargin) return "GARDER";
  if (roasBreakEven !== null && roas >= roasBreakEven) return "SOUS_MARGE";
  if (cum.spendCum >= MAX_SPEND) return "KILL";
  return "SURVEILLER";
}
