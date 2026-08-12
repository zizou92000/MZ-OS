"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { nextChildCode } from "@/lib/derive";
import { prisma } from "@/lib/prisma";
import {
  CHANGED_ELEMENTS_FOR_KIND,
  CREATIVE_KINDS,
  PERIODS,
  PROD_STATUSES,
  PRODUCTION_TYPES,
  type ProdStatus,
} from "@/lib/taxonomy";

const schema = z
  .object({
    creativeKind: z.enum(CREATIVE_KINDS),
    productionType: z.enum(PRODUCTION_TYPES),
    parentCode: z.string().nullish(),
    targetCode: z.string().nullish(),
    elementToChange: z.string().min(1, "Choisis l'élément à changer"),
    // The one field the form must never let through empty: a test without a
    // written hypothesis teaches nothing.
    hypothesis: z
      .string()
      .trim()
      .min(
        12,
        "Écris l'hypothèse : ce que tu attends et pourquoi. Un test sans hypothèse n'apprend rien.",
      ),
    targetPeriod: z.enum(PERIODS),
    targetWeek: z.string().nullish(),
    priority: z.coerce.number().int().min(0).default(0),
    briefUrl: z.string().nullish(),
  })
  .refine(
    (v) => CHANGED_ELEMENTS_FOR_KIND[v.creativeKind].includes(v.elementToChange),
    { message: "Cet élément ne s'applique pas à ce type de créative" },
  );

export type BacklogFormValues = z.input<typeof schema>;

export async function createBacklogItem(input: BacklogFormValues) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0].message };
  }
  await prisma.backlogItem.create({
    data: { ...parsed.data, elementToChange: parsed.data.elementToChange as never },
  });
  revalidatePath("/creative/backlog");
  revalidatePath("/creative");
  return { ok: true as const };
}

export async function updateBacklogStatus(id: string, prodStatus: ProdStatus) {
  if (!PROD_STATUSES.includes(prodStatus)) {
    return { ok: false as const, error: "Statut inconnu" };
  }
  await prisma.backlogItem.update({ where: { id }, data: { prodStatus } });
  revalidatePath("/creative/backlog");
  return { ok: true as const };
}

export async function deleteBacklogItem(id: string) {
  await prisma.backlogItem.delete({ where: { id } });
  revalidatePath("/creative/backlog");
  return { ok: true as const };
}

/** Next free child code under a parent, for pre-filling the iteration form. */
export async function suggestTargetCode(parentCode: string) {
  const [existingCreatives, existingBacklog] = await Promise.all([
    prisma.creative.findMany({
      where: { code: { startsWith: `${parentCode}.` } },
      select: { code: true },
    }),
    prisma.backlogItem.findMany({
      where: { targetCode: { startsWith: `${parentCode}.` } },
      select: { targetCode: true },
    }),
  ]);
  return nextChildCode(parentCode, [
    ...existingCreatives.map((c) => c.code),
    ...existingBacklog.map((b) => b.targetCode!).filter(Boolean),
  ]);
}
