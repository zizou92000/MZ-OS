import { describe, expect, it } from "vitest";
import { ancestorsOf, buildTree } from "./lineage";

const codes = (rows: { code: string }[]) => rows.map((r) => r.code);

describe("buildTree", () => {
  it("places each child directly after its parent", () => {
    const rows = buildTree(
      [
        { code: "C02" },
        { code: "C01.2" },
        { code: "C01" },
        { code: "C01.2.1" },
        { code: "C01.1" },
      ],
      (i) => i.code,
    );
    expect(codes(rows)).toEqual([
      "C01",
      "C01.1",
      "C01.2",
      "C01.2.1",
      "C02",
    ]);
  });

  it("assigns depth from code hierarchy", () => {
    const rows = buildTree(
      [{ code: "C01" }, { code: "C01.2" }, { code: "C01.2.1" }],
      (i) => i.code,
    );
    expect(rows.map((r) => r.depth)).toEqual([0, 1, 2]);
  });

  it("marks the last child of each branch", () => {
    const rows = buildTree(
      [{ code: "C01" }, { code: "C01.1" }, { code: "C01.2" }],
      (i) => i.code,
    );
    expect(rows.map((r) => r.isLast)).toEqual([true, false, true]);
  });

  it("flags rows that have children", () => {
    const rows = buildTree(
      [{ code: "C01" }, { code: "C01.1" }],
      (i) => i.code,
    );
    expect(rows.map((r) => r.hasChildren)).toEqual([true, false]);
  });

  it("keeps an orphan visible as a root when its parent is filtered out", () => {
    const rows = buildTree([{ code: "C01.2" }, { code: "C03" }], (i) => i.code);
    expect(codes(rows)).toEqual(["C01.2", "C03"]);
    expect(rows.map((r) => r.depth)).toEqual([0, 0]);
  });

  it("continues the guide past a parent that still has siblings", () => {
    // C01 has two children; while inside C01.1 the C01 trunk must keep running.
    const rows = buildTree(
      [
        { code: "C01" },
        { code: "C01.1" },
        { code: "C01.1.1" },
        { code: "C01.2" },
        { code: "C02" },
      ],
      (i) => i.code,
    );
    const deep = rows.find((r) => r.code === "C01.1.1")!;
    expect(deep.depth).toBe(2);
    // C01 is not the last root (C02 follows), so its trunk continues.
    expect(deep.guides[0]).toBe(true);
  });

  it("returns nothing for an empty set", () => {
    expect(buildTree([], (i: { code: string }) => i.code)).toEqual([]);
  });
});

describe("ancestorsOf", () => {
  it("lists ancestors outermost first", () => {
    expect(ancestorsOf("C01.2.1")).toEqual(["C01", "C01.2"]);
  });

  it("returns nothing for a root", () => {
    expect(ancestorsOf("C01")).toEqual([]);
  });
});
