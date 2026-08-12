import "server-only";
import { computeThresholds, type Thresholds } from "./economics";
import { isLegacyWeek } from "./derive";
import { prisma } from "./prisma";
import { computeVerdict, cumulate } from "./verdict";
import type { Verdict } from "./taxonomy";

export type ActiveOffer = Awaited<ReturnType<typeof getActiveOffer>>;

export async function getActiveOffer() {
  return prisma.offer.findFirst({
    where: { isActive: true },
    include: { lines: { orderBy: { position: "asc" } } },
  });
}

export async function getThresholds(): Promise<Thresholds> {
  const offer = await getActiveOffer();
  if (!offer) {
    return {
      weightedCogs: 0,
      weightedPrice: 0,
      contribution: 0,
      roasBreakEven: null,
      roasMinMargin: null,
      roasTarget: null,
    };
  }
  return computeThresholds(offer);
}

export type CreativeWithPerf = Awaited<
  ReturnType<typeof getCreativesWithPerf>
>[number];

/**
 * The library's workhorse read. Verdicts are computed here from the live
 * thresholds rather than stored, so changing the active offer reclassifies
 * everything at once.
 */
export async function getCreativesWithPerf() {
  const [creatives, thresholds] = await Promise.all([
    prisma.creative.findMany({
      include: {
        accroche: true,
        weeklyPerfs: { orderBy: { isoWeek: "asc" } },
      },
    }),
    getThresholds(),
  ]);

  return creatives.map((c) => {
    const cum = cumulate(c.weeklyPerfs);
    const verdict: Verdict = computeVerdict(cum, thresholds);
    return {
      ...c,
      spendCum: cum.spendCum,
      revenueCum: cum.revenueCum,
      roasCum: cum.spendCum > 0 ? cum.revenueCum / cum.spendCum : null,
      verdict,
      /** Weekly series for charts — legacy history is excluded by design. */
      weeklySeries: c.weeklyPerfs.filter((w) => !isLegacyWeek(w.isoWeek)),
    };
  });
}

export async function getCreativeByCode(code: string) {
  const [creative, thresholds] = await Promise.all([
    prisma.creative.findUnique({
      where: { code },
      include: {
        accroche: true,
        weeklyPerfs: { orderBy: { isoWeek: "asc" } },
        parent: { include: { accroche: true } },
        children: { include: { accroche: true }, orderBy: { code: "asc" } },
        script: { include: { family: true } },
      },
    }),
    getThresholds(),
  ]);
  if (!creative) return null;

  const cum = cumulate(creative.weeklyPerfs);
  const siblings = creative.parentCode
    ? await prisma.creative.findMany({
        where: { parentCode: creative.parentCode, NOT: { code } },
        orderBy: { code: "asc" },
      })
    : [];

  return {
    ...creative,
    siblings,
    spendCum: cum.spendCum,
    revenueCum: cum.revenueCum,
    roasCum: cum.spendCum > 0 ? cum.revenueCum / cum.spendCum : null,
    verdict: computeVerdict(cum, thresholds),
    weeklySeries: creative.weeklyPerfs.filter((w) => !isLegacyWeek(w.isoWeek)),
    thresholds,
  };
}
