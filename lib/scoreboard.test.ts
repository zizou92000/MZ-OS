import { describe, expect, it } from "vitest";
import {
  buildBlocks,
  findInvariants,
  SIGNIFICANT_SPEND,
  sortRows,
  type ScoredItem,
  type ScoreRow,
} from "./scoreboard";

const identity = (k: string) => k;
const LABELS = {
  angle: identity,
  videoFormat: identity,
  layout: identity,
  changedElement: identity,
  accrocheType: identity,
};

function item(over: Partial<ScoredItem> = {}): ScoredItem {
  return {
    kind: "VIDEO",
    angle: "Organisation",
    videoFormat: "DemoFAQ",
    layout: null,
    changedElement: "HOOK",
    accrocheType: "AvantApres",
    spendCum: 100,
    revenueCum: 200,
    impressions: 10_000,
    views3s: 3_000,
    outboundClicks: 120,
    ...over,
  };
}

function row(over: Partial<ScoreRow> = {}): ScoreRow {
  return {
    key: "k",
    label: "k",
    count: 1,
    spend: 200,
    revenue: 400,
    roas: 2,
    hookRate: 0.3,
    ctr: 0.012,
    significant: true,
    ...over,
  };
}

describe("aggregation", () => {
  it("sums spend and revenue across a bucket", () => {
    const blocks = buildBlocks(
      [
        item({ angle: "Organisation", spendCum: 100, revenueCum: 250 }),
        item({ angle: "Organisation", spendCum: 100, revenueCum: 150 }),
        item({ angle: "Famille", spendCum: 200, revenueCum: 200 }),
      ],
      LABELS,
    );
    const byAngle = blocks.find((b) => b.id === "video-angle")!;
    const organisation = byAngle.rows.find((r) => r.key === "Organisation")!;
    expect(organisation.count).toBe(2);
    expect(organisation.spend).toBe(200);
    expect(organisation.revenue).toBe(400);
    expect(organisation.roas).toBe(2);
  });

  it("computes hook rate and ctr from summed impressions, not averaged ratios", () => {
    const blocks = buildBlocks(
      [
        item({ impressions: 10_000, views3s: 1_000, outboundClicks: 100 }),
        item({ impressions: 90_000, views3s: 9_000, outboundClicks: 900 }),
      ],
      LABELS,
    );
    const r = blocks.find((b) => b.id === "video-angle")!.rows[0];
    expect(r.hookRate).toBeCloseTo(0.1, 10);
    expect(r.ctr).toBeCloseTo(0.01, 10);
  });

  it("keeps video and static in separate blocks", () => {
    const blocks = buildBlocks(
      [
        item({ kind: "VIDEO" }),
        item({ kind: "STATIC", videoFormat: null, layout: "L01" }),
      ],
      LABELS,
    );
    expect(blocks.find((b) => b.id === "video-angle")!.rows).toHaveLength(1);
    expect(blocks.find((b) => b.id === "static-layout")!.rows).toHaveLength(1);
  });

  it("skips items with no value for the dimension", () => {
    const blocks = buildBlocks(
      [item({ accrocheType: null }), item({ accrocheType: "Question" })],
      LABELS,
    );
    expect(blocks.find((b) => b.id === "video-accroche")!.rows).toHaveLength(1);
  });

  it("produces the nine required blocks", () => {
    const blocks = buildBlocks([item()], LABELS);
    expect(blocks).toHaveLength(9);
    expect(blocks.at(-1)!.id).toBe("video-vs-static");
  });
});

describe("significance", () => {
  it("marks rows below the threshold as insufficient", () => {
    const blocks = buildBlocks(
      [item({ angle: "Famille", spendCum: SIGNIFICANT_SPEND - 1 })],
      LABELS,
    );
    expect(blocks.find((b) => b.id === "video-angle")!.rows[0].significant).toBe(
      false,
    );
  });

  it("marks rows at the threshold as significant", () => {
    const blocks = buildBlocks(
      [item({ spendCum: SIGNIFICANT_SPEND })],
      LABELS,
    );
    expect(blocks.find((b) => b.id === "video-angle")!.rows[0].significant).toBe(
      true,
    );
  });

  it("sinks an insufficient row below every significant one, however good its ROAS", () => {
    const sorted = sortRows([
      row({ key: "noise", roas: 9, spend: 10, significant: false }),
      row({ key: "solid", roas: 1.4, spend: 900, significant: true }),
      row({ key: "better", roas: 2.1, spend: 800, significant: true }),
    ]);
    expect(sorted.map((r) => r.key)).toEqual(["better", "solid", "noise"]);
  });

  it("orders insufficient rows by spend, not by ratio", () => {
    const sorted = sortRows([
      row({ key: "a", roas: 9, spend: 10, significant: false }),
      row({ key: "b", roas: 1, spend: 90, significant: false }),
    ]);
    expect(sorted.map((r) => r.key)).toEqual(["b", "a"]);
  });
});

describe("market invariant", () => {
  it("reports a type that wins on both sides", () => {
    const invariants = findInvariants(
      [
        row({ key: "AvantApres", roas: 2.4 }),
        row({ key: "Question", roas: 1.5 }),
      ],
      [
        row({ key: "AvantApres", roas: 2.1 }),
        row({ key: "Chiffre", roas: 1.7 }),
      ],
    );
    expect(invariants).toHaveLength(1);
    expect(invariants[0].key).toBe("AvantApres");
    expect(invariants[0].videoRoas).toBeCloseTo(2.4);
    expect(invariants[0].staticRoas).toBeCloseTo(2.1);
  });

  it("reports nothing when the winners differ", () => {
    expect(
      findInvariants(
        [row({ key: "AvantApres", roas: 2.4 })],
        [row({ key: "Chiffre", roas: 2.2 })],
      ),
    ).toEqual([]);
  });

  it("ignores a match built on insufficient data", () => {
    expect(
      findInvariants(
        [row({ key: "AvantApres", roas: 9, significant: false })],
        [row({ key: "AvantApres", roas: 9, significant: false })],
      ),
    ).toEqual([]);
  });

  it("reports nothing when one side has no data at all", () => {
    expect(findInvariants([row({ key: "Question" })], [])).toEqual([]);
  });
});
