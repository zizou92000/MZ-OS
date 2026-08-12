/**
 * Optional demo dataset for exercising the views. Not part of `db seed`.
 *   npx tsx prisma/seed-demo.ts          seed
 *   npx tsx prisma/seed-demo.ts --clear  remove only the demo rows
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../lib/generated/prisma/client";
import { isoWeekRange, isoWeekToDate, toIsoWeek } from "../lib/derive";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  }),
});

const HOOKS = [
  ["H01", "¿Sabes cuánto tiras a la basura cada semana?", "Question", "Ne plus culpabiliser en vidant le frigo"],
  ["H02", "Mira lo que le pasa a este aguacate en 7 días", "ChocVisuel", "Voir la preuve avant d'y croire"],
  ["H03", "Deja de tirar comida cada domingo", "Negatif", "Arrêter une perte qui se répète"],
  ["H04", "3 veces más fresco. Sin bolsas. Sin líos.", "Chiffre", "Un gain chiffré, donc vérifiable"],
  ["H05", "Si cocinas para toda la semana, esto es para ti", "Callout", "Se reconnaître immédiatement"],
  ["H06", "Antes: blando en 2 días. Después: 14 días.", "AvantApres", "La transformation en une image"],
  ["H07", "Mi madre lleva 30 años haciéndolo mal", "Autorite", "Renverser une autorité familiale"],
  ["H08", "Nadie te cuenta esto sobre tu nevera", "Curiosite", "Le secret que tout le monde ignore"],
  ["H09", "Así se sella en 8 segundos", "Demo", "Voir que c'est simple et rapide"],
] as const;

const HEADLINES = [
  ["HL01", "Tu comida, fresca 14 días", "Chiffre", "Une promesse mesurable"],
  ["HL02", "¿Cuánto tiras cada semana?", "Question", "Confronter le gaspillage"],
  ["HL03", "Adiós bolsas de plástico", "Negatif", "Sortir d'une habitude coûteuse"],
  ["HL04", "Antes / Después: 7 días", "AvantApres", "La preuve côte à côte"],
  ["HL05", "Envío gratis · 30 días de garantía", "Callout", "Retirer le risque de l'achat"],
] as const;

type Spec = {
  code: string;
  kind: "VIDEO" | "STATIC";
  angle: string;
  videoFormat?: string;
  layout?: string;
  accroche: string;
  changed: string;
  period: string;
  week: string;
  status: "LIVE" | "PAUSE" | "WINNER" | "KILL" | "BACKLOG";
  /** weekly [spend, revenue] pairs, oldest first */
  perf: [number, number][];
};

