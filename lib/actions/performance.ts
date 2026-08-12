"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isoWeekRange, isoWeekToDate } from "@/lib/derive";
import { prisma } from "@/lib/prisma";

const rowSchema = z.object({
  creativeId: z.string().min(1),
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
  note: z.string().nullish(),
});

const payloadSchema = z.object({
  isoWeek: z.string().regex(/^\d{2}W\d{2}$/, "Semaine attendue au format 26W33"),
  rows: z.array(rowSchema),
});

export type WeeklyRowInput = z.input<typeof rowSchema>;

export async function saveWeek(input: z.input<typeof payloadSchema>) {
  const parsed = payloadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0].message };
  }
  const { isoWeek, rows } = parsed.data;

  const monday = isoWeekToDate(isoWeek);
  if (!monday) {
    return { ok: false as const, error: `Semaine ${isoWeek} invalide` };
  }
  const { startDate, endDate } = isoWeekRange(monday);

  await prisma.$transaction(
    rows.map((row) => {
      const { creativeId, ...values } = row;
      return prisma.weeklyPerf.upsert({
        where: { creativeId_isoWeek: { creativeId, isoWeek } },
        update: values,
        create: { creativeId, isoWeek, startDate, endDate, ...values },
      });
    }),
  );

  revalidatePath("/creative", "layout");
  return { ok: true as const, count: rows.length };
}

export async function deleteWeekRow(creativeId: string, isoWeek: string) {
  await prisma.weeklyPerf.delete({
    where: { creativeId_isoWeek: { creativeId, isoWeek } },
  });
  revalidatePath("/creative", "layout");
  return { ok: true as const };
}
