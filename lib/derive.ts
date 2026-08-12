import {
  endOfISOWeek,
  getISOWeek,
  getISOWeekYear,
  parseISO,
  startOfISOWeek,
} from "date-fns";

/** Reserved week code for imported cumulative history (see §8). */
export const LEGACY_WEEK = "26W00";

export function isLegacyWeek(isoWeek: string): boolean {
  return /W00$/.test(isoWeek);
}

/** 10/08/2026 -> "26W33". Uses the ISO week-numbering year, not the calendar year. */
export function toIsoWeek(date: Date): string {
  const year = getISOWeekYear(date) % 100;
  const week = getISOWeek(date);
  return `${String(year).padStart(2, "0")}W${String(week).padStart(2, "0")}`;
}

export function isoWeekRange(date: Date): { startDate: Date; endDate: Date } {
  return { startDate: startOfISOWeek(date), endDate: endOfISOWeek(date) };
}

/** "26W33" -> the Monday of that week. */
export function isoWeekToDate(isoWeek: string): Date | null {
  const match = /^(\d{2})W(\d{2})$/.exec(isoWeek);
  if (!match) return null;
  const year = 2000 + Number(match[1]);
  const week = Number(match[2]);
  if (week < 1 || week > 53) return null;

  // Jan 4th is always in ISO week 1.
  const jan4 = parseISO(`${year}-01-04`);
  const week1Monday = startOfISOWeek(jan4);
  return new Date(
    week1Monday.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000,
  );
}

export function compareIsoWeek(a: string, b: string): number {
  return a.localeCompare(b);
}

export function shiftIsoWeek(isoWeek: string, delta: number): string {
  const monday = isoWeekToDate(isoWeek);
  if (!monday) return isoWeek;
  return toIsoWeek(
    new Date(monday.getTime() + delta * 7 * 24 * 60 * 60 * 1000),
  );
}

/** The last `count` week codes ending at (and including) `isoWeek`. */
export function recentIsoWeeks(isoWeek: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    shiftIsoWeek(isoWeek, i - (count - 1)),
  );
}

export type MetaNameParts = {
  code: string;
  kind: "VIDEO" | "STATIC";
  angle: string;
  videoFormat?: string | null;
  layout?: string | null;
  accrocheCode?: string | null;
  changedElement?: string | null;
  launchDate: Date;
};

/**
 * Always derived, never typed by hand. Renaming a live ad in Meta resets its
 * learning, which is why the UI only ever offers this to copy.
 */
export function deriveMetaName(parts: MetaNameParts): string {
  const slot = parts.kind === "VIDEO" ? parts.videoFormat : parts.layout;
  return [
    parts.code,
    parts.angle,
    slot ?? "NA",
    parts.accrocheCode ?? "NA",
    parts.changedElement ?? "ORIGINE",
    toIsoWeek(parts.launchDate),
  ].join("_");
}

// ---------------------------------------------------------------------------
// Hierarchical creative codes: C01 -> C01.2 -> C01.2.1
// ---------------------------------------------------------------------------

export function generationOf(code: string): number {
  const body = code.replace(/^[A-Z]+/i, "");
  return body.split(".").filter(Boolean).length - 1;
}

export function parentCodeOf(code: string): string | null {
  const idx = code.lastIndexOf(".");
  return idx === -1 ? null : code.slice(0, idx);
}

export function familyCodeOf(code: string): string {
  const idx = code.indexOf(".");
  return idx === -1 ? code : code.slice(0, idx);
}

const SEGMENT = /^(\D*)(\d*)$/;

/**
 * Sorts codes so children follow their parent: C01, C01.1, C01.2, C02.
 * The letter prefix outranks the number so video and static families stay in
 * separate blocks instead of interleaving (C01, C02… then S01, S02…).
 */
export function compareCodes(a: string, b: string): number {
  const segsA = a.split(".");
  const segsB = b.split(".");
  const len = Math.min(segsA.length, segsB.length);
  for (let i = 0; i < len; i += 1) {
    if (segsA[i] === segsB[i]) continue;
    const [, prefixA = "", digitsA = ""] = SEGMENT.exec(segsA[i]) ?? [];
    const [, prefixB = "", digitsB = ""] = SEGMENT.exec(segsB[i]) ?? [];
    if (prefixA !== prefixB) return prefixA.localeCompare(prefixB);
    if (digitsA !== "" && digitsB !== "") {
      const diff = Number(digitsA) - Number(digitsB);
      if (diff !== 0) return diff;
    }
    return segsA[i].localeCompare(segsB[i]);
  }
  return segsA.length - segsB.length;
}

/** Next free child code under `parentCode`, given the codes already taken. */
export function nextChildCode(
  parentCode: string,
  existingCodes: readonly string[],
): string {
  const prefix = `${parentCode}.`;
  const used = existingCodes
    .filter((c) => c.startsWith(prefix))
    .map((c) => Number(c.slice(prefix.length).split(".")[0]))
    .filter((n) => Number.isFinite(n));
  const next = used.length === 0 ? 1 : Math.max(...used) + 1;
  return `${parentCode}.${next}`;
}
