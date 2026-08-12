import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export type SearchHit = {
  kind: "creative" | "accroche" | "script";
  id: string;
  code: string;
  title: string;
  subtitle: string;
  href: string;
};

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) return NextResponse.json({ hits: [] });

  const [creatives, accroches, scripts] = await Promise.all([
    prisma.creative.findMany({
      where: {
        OR: [
          { code: { contains: q } },
          { legacyMetaName: { contains: q } },
          { accroche: { verbatim: { contains: q } } },
        ],
      },
      include: { accroche: true },
      take: 8,
      orderBy: { code: "asc" },
    }),
    prisma.accroche.findMany({
      where: { OR: [{ code: { contains: q } }, { verbatim: { contains: q } }] },
      take: 8,
      orderBy: { code: "asc" },
    }),
    prisma.script.findMany({
      where: {
        OR: [
          { creativeCode: { contains: q } },
          { familyCode: { contains: q } },
          { hypothesis: { contains: q } },
          { hookDialogue: { contains: q } },
        ],
      },
      include: { family: true },
      take: 6,
      orderBy: { creativeCode: "asc" },
    }),
  ]);

  const hits: SearchHit[] = [
    ...creatives.map((c) => ({
      kind: "creative" as const,
      id: c.id,
      code: c.code,
      title: c.code,
      subtitle: c.accroche?.verbatim ?? c.angle,
      href: `/creative/library/${encodeURIComponent(c.code)}`,
    })),
    ...accroches.map((a) => ({
      kind: "accroche" as const,
      id: a.id,
      code: a.code,
      title: a.verbatim,
      subtitle: `${a.code} · ${a.type}`,
      href: `/creative/hooks?focus=${encodeURIComponent(a.code)}`,
    })),
    ...scripts.map((s) => ({
      kind: "script" as const,
      id: s.id,
      code: s.creativeCode,
      title: `${s.creativeCode} — ${s.family.nickname}`,
      subtitle: s.hypothesis,
      href: `/creative/scripts?script=${encodeURIComponent(s.creativeCode)}`,
    })),
  ];

  return NextResponse.json({ hits });
}