const SPECS: Spec[] = [
  // Family C01 — the winning lineage.
  { code: "C01", kind: "VIDEO", angle: "Organisation", videoFormat: "DemoFAQ", accroche: "H01", changed: "ORIGINE", period: "Vuelta_al_Cole", week: "26W28", status: "PAUSE", perf: [[42, 61], [38, 49]] },
  { code: "C01.1", kind: "VIDEO", angle: "Organisation", videoFormat: "DemoFAQ", accroche: "H03", changed: "HOOK", period: "Vuelta_al_Cole", week: "26W30", status: "KILL", perf: [[34, 21], [29, 18]] },
  { code: "C01.2", kind: "VIDEO", angle: "Organisation", videoFormat: "DemoFAQ", accroche: "H06", changed: "HOOK", period: "Vuelta_al_Cole", week: "26W31", status: "WINNER", perf: [[55, 118], [70, 142], [88, 171]] },
  { code: "C01.2.1", kind: "VIDEO", angle: "Organisation", videoFormat: "DemoFAQ", accroche: "H06", changed: "PREUVE", period: "Otono", week: "26W33", status: "LIVE", perf: [[64, 139], [72, 148]] },
  { code: "C01.2.2", kind: "VIDEO", angle: "Organisation", videoFormat: "Comparatif", accroche: "H06", changed: "FORMAT", period: "Otono", week: "26W34", status: "LIVE", perf: [[48, 77]] },
  { code: "C01.3", kind: "VIDEO", angle: "Organisation", videoFormat: "DemoFAQ", accroche: "H09", changed: "HOOK", period: "Otono", week: "26W34", status: "LIVE", perf: [[31, 44]] },

  // Family C02 — freshness angle, mid pack.
  { code: "C02", kind: "VIDEO", angle: "Fraicheur", videoFormat: "Comparatif", accroche: "H02", changed: "ORIGINE", period: "Pre_Verano", week: "26W29", status: "PAUSE", perf: [[46, 68], [40, 52]] },
  { code: "C02.1", kind: "VIDEO", angle: "Fraicheur", videoFormat: "Comparatif", accroche: "H04", changed: "HOOK", period: "Pre_Verano", week: "26W31", status: "LIVE", perf: [[52, 94], [58, 101]] },
  { code: "C02.2", kind: "VIDEO", angle: "AstuceFraicheur", videoFormat: "Comparatif", accroche: "H02", changed: "ANGLE", period: "Otono", week: "26W33", status: "LIVE", perf: [[44, 58], [39, 47]] },

  // Family C03 — family/storytelling, weak.
  { code: "C03", kind: "VIDEO", angle: "Famille", videoFormat: "Storytelling", accroche: "H07", changed: "ORIGINE", period: "Semana_Santa", week: "26W30", status: "KILL", perf: [[61, 39], [38, 22]] },
  { code: "C03.1", kind: "VIDEO", angle: "Famille", videoFormat: "Testimonial", accroche: "H07", changed: "FORMAT", period: "Dia_de_la_Madre", week: "26W32", status: "LIVE", perf: [[33, 46], [28, 38]] },

  // Family C04 — discovery, still in test.
  { code: "C04", kind: "VIDEO", angle: "Decouverte", videoFormat: "UGCCourt", accroche: "H08", changed: "ORIGINE", period: "Agosto_Vacaciones", week: "26W34", status: "LIVE", perf: [[18, 24]] },

  // Statics — S01 family.
  { code: "S01", kind: "STATIC", angle: "Organisation", layout: "L01", accroche: "HL04", changed: "ORIGINE", period: "Vuelta_al_Cole", week: "26W30", status: "PAUSE", perf: [[36, 47], [30, 36]] },
  { code: "S01.1", kind: "STATIC", angle: "Organisation", layout: "L01", accroche: "HL01", changed: "HEADLINE", period: "Vuelta_al_Cole", week: "26W32", status: "WINNER", perf: [[48, 99], [56, 112]] },
  { code: "S01.2", kind: "STATIC", angle: "Organisation", layout: "L10", accroche: "HL04", changed: "LAYOUT", period: "Otono", week: "26W33", status: "LIVE", perf: [[41, 63], [37, 55]] },

  // S02 family — offer-led.
  { code: "S02", kind: "STATIC", angle: "OffreRisqueZero", layout: "L07", accroche: "HL05", changed: "ORIGINE", period: "Rebajas_Verano", week: "26W29", status: "LIVE", perf: [[72, 133], [65, 118]] },
  { code: "S02.1", kind: "STATIC", angle: "OffreRisqueZero", layout: "L07", accroche: "HL02", changed: "HEADLINE", period: "Rebajas_Verano", week: "26W31", status: "LIVE", perf: [[54, 71], [49, 62]] },

  // S03 — anti plastic-bag comparison.
  { code: "S03", kind: "STATIC", angle: "Innovation", layout: "L02", accroche: "HL03", changed: "ORIGINE", period: "Primavera", week: "26W32", status: "LIVE", perf: [[43, 59], [38, 51]] },
  { code: "S03.1", kind: "STATIC", angle: "Innovation", layout: "L06", accroche: "HL03", changed: "LAYOUT", period: "Otono", week: "26W34", status: "LIVE", perf: [[26, 31]] },
];

