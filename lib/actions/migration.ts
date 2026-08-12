"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { LEGACY_WEEK } from "@/lib/derive";
import { prisma } from "@/lib/prisma";
import { normaliseVerbatim } from "@/lib/text";
import {
  ACCROCHE_TYPES,
  ANGLES,
  CREATIVE_KINDS,
  LAYOUTS,
  PERIODS,
  VIDEO_FORMATS,
} from "@/lib/taxonomy";

export type VerbatimGroup = {
  canonical: string;
  duplicates: string[];
  suggestedCode: string;
};

export async function groupVerbatims(
  raw: string,
  kind: "HOOK" | "HEADLINE",
): Promise<VerbatimGroup[]> {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const groups = new Map<string, string[]>();
  for (const line of lines) {
    const key = normaliseVerbatim(line);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), line]);
  }

  const prefix = kind === "HOOK" ? "H" : "HL";
  const existing = await prisma.accroche.findMany({
    where: { kind },
    select: { code: true },
  });
  let next =
    existing.reduce((max, a) => {
      const n = Number(a.code.replace(/^\D+/, ""));
      return Number.isFinite(n) && n > max ? n : max;
    }, 0) + 1;

  return [...groups.values()].map((variants) => ({
    // Keep the longest spelling: it usually has the accents and punctuation.
    canonical: variants.reduce((a, b) => (b.length > a.length ? b : a)),
    duplicates: variants.slice(1),
    suggestedCode: `${prefix}${String(next++).padStart(2, "0")}`,
  }));
}

const accrocheImport = z.object({
  code: z.string().min(1),
  kind: z.enum(["HOOK", "HEADLINE"]),
  verbatim: z.string().min(1),
  type: z.enum(ACCROCHE_TYPES),
  deepDesire: z.string().nullish(),
});

export async function importAccroches(rows: z.input<typeof accrocheImport>[]) {
  const parsed = z.array(accrocheImport).safeParse(rows);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0].message };
  }
  let created = 0;
  for (const row of parsed.data) {
    await prisma.accroche.upsert({
      where: { code: row.code },
      update: {},
      create: { ...row, status: "EN_TEST" },
    });
    created += 1;
  }
  revalidatePath("/creative", "layout");
  return { ok: true as const, created };
}

const creativeImport = z.object({
  code: z.string().min(1),
  kind: z.enum(CREATIVE_KINDS),
  angle: z.enum(ANGLES),
  videoFormat: z.enum(VIDEO_FORMATS).nullish(),
  layout: z.enum(LAYOUTS).nullish(),
  period: z.enum(PERIODS),
  launchDate: z.coerce.date(),
  legacyMetaName: z.string().nullish(),
  accrocheCode: z.string().nullish(),
  status: z.enum(["BACKLOG", "LIVE", "PAUSE", "WINNER", "KILL"]).default("LIVE"),
});

export async function importCreatives(rows: z.input<typeof creativeImport>[]) {
  const parsed = z.array(creativeImport).safeParse(rows);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0].message };
  }

  const accroches = await prisma.accroche.findMany({
    select: { id: true, code: true },
  });
  const accrocheId = new Map(accroches.map((a) => [a.code, a.id]));

  // Shallow codes first so a child never lands before its parent.
  const ordered = [...parsed.data].sort(
    (a, b) => a.code.split(".").length - b.code.split(".").length,
  );

  let created = 0;
  for (const row of ordered) {
    const { accrocheCode, ...rest } = row;
    const parentCode = row.code.includes(".")
      ? row.code.slice(0, row.code.lastIndexOf("."))
      : null;
    const parentExists = parentCode
      ? (await prisma.creative.count({ where: { code: parentCode } })) > 0
      : false;

    await prisma.creative.upsert({
      where: { code: row.code },
      update: { legacyMetaName: row.legacyMetaName ?? undefined },
      create: {
        ...rest,
        parentCode: parentExists ? parentCode : null,
        generation: row.code.split(".").length - 1,
        accrocheId: accrocheCode ? (accrocheId.get(accrocheCode) ?? null) : null,
      },
    });
    created += 1;
  }
  revalidatePath("/creative", "layout");
  return { ok: true as const, created };
}

const perfImport = z.object({
  code: z.string().min(1),
  isoWeek: z.string().regex(/^\d{2}W\d{2}$/),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  spend: z.coerce.number().min(0),
  impressions: z.coerce.number().int().min(0),
  views3s: z.coerce.number().int().min(0).nullish(),
  thruplays: z.coerce.number().int().min(0).nullish(),
  outboundClicks: z.coerce.number().int().min(0),
  lpViews: z.coerce.number().int().min(0),
  atc: z.coerce.number().int().min(0),
  checkouts: z.coerce.number().int().min(0),
  purchases: z.coerce.number().int().min(0),
  revenue: z.coerce.number().min(0),
});

/**
 * `cumulative` collapses everything onto the reserved LEGACY_WEEK, which is
 * excluded from weekly charts but still counted in totals — so imported
 * history informs verdicts without inventing a fake weekly curve.
 */
export async function importPerformance(
  rows: Omit<z.input<typeof perfImport>, "isoWeek" | "startDate" | "endDate">[],
  cumulative: boolean,
  isoWeek?: string,
) {
  const week = cumulative ? LEGACY_WEEK : (isoWeek ?? LEGACY_WEEK);
  const date = new Date();

  const prepared = rows.map((r) => ({
    ...r,
    isoWeek: week,
    startDate: date,
    endDate: date,
  }));

  const parsed = z.array(perfImport).safeParse(prepared);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0].message };
  }

  const creatives = await prisma.creative.findMany({
    select: { id: true, code: true },
  });
  const idByCode = new Map(creatives.map((c) => [c.code, c.id]));

  let imported = 0;
  const unknown: string[] = [];

  for (const row of parsed.data) {
    const { code, ...values } = row;
    const creativeId = idByCode.get(code);
    if (!creativeId) {
      unknown.push(code);
      continue;
    }
    await prisma.weeklyPerf.upsert({
      where: { creativeId_isoWeek: { creativeId, isoWeek: values.isoWeek } },
      update: values,
      create: { creativeId, ...values },
    });
    imported += 1;
  }

  revalidatePath("/creative", "layout");
  return { ok: true as const, imported, unknown };
}
