"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  ANGLES,
  CHANGED_ELEMENTS_FOR_KIND,
  CREATIVE_KINDS,
  CREATIVE_STATUSES,
  LAYOUTS,
  PERIODS,
  VIDEO_FORMATS,
  VISUAL_IDS,
  type CreativeStatus,
} from "@/lib/taxonomy";
import { generationOf, nextChildCode, parentCodeOf } from "@/lib/derive";
import { prisma } from "@/lib/prisma";

export async function bulkSetStatus(ids: string[], status: CreativeStatus) {
  if (ids.length === 0) {
    return { ok: false as const, error: "Rien de sélectionné" };
  }
  await prisma.creative.updateMany({
    where: { id: { in: ids } },
    data: { status },
  });
  revalidatePath("/creative", "layout");
  return { ok: true as const };
}

const creativeSchema = z
  .object({
    code: z
      .string()
      .min(1, "Le code est obligatoire")
      .regex(
        /^[A-Z]+\d+(\.\d+)*$/,
        "Format attendu : C01, C01.2, C01.2.1",
      ),
    kind: z.enum(CREATIVE_KINDS),
    angle: z.enum(ANGLES),
    videoFormat: z.enum(VIDEO_FORMATS).nullish(),
    layout: z.enum(LAYOUTS).nullish(),
    accrocheId: z.string().nullish(),
    changedElement: z.string().nullish(),
    durationS: z.coerce.number().int().min(0).nullish(),
    visualId: z.enum(VISUAL_IDS).nullish(),
    launchDate: z.coerce.date(),
    period: z.enum(PERIODS),
    status: z.enum(CREATIVE_STATUSES).default("BACKLOG"),
    legacyMetaName: z.string().nullish(),
    videoUrl: z.string().nullish(),
    scriptUrl: z.string().nullish(),
    hook3sUrl: z.string().nullish(),
    imageUrl: z.string().nullish(),
    briefUrl: z.string().nullish(),
  })
  .refine(
    (v) =>
      v.changedElement == null ||
      CHANGED_ELEMENTS_FOR_KIND[v.kind].includes(v.changedElement),
    { message: "Cet élément ne s'applique pas à ce type de créative" },
  );

export type CreativeFormValues = z.input<typeof creativeSchema>;

export async function saveCreative(input: CreativeFormValues) {
  const parsed = creativeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;
  const parentCode = parentCodeOf(data.code);

  if (parentCode) {
    const parent = await prisma.creative.findUnique({
      where: { code: parentCode },
    });
    if (!parent) {
      return {
        ok: false as const,
        error: `Le parent ${parentCode} n'existe pas encore`,
      };
    }
  }

  const payload = {
    ...data,
    changedElement: (data.changedElement ?? null) as never,
    parentCode,
    generation: generationOf(data.code),
  };

  await prisma.creative.upsert({
    where: { code: data.code },
    update: payload,
    create: payload,
  });

  revalidatePath("/creative", "layout");
  return { ok: true as const, code: data.code };
}

/** Suggests the next free child code under a parent. */
export async function suggestChildCode(parentCode: string) {
  const siblings = await prisma.creative.findMany({
    where: { code: { startsWith: `${parentCode}.` } },
    select: { code: true },
  });
  return nextChildCode(
    parentCode,
    siblings.map((s) => s.code),
  );
}