const DEMO_CODES = SPECS.map((s) => s.code);

async function clearDemo() {
  const creatives = await prisma.creative.findMany({
    where: { code: { in: DEMO_CODES } },
    select: { id: true },
  });
  const ids = creatives.map((c) => c.id);
  await prisma.weeklyPerf.deleteMany({ where: { creativeId: { in: ids } } });
  await prisma.script.deleteMany({
    where: { creativeCode: { in: DEMO_CODES } },
  });
  // Delete deepest codes first so parent links never dangle.
  for (const code of [...DEMO_CODES].sort((a, b) => b.length - a.length)) {
    await prisma.creative.deleteMany({ where: { code } });
  }
  await prisma.scriptFamily.deleteMany({ where: { code: { in: ["C01", "C02"] } } });
  await prisma.accroche.deleteMany({
    where: { code: { in: [...HOOKS.map((h) => h[0]), ...HEADLINES.map((h) => h[0])] } },
  });
  await prisma.backlogItem.deleteMany({});
  console.log("Données de démonstration supprimées.");
}

function weekPlus(week: string, n: number) {
  const monday = isoWeekToDate(week)!;
  return toIsoWeek(new Date(monday.getTime() + n * 7 * 86400000));
}

async function seedDemo() {
  for (const [code, verbatim, type, deepDesire] of [...HOOKS, ...HEADLINES]) {
    await prisma.accroche.upsert({
      where: { code },
      update: {},
      create: {
        code,
        kind: code.startsWith("HL") ? "HEADLINE" : "HOOK",
        verbatim,
        type: type as never,
        deepDesire,
        status: "EN_TEST",
      },
    });
  }

  const accroches = await prisma.accroche.findMany();
  const accrocheId = new Map(accroches.map((a) => [a.code, a.id]));

  // Parents before children so the lineage relation always resolves.
  const ordered = [...SPECS].sort(
    (a, b) => a.code.split(".").length - b.code.split(".").length,
  );

  for (const spec of ordered) {
    const parentCode = spec.code.includes(".")
      ? spec.code.slice(0, spec.code.lastIndexOf("."))
      : null;
    const launchDate = isoWeekToDate(spec.week)!;

    await prisma.creative.upsert({
      where: { code: spec.code },
      update: {},
      create: {
        code: spec.code,
        kind: spec.kind,
        parentCode,
        generation: spec.code.split(".").length - 1,
        changedElement: spec.changed as never,
        angle: spec.angle as never,
        videoFormat: (spec.videoFormat ?? null) as never,
        layout: (spec.layout ?? null) as never,
        accrocheId: accrocheId.get(spec.accroche) ?? null,
        durationS: spec.kind === "VIDEO" ? 21 : null,
        launchDate,
        period: spec.period as never,
        status: spec.status,
        videoUrl: spec.kind === "VIDEO" ? "https://example.com/video" : null,
        imageUrl: spec.kind === "STATIC" ? "https://example.com/image" : null,
      },
    });

    const creative = await prisma.creative.findUniqueOrThrow({
      where: { code: spec.code },
    });

    for (const [i, [spend, revenue]] of spec.perf.entries()) {
      const isoWeek = weekPlus(spec.week, i);
      const { startDate, endDate } = isoWeekRange(isoWeekToDate(isoWeek)!);
      // Better-performing creatives get better upstream rates, so the
      // scoreboard's Hook / CTR columns carry real signal.
      const efficiency = revenue / Math.max(spend, 1);
      const hookRate = 0.18 + Math.min(efficiency, 2.5) * 0.055;
      const ctr = 0.008 + Math.min(efficiency, 2.5) * 0.0022;

      const impressions = Math.round((spend * 1000) / 11.5);
      const outboundClicks = Math.round(impressions * ctr);
      const lpViews = Math.round(outboundClicks * 0.88);
      const purchases = Math.max(0, Math.round(revenue / 52.6));

      await prisma.weeklyPerf.upsert({
        where: { creativeId_isoWeek: { creativeId: creative.id, isoWeek } },
        update: {},
        create: {
          creativeId: creative.id,
          isoWeek,
          startDate,
          endDate,
          spend,
          impressions,
          views3s:
            spec.kind === "VIDEO" ? Math.round(impressions * hookRate) : null,
          thruplays:
            spec.kind === "VIDEO"
              ? Math.round(impressions * hookRate * 0.26)
              : null,
          outboundClicks,
          lpViews,
          atc: Math.round(purchases * 3.1),
          checkouts: Math.round(purchases * 1.7),
          purchases,
          revenue,
        },
      });
    }
  }

  await prisma.scriptFamily.upsert({
    where: { code: "C01" },
    update: {},
    create: {
      code: "C01",
      nickname: "L'avocat",
      promise: "Ta comida sigue fresca dos semanas, sin bolsas y sin líos.",
      visibleMechanism:
        "Le même avocat filmé à J1 et J7, côte à côte, sans coupe.",
      narrativeStructure:
        "Problème vécu → démonstration en temps réel → preuve datée → offre.",
      competitiveFrame:
        "Contre le film plastique et les sacs zip, pas contre les autres scelleurs.",
      emotionalDriver:
        "La culpabilité de jeter, retournée en sentiment de maîtrise.",
      neverTouch:
        "Le plan de preuve daté reste toujours en une seule prise, sans montage. Le jour où on le coupe, la démonstration ne prouve plus rien.",
    },
  });

  await prisma.scriptFamily.upsert({
    where: { code: "C02" },
    update: {},
    create: {
      code: "C02",
      nickname: "Le comparatif",
      promise: "Trois fois plus frais que le film plastique, pour le même geste.",
      visibleMechanism: "Deux barquettes identiques, sept jours d'écart.",
      narrativeStructure: "Constat chiffré → face à face → verdict visuel → CTA.",
      competitiveFrame: "Directement contre les sacs et le film plastique.",
      emotionalDriver: "Le refus de continuer à payer pour du jetable.",
      neverTouch:
        "Les deux contenants doivent rester strictement identiques à l'image. Toute asymétrie visuelle détruit la crédibilité du test.",
    },
  });

  await prisma.script.upsert({
    where: { creativeCode: "C01.2" },
    update: {},
    create: {
      creativeCode: "C01.2",
      familyCode: "C01",
      hypothesis:
        "Une accroche avant/après convertit mieux qu'une question, parce qu'elle montre le résultat avant de demander l'attention.",
      changedVsParent: { element: "HOOK", parent: "H01", here: "H06" },
      hookVisual: "Gros plan sur deux moitiés d'avocat, J1 à gauche, J7 à droite.",
      hookDialogue: "Antes: blando en 2 días. Después: 14 días.",
      hookScreenText: "DÍA 1 / DÍA 14",
      hookType: "AvantApres",
      scenes: [
        { tc: "0-3s", visual: "Split screen des deux avocats", dialogue: "Antes: blando en 2 días. Después: 14 días.", screenText: "DÍA 1 / DÍA 14" },
        { tc: "3-8s", visual: "Mains qui scellent le sachet, plan continu", dialogue: "Ocho segundos. Nada más.", screenText: "8 s" },
        { tc: "8-15s", visual: "Frigo ouvert, barquettes alignées et datées", dialogue: "Toda la semana ordenada, sin bolsas.", screenText: "" },
        { tc: "15-21s", visual: "Produit sur plan de travail + badge offre", dialogue: "Envío gratis y 30 días de garantía.", screenText: "ENVÍO GRATIS" },
      ],
      learning:
        "L'avant/après en ouverture tient l'attention nettement mieux que la question. Le hook rate passe de 24 % à 31 % à format identique.",
    },
  });

  // Deliberately contaminated: two elements moved at once, so the fiche must
  // flag it as an invalid test.
  await prisma.script.upsert({
    where: { creativeCode: "C01.2.2" },
    update: {},
    create: {
      creativeCode: "C01.2.2",
      familyCode: "C01",
      hypothesis:
        "Passer en comparatif rend la preuve plus lisible qu'une démo FAQ.",
      changedVsParent: [
        { element: "FORMAT", parent: "DemoFAQ", here: "Comparatif" },
        { element: "LIEU", parent: "Cuisine claire", here: "Cuisine étroite" },
      ],
      hookVisual: "Deux barquettes filmées de face, sept jours d'écart.",
      hookDialogue: "Antes: blando en 2 días. Después: 14 días.",
      hookScreenText: "DÍA 1 / DÍA 14",
      hookType: "AvantApres",
      scenes: [
        { tc: "0-3s", visual: "Face à face des deux barquettes", dialogue: "Mira la diferencia.", screenText: "DÍA 14" },
        { tc: "3-10s", visual: "Zoom sur le mécanisme de scellage", dialogue: "Ocho segundos y listo.", screenText: "8 s" },
        { tc: "10-18s", visual: "Frigo rangé, barquettes datées", dialogue: "Toda la semana ordenada.", screenText: "" },
      ],
      learning: null,
    },
  });

  await prisma.backlogItem.createMany({
    data: [
      {
        priority: 1,
        creativeKind: "VIDEO",
        productionType: "ITERATION_MAJEURE",
        parentCode: "C01.2",
        targetCode: "C01.2.3",
        elementToChange: "ACTEUR",
        hypothesis:
          "Un homme de 35-45 ans à l'écran élargit l'audience sans casser la démonstration, qui ne dépend pas du visage.",
        targetPeriod: "Otono",
        prodStatus: "A_ECRIRE",
        targetWeek: "26W36",
      },
      {
        priority: 2,
        creativeKind: "STATIC",
        productionType: "ITERATION_MINEURE",
        parentCode: "S01.1",
        targetCode: "S01.1.1",
        elementToChange: "COULEUR",
        hypothesis:
          "Un fond froid contraste davantage dans un feed saturé de tons chauds en automne.",
        targetPeriod: "Otono",
        prodStatus: "SCRIPT_OK",
        targetWeek: "26W36",
      },
      {
        priority: 3,
        creativeKind: "VIDEO",
        productionType: "NEW_CONCEPT",
        elementToChange: "ORIGINE",
        hypothesis:
          "Un angle « anti machine de table » attaque le concurrent encombrant plutôt que le film plastique, et parle aux petites cuisines.",
        targetPeriod: "Navidad",
        prodStatus: "A_ECRIRE",
        targetWeek: "26W45",
      },
      {
        priority: 4,
        creativeKind: "VIDEO",
        productionType: "ITERATION_MAJEURE",
        parentCode: "C01.2",
        targetCode: "C01.2.4",
        elementToChange: "LIEU",
        hypothesis:
          "Tourner dans une cuisine étroite rend l'encombrement du produit crédible pour un appartement urbain.",
        targetPeriod: "Navidad",
        prodStatus: "TOURNAGE",
        targetWeek: "26W40",
      },
      {
        priority: 5,
        creativeKind: "STATIC",
        productionType: "NEW_CONCEPT",
        elementToChange: "ORIGINE",
        hypothesis:
          "Une capture de conversation WhatsApp entre mère et fille rend la recommandation crédible sans acteur.",
        targetPeriod: "Navidad",
        prodStatus: "PRET",
        targetWeek: "26W47",
      },
    ],
  });

  const counts = {
    accroches: await prisma.accroche.count(),
    creatives: await prisma.creative.count(),
    semaines: await prisma.weeklyPerf.count(),
    backlog: await prisma.backlogItem.count(),
    familles: await prisma.scriptFamily.count(),
  };
  console.log("Démo insérée :", counts);
}

const run = process.argv.includes("--clear") ? clearDemo : seedDemo;

run()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
