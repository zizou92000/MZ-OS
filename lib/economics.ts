export type OfferLineInput = {
  bundle: number;
  cogs: number;
  price: number;
  salesShare: number;
};

export type OfferInput = {
  psp: number;
  vat: number;
  otherFees: number;
  minMargin: number;
  targetMargin: number;
  lines: OfferLineInput[];
};

export type Thresholds = {
  weightedCogs: number;
  weightedPrice: number;
  contribution: number;
  /** null when the margin is unreachable at this price — never Infinity. */
  roasBreakEven: number | null;
  roasMinMargin: number | null;
  roasTarget: number | null;
};

export const UNREACHABLE_MARGIN = "Marge inatteignable à ce prix";

/**
 * A denominator at or below zero means the target margin exceeds what the
 * price can ever contribute. There is no ROAS that reaches it, so the answer
 * is "impossible", not a very large number.
 */
function safeRoas(price: number, denominator: number): number | null {
  if (!Number.isFinite(denominator) || denominator <= 0) return null;
  const roas = price / denominator;
  return Number.isFinite(roas) ? roas : null;
}

export function computeThresholds(offer: OfferInput): Thresholds {
  const shareSum = offer.lines.reduce((sum, l) => sum + l.salesShare, 0);

  if (offer.lines.length === 0 || shareSum <= 0) {
    return {
      weightedCogs: 0,
      weightedPrice: 0,
      contribution: 0,
      roasBreakEven: null,
      roasMinMargin: null,
      roasTarget: null,
    };
  }

  const weightedCogs =
    offer.lines.reduce((sum, l) => sum + l.cogs * l.salesShare, 0) / shareSum;
  const weightedPrice =
    offer.lines.reduce((sum, l) => sum + l.price * l.salesShare, 0) / shareSum;

  const contribution =
    (weightedPrice / (1 + offer.vat)) * (1 - offer.psp - offer.otherFees) -
    weightedCogs;

  return {
    weightedCogs,
    weightedPrice,
    contribution,
    roasBreakEven: safeRoas(weightedPrice, contribution),
    roasMinMargin: safeRoas(
      weightedPrice,
      contribution - offer.minMargin * weightedPrice,
    ),
    roasTarget: safeRoas(
      weightedPrice,
      contribution - offer.targetMargin * weightedPrice,
    ),
  };
}
