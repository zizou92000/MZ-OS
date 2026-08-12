"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { computeThresholds } from "@/lib/economics";
import { prisma } from "@/lib/prisma";
import { computeVerdict, cumulate } from "@/lib/verdict";
import type { Verdict } from "@/lib/taxonomy";

const lineSchema = z.object({
  bundle: z.coerce.number().int().min(1),
  cogs: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  salesShare: z.coerce.number().min(0),
});

const offerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Donne un nom à cette offre"),
  psp: z.coerce.number().min(0).max(1),
  vat: z.coerce.number().min(0).max(1),
  otherFees: z.coerce.number().min(0).max(1),
  minMargin: z.coerce.number().min(0).max(1),
  targetMargin: z.coerce.number().min(0).max(1),
  lines: z.array(lineSchema).min(1, "Au moins une ligne de produit").max(4),
});

export type OfferFormValues = z.input<typeof offerSchema>;

export async function saveOffer(input: OfferFormValues) {
  const parsed = offerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0].message };
  }
  const { id, lines, ...offer } = parsed.data;

  if (id) {
    await prisma.$transaction([
      prisma.offerLine.deleteMany({ where: { offerId: id } }),
      prisma.offer.update({
        where: { id },
        data: {
          ...offer,
          lines: { create: lines.map((l, position) => ({ ...l, position })) },
        },
      }),
    ]);
  } else {
    await prisma.offer.create({
      data: {
        ...offer,
        lines: { create: lines.map((l, position) => ({ ...l, position })) },
      },
    });
  }

  revalidatePath("/creative", "layout");
  return { ok: true as const };
}

export async function deleteOffer(id: string) {
  const offer = await prisma.offer.findUnique({ where: { id } });
  if (offer?.isActive) {
    return {
      ok: false as const,
      error: "Impossible de supprimer l'offre active. Actives-en une autre d'abord.",
    };
  }
  await prisma.offer.delete({ where: { id } });
  revalidatePath("/creative", "layout");
  return { ok: true as const };
}

/**
 * Switching the active offer re-prices every verdict in the library, so the
 * UI asks first. This returns the exact list that would change.
 */
export async function previewOfferSwitch(targetOfferId: string) {
  const [current, target, creatives] = await Promise.all([
    prisma.offer.findFirst({
      where: { isActive: true },
      include: { lines: true },
    }),
    prisma.offer.findUnique({
      where: { id: targetOfferId },
      include: { lines: true },
    }),
    prisma.creative.findMany({
      include: { weeklyPerfs: { select: { spend: true, revenue: true } } },
      orderBy: { code: "asc" },
    }),
  ]);
  if (!target) return { ok: false as const, error: "Offre introuvable" };

  const before = current ? computeThresholds(current) : null;
  const after = computeThresholds(target);

  const changes: {
    code: string;
    from: Verdict;
    to: Verdict;
  }[] = [];

  for (const c of creatives) {
    const cum = cumulate(c.weeklyPerfs);
    const from = before
      ? computeVerdict(cum, before)
      : ("TEST_EN_COURS" as Verdict);
    const to = computeVerdict(cum, after);
    if (from !== to) changes.push({ code: c.code, from, to });
  }

  return {
    ok: true as const,
    offerName: target.name,
    thresholds: {
      roasBreakEven: after.roasBreakEven,
      roasMinMargin: after.roasMinMargin,
      roasTarget: after.roasTarget,
    },
    changes,
    total: creatives.length,
  };
}

export async function activateOffer(id: string) {
  await prisma.$transaction([
    prisma.offer.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    }),
    prisma.offer.update({ where: { id }, data: { isActive: true } }),
  ]);
  revalidatePath("/", "layout");
  return { ok: true as const };
}
