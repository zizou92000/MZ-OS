"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { PERIODS } from "@/lib/taxonomy";

const schema = z.object({
  code: z.enum(PERIODS),
  memo: z.string().nullish(),
  relaunchNextYear: z.boolean().optional(),
});

export async function updatePeriod(input: z.input<typeof schema>) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0].message };
  }
  const { code, ...data } = parsed.data;
  await prisma.commercialPeriod.update({ where: { code }, data });
  revalidatePath("/creative/calendar");
  return { ok: true as const };
}
