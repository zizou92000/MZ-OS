"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1, "Donne un nom au scénario"),
  budget: z.coerce.number().min(0),
  cpm: z.coerce.number().min(0),
  ctr: z.coerce.number().min(0).max(1),
  clickToVisitDrop: z.coerce.number().min(0).max(1),
  cvr: z.coerce.number().min(0).max(1),
  averageOrderValue: z.coerce.number().min(0),
});

export async function saveScenario(input: z.input<typeof schema>) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0].message };
  }
  await prisma.simulationScenario.create({ data: parsed.data });
  revalidatePath("/creative/economics");
  return { ok: true as const };
}

export async function deleteScenario(id: string) {
  await prisma.simulationScenario.delete({ where: { id } });
  revalidatePath("/creative/economics");
  return { ok: true as const };
}
