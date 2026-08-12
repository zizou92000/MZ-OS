import { describe, expect, it } from "vitest";
import { computeThresholds } from "./economics";
import { computeVerdict, cumulate, MAX_SPEND, MIN_SPEND } from "./verdict";

// Offer 1 from the reference table: BE 1.29 / min 1.61 / target 1.75.
const T = computeThresholds({
  psp: 0.03,
  vat: 0,
  otherFees: 0,
  minMargin: 0.15,
  targetMargin: 0.2,
  lines: [
    { bundle: 1, cogs: 9.08, price: 39.9, salesShare: 0.7 },
    { bundle: 2, cogs: 12.72, price: 73.9, salesShare: 0.2 },
    { bundle: 3, cogs: 15.03, price: 98.9, salesShare: 0.1 },
  ],
});

function at(spend: number, roas: number) {
  return computeVerdict({ spendCum: spend, revenueCum: spend * roas }, T);
}

describe("spend gate", () => {
  it("withholds judgement below the minimum spend", () => {
    expect(at(MIN_SPEND - 0.01, 5)).toBe("TEST_EN_COURS");
    expect(at(0, 0)).toBe("TEST_EN_COURS");
  });

  it("starts judging exactly at the minimum spend", () => {
    expect(at(MIN_SPEND, 5)).toBe("WINNER");
  });
});

describe("cascade order", () => {
  it("WINNER at or above target", () => {
    expect(at(50, 1.75)).toBe("WINNER");
    expect(at(50, 2.5)).toBe("WINNER");
  });

  it("GARDER between min margin and target", () => {
    expect(at(50, T.roasMinMargin!)).toBe("GARDER");
    expect(at(50, T.roasTarget! - 0.001)).toBe("GARDER");
  });

  it("SOUS_MARGE between break-even and min margin", () => {
    expect(at(50, T.roasBreakEven!)).toBe("SOUS_MARGE");
    expect(at(50, T.roasMinMargin! - 0.001)).toBe("SOUS_MARGE");
  });

  it("treats each threshold as inclusive at its exact value", () => {
    expect(at(50, T.roasTarget!)).toBe("WINNER");
    expect(at(50, T.roasTarget! - 0.001)).not.toBe("WINNER");
    expect(at(50, T.roasBreakEven! - 0.001)).not.toBe("SOUS_MARGE");
  });

  it("SURVEILLER below break-even while budget remains", () => {
    expect(at(50, 1.0)).toBe("SURVEILLER");
  });

  it("KILL below break-even once the budget is spent", () => {
    expect(at(MAX_SPEND, 1.0)).toBe("KILL");
    expect(at(120, 0.2)).toBe("KILL");
  });

  it("keeps a profitable creative even past max spend", () => {
    expect(at(500, 1.8)).toBe("WINNER");
    expect(at(500, 1.65)).toBe("GARDER");
    expect(at(500, 1.35)).toBe("SOUS_MARGE");
  });
});

describe("thresholds come from the offer, not from the creative", () => {
  it("reclassifies the same numbers when the offer changes", () => {
    // ROAS 1.68 clears offer 1's min margin (1.607) but not offer 2's (1.700).
    const cum = { spendCum: 100, revenueCum: 168 };
    expect(computeVerdict(cum, T)).toBe("GARDER");

    // Offer 2: BE 1.35 / min 1.70 / target 1.86.
    const t2 = computeThresholds({
      psp: 0.03,
      vat: 0,
      otherFees: 0,
      minMargin: 0.15,
      targetMargin: 0.2,
      lines: [
        { bundle: 1, cogs: 19.9, price: 69.0, salesShare: 0.1 },
        { bundle: 1, cogs: 19.9, price: 79.99, salesShare: 0.2 },
        { bundle: 1, cogs: 19.9, price: 89.99, salesShare: 0.7 },
      ],
    });
    expect(computeVerdict(cum, t2)).toBe("SOUS_MARGE");
  });

  it("falls through to spend rules when the offer has no reachable margin", () => {
    const unreachable = {
      roasBreakEven: null,
      roasMinMargin: null,
      roasTarget: null,
    };
    expect(computeVerdict({ spendCum: 100, revenueCum: 900 }, unreachable)).toBe(
      "KILL",
    );
    expect(computeVerdict({ spendCum: 40, revenueCum: 900 }, unreachable)).toBe(
      "SURVEILLER",
    );
  });
});

describe("cumulate", () => {
  it("sums every week including legacy history", () => {
    const cum = cumulate([
      { spend: 10, revenue: 20 },
      { spend: 5, revenue: 0 },
      { spend: 20, revenue: 60 },
    ]);
    expect(cum).toEqual({ spendCum: 35, revenueCum: 80 });
  });

  it("returns zeroes for a creative with no data", () => {
    expect(cumulate([])).toEqual({ spendCum: 0, revenueCum: 0 });
  });
});
