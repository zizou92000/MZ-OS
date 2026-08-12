"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const sceneSchema = z.object({
  tc: z.string(),
  visual: z.string(),
  dialogue: z.string(),
  screenText: z.string(),
});

const schema = z.object({
  creativeCode: z.string().min(1),
  hookVisual: z.string().nullish(),
  hookDialogue: z.string().nullish(),
  hookScreenText: z.string().nullish(),
  scenes: z.array(sceneSchema),
  learning: z.string().nullish(),
});

export async function updateScript(input: z.input<typeof schema>) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0].message };
  }
  const { creativeCode, ...data } = parsed.data;
  await prisma.script.update({ where: { creativeCode }, data });
  revalidatePath("/creative/scripts");
  return { ok: true as const };
}

export async function updateFamilyDna(
  code: string,
  data: {
    nickname?: string;
    promise?: string;
    visibleMechanism?: string;
    narrativeStructure?: string;
    competitiveFrame?: string;
    emotionalDriver?: string;
    neverTouch?: string;
  },
) {
  await prisma.scriptFamily.update({ where: { code }, data });
  revalidatePath("/creative/scripts");
  return { ok: true as const };
}
