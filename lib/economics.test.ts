import { describe, expect, it } from "vitest";
import { computeThresholds, type OfferInput } from "./economics";

const BASE = {
  psp: 0.03,
  vat: 0,
  otherFees: 0,
  minMargin: 0.15,
  targetMargin: 0.2,
};

function offer(lines: OfferInput["lines"]): OfferInput {
  return { ...BASE, lines };
}

/**
 * The reference table. If these three fail, every verdict in the product is
 * wrong, so they are the gate for everything else.
 */
describe("conformance — reference offers", () => {
  it("offer 1: bundles 1/2/3", () => {
    const t = computeThresholds(
      offer([
        { bundle: 1, cogs: 9.08, price: 39.9, salesShare: 0.7 },
        { bundle: 2, cogs: 12.72, price: 73.9, salesShare: 0.2 },
        { bundle: 3, cogs: 15.03, price: 98.9, salesShare: 0.1 },
      ]),
    );
    expect(t.roasBreakEven).toBeCloseTo(1.29, 2);
    expect(t.roasMinMargin).toBeCloseTo(1.61, 2);
    expect(t.roasTarget).toBeCloseTo(1.75, 2);
  });

  it("offer 2: flat cogs, three price points", () => {
    const t = computeThresholds(
      offer([
        { bundle: 1, cogs: 19.9, price: 69.0, salesShare: 0.1 },
        { bundle: 1, cogs: 19.9, price: 79.99, salesShare: 0.2 },
        { bundle: 1, cogs: 19.9, price: 89.99, salesShare: 0.7 },
      ]),
    );
    expect(t.roasBreakEven).toBeCloseTo(1.35, 2);
    expect(t.roasMinMargin).toBeCloseTo(1.7, 2);
    expect(t.roasTarget).toBeCloseTo(1.86, 2);
  });

  it("offer 3: cogs scaling with price", () => {
    const t = computeThresholds(
      offer([
        { bundle: 1, cogs: 16.34, price: 69.0, salesShare: 0.1 },
        { bundle: 1, cogs: 18.08, price: 79.99, salesShare: 0.2 },
        { bundle: 1, cogs: 19.67, price: 89.99, salesShare: 0.7 },
      ]),
    );
    expect(t.roasBreakEven).toBeCloseTo(1.34, 2);
    expect(t.roasMinMargin).toBeCloseTo(1.67, 2);
    expect(t.roasTarget).toBeCloseTo(1.82, 2);
  });
});

describe("weighting", () => {
  it("normalises shares that do not sum to 1", () => {
    const asFractions = computeThresholds(
      offer([
        { bundle: 1, cogs: 10, price: 50, salesShare: 0.5 },
        { bundle: 1, cogs: 20, price: 100, salesShare: 0.5 },
      ]),
    );
    const asPercents = computeThresholds(
      offer([
        { bundle: 1, cogs: 10, price: 50, salesShare: 50 },
        { bundle: 1, cogs: 20, price: 100, salesShare: 50 },
      ]),
    );
    expect(asPercents.weightedPrice).toBeCloseTo(asFractions.weightedPrice, 10);
    expect(asPercents.roasTarget!).toBeCloseTo(asFractions.roasTarget!, 10);
  });

  it("weights toward the dominant line", () => {
    const t = computeThresholds(
      offer([
        { bundle: 1, cogs: 10, price: 40, salesShare: 0.9 },
        { bundle: 1, cogs: 10, price: 100, salesShare: 0.1 },
      ]),
    );
    expect(t.weightedPrice).toBeCloseTo(46, 10);
  });
});

describe("vat and fees", () => {
  it("strips vat from revenue before contribution", () => {
    const withVat = computeThresholds({
      ...BASE,
      vat: 0.21,
      lines: [{ bundle: 1, cogs: 10, price: 121, salesShare: 1 }],
    });
    // 121 / 1.21 = 100 net, minus 3% psp = 97, minus 10 cogs = 87
    expect(withVat.contribution).toBeCloseTo(87, 10);
  });

  it("subtracts other fees alongside psp", () => {
    const t = computeThresholds({
      ...BASE,
      otherFees: 0.02,
      lines: [{ bundle: 1, cogs: 0, price: 100, salesShare: 1 }],
    });
    expect(t.contribution).toBeCloseTo(95, 10);
  });
});

describe("unreachable margins return null, never Infinity", () => {
  it("returns null when cogs exceed net revenue", () => {
    const t = computeThresholds(
      offer([{ bundle: 1, cogs: 100, price: 50, salesShare: 1 }]),
    );
    expect(t.contribution).toBeLessThan(0);
    expect(t.roasBreakEven).toBeNull();
    expect(t.roasMinMargin).toBeNull();
    expect(t.roasTarget).toBeNull();
  });

  it("returns null for a target margin the price cannot support", () => {
    const t = computeThresholds({
      ...BASE,
      minMargin: 0.15,
      targetMargin: 0.95,
      lines: [{ bundle: 1, cogs: 40, price: 50, salesShare: 1 }],
    });
    expect(t.roasBreakEven).not.toBeNull();
    expect(t.roasTarget).toBeNull();
  });

  it("returns null when contribution is exactly zero", () => {
    const t = computeThresholds({
      psp: 0,
      vat: 0,
      otherFees: 0,
      minMargin: 0,
      targetMargin: 0,
      lines: [{ bundle: 1, cogs: 50, price: 50, salesShare: 1 }],
    });
    expect(t.contribution).toBeCloseTo(0, 10);
    expect(t.roasBreakEven).toBeNull();
  });
});

describe("degenerate offers", () => {
  it("handles an offer with no lines", () => {
    const t = computeThresholds(offer([]));
    expect(t.roasBreakEven).toBeNull();
    expect(t.weightedPrice).toBe(0);
  });

  it("handles shares that all sum to zero", () => {
    const t = computeThresholds(
      offer([{ bundle: 1, cogs: 10, price: 50, salesShare: 0 }]),
    );
    expect(t.roasBreakEven).toBeNull();
  });
});

describe("threshold ordering", () => {
  it("keeps break-even < min margin < target for a viable offer", () => {
    const t = computeThresholds(
      offer([{ bundle: 1, cogs: 9.08, price: 39.9, salesShare: 1 }]),
    );
    expect(t.roasBreakEven!).toBeLessThan(t.roasMinMargin!);
    expect(t.roasMinMargin!).toBeLessThan(t.roasTarget!);
  });
});
