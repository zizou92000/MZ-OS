import { describe, expect, it } from "vitest";
import {
  compareCodes,
  deriveMetaName,
  familyCodeOf,
  generationOf,
  isLegacyWeek,
  isoWeekToDate,
  nextChildCode,
  parentCodeOf,
  recentIsoWeeks,
  shiftIsoWeek,
  toIsoWeek,
} from "./derive";

describe("toIsoWeek", () => {
  it("matches the reference case from the spec", () => {
    expect(toIsoWeek(new Date(2026, 7, 10))).toBe("26W33");
  });

  it("pads single-digit weeks", () => {
    expect(toIsoWeek(new Date(2026, 0, 5))).toBe("26W02");
  });

  it("uses the ISO week-numbering year across a year boundary", () => {
    // 29 Dec 2025 is a Monday belonging to ISO week 1 of 2026.
    expect(toIsoWeek(new Date(2025, 11, 29))).toBe("26W01");
    // 31 Dec 2024 belongs to ISO week 1 of 2025.
    expect(toIsoWeek(new Date(2024, 11, 31))).toBe("25W01");
  });

  it("handles a 53-week year", () => {
    expect(toIsoWeek(new Date(2020, 11, 31))).toBe("20W53");
  });
});

describe("isoWeekToDate", () => {
  it("round-trips through toIsoWeek", () => {
    for (const week of ["26W01", "26W33", "26W52", "25W07"]) {
      expect(toIsoWeek(isoWeekToDate(week)!)).toBe(week);
    }
  });

  it("returns the Monday of the week", () => {
    expect(isoWeekToDate("26W33")!.getDay()).toBe(1);
  });

  it("rejects malformed codes", () => {
    expect(isoWeekToDate("nope")).toBeNull();
    expect(isoWeekToDate("26W99")).toBeNull();
  });
});

describe("shiftIsoWeek", () => {
  it("moves forward and backward", () => {
    expect(shiftIsoWeek("26W33", 1)).toBe("26W34");
    expect(shiftIsoWeek("26W33", -1)).toBe("26W32");
  });

  it("crosses the year boundary", () => {
    expect(shiftIsoWeek("26W52", 2)).toBe("27W01");
    expect(shiftIsoWeek("26W01", -1)).toBe("25W52");
  });
});

describe("recentIsoWeeks", () => {
  it("returns a window ending at the given week", () => {
    expect(recentIsoWeeks("26W33", 4)).toEqual([
      "26W30",
      "26W31",
      "26W32",
      "26W33",
    ]);
  });
});

describe("legacy week", () => {
  it("recognises the reserved history code", () => {
    expect(isLegacyWeek("26W00")).toBe(true);
    expect(isLegacyWeek("26W01")).toBe(false);
    expect(isLegacyWeek("26W33")).toBe(false);
  });
});

describe("deriveMetaName", () => {
  const launchDate = new Date(2026, 7, 10);

  it("uses the video format slot for videos", () => {
    expect(
      deriveMetaName({
        code: "C01.2.1",
        kind: "VIDEO",
        angle: "Organisation",
        videoFormat: "DemoFAQ",
        accrocheCode: "H07",
        changedElement: "HOOK",
        launchDate,
      }),
    ).toBe("C01.2.1_Organisation_DemoFAQ_H07_HOOK_26W33");
  });

  it("uses the layout slot for statics", () => {
    expect(
      deriveMetaName({
        code: "S04.1",
        kind: "STATIC",
        angle: "Fraicheur",
        layout: "L07",
        accrocheCode: "HL02",
        changedElement: "HEADLINE",
        launchDate,
      }),
    ).toBe("S04.1_Fraicheur_L07_HL02_HEADLINE_26W33");
  });

  it("defaults a missing changed element to ORIGINE", () => {
    expect(
      deriveMetaName({
        code: "C05",
        kind: "VIDEO",
        angle: "Famille",
        videoFormat: "Storytelling",
        accrocheCode: "H01",
        changedElement: null,
        launchDate,
      }),
    ).toBe("C05_Famille_Storytelling_H01_ORIGINE_26W33");
  });

  it("marks an absent accroche rather than collapsing the slot", () => {
    expect(
      deriveMetaName({
        code: "C05",
        kind: "VIDEO",
        angle: "Famille",
        videoFormat: "Storytelling",
        accrocheCode: null,
        changedElement: "ORIGINE",
        launchDate,
      }).split("_"),
    ).toHaveLength(6);
  });
});

describe("hierarchical codes", () => {
  it("reads generation from depth", () => {
    expect(generationOf("C01")).toBe(0);
    expect(generationOf("C01.2")).toBe(1);
    expect(generationOf("C01.2.1")).toBe(2);
  });

  it("finds the parent", () => {
    expect(parentCodeOf("C01.2.1")).toBe("C01.2");
    expect(parentCodeOf("C01.2")).toBe("C01");
    expect(parentCodeOf("C01")).toBeNull();
  });

  it("finds the family root", () => {
    expect(familyCodeOf("C01.2.1")).toBe("C01");
    expect(familyCodeOf("C01")).toBe("C01");
  });

  it("sorts children directly after their parent", () => {
    const sorted = ["C02", "C01.2", "C01", "C01.10", "C01.2.1"].sort(
      compareCodes,
    );
    expect(sorted).toEqual(["C01", "C01.2", "C01.2.1", "C01.10", "C02"]);
  });

  it("keeps letter families in separate blocks", () => {
    const sorted = ["S01", "C02", "S02", "C01"].sort(compareCodes);
    expect(sorted).toEqual(["C01", "C02", "S01", "S02"]);
  });

  it("allocates the next free child code", () => {
    expect(nextChildCode("C01", [])).toBe("C01.1");
    expect(nextChildCode("C01", ["C01.1", "C01.2"])).toBe("C01.3");
    expect(nextChildCode("C01", ["C01.1", "C01.2", "C01.2.1"])).toBe("C01.3");
    expect(nextChildCode("C01", ["C02.1"])).toBe("C01.1");
  });
});
