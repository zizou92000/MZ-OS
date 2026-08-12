import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const PERIODS = [
  {
    code: "Rebajas_Enero",
    orderIndex: 1,
    startWeek: 1,
    endWeek: 6,
    consumerTension:
      "Après les fêtes : culpabilité du gaspillage, budget serré, frigo plein de restes",
    recommendedAngle: "Organisation",
    recommendedFormat: "Comparatif",
    recommendedLayout: "L01",
  },
  {
    code: "San_Valentin",
    orderIndex: 2,
    startWeek: 6,
    endWeek: 7,
    consumerTension:
      "Faible pertinence produit, CPM élevé — éviter sauf offre agressive",
    recommendedAngle: "OffreRisqueZero",
    recommendedFormat: "StaticOffer",
    recommendedLayout: "L07",
  },
  {
    code: "Primavera",
    orderIndex: 3,
    startWeek: 8,
    endWeek: 12,
    consumerTension:
      "Reprise du batch cooking, ménage de printemps, réorganisation des placards",
    recommendedAngle: "Organisation",
    recommendedFormat: "DemoFAQ",
    recommendedLayout: "L05",
  },
  {
    code: "Semana_Santa",
    orderIndex: 4,
    startWeek: 13,
    endWeek: 15,
    consumerTension:
      "Grosses courses avant fermetures, repas de famille, restes en volume",
    recommendedAngle: "Famille",
    recommendedFormat: "Storytelling",
    recommendedLayout: "L05",
  },
  {
    code: "Dia_de_la_Madre",
    orderIndex: 5,
    startWeek: 17,
    endWeek: 19,
    consumerTension:
      "Achat cadeau : angle « offert à maman », panier moyen plus élevé",
    recommendedAngle: "Famille",
    recommendedFormat: "Testimonial",
    recommendedLayout: "L07",
  },
  {
    code: "Pre_Verano",
    orderIndex: 6,
    startWeek: 20,
    endWeek: 23,
    consumerTension:
      "La chaleur monte, les aliments tournent plus vite, anxiété fraîcheur réelle",
    recommendedAngle: "Fraicheur",
    recommendedFormat: "Comparatif",
    recommendedLayout: "L01",
  },
  {
    code: "Rebajas_Verano",
    orderIndex: 7,
    startWeek: 26,
    endWeek: 31,
    consumerTension:
      "Soldes officielles : CPM élevé mais intention d'achat maximale",
    recommendedAngle: "OffreRisqueZero",
    recommendedFormat: "StaticOffer",
    recommendedLayout: "L07",
  },
  {
    code: "Agosto_Vacaciones",
    orderIndex: 8,
    startWeek: 32,
    endWeek: 35,
    consumerTension:
      "Trafic bas, CPM bas — la fenêtre idéale pour tester à moindre coût",
    recommendedAngle: "Decouverte",
    recommendedFormat: "UGCCourt",
    recommendedLayout: "L09",
  },
  {
    code: "Vuelta_al_Cole",
    orderIndex: 9,
    startWeek: 36,
    endWeek: 39,
    consumerTension:
      "Retour à la routine : meal prep, lunchbox, organisation de la semaine",
    recommendedAngle: "Organisation",
    recommendedFormat: "DemoFAQ",
    recommendedLayout: "L08",
  },
  {
    code: "Otono",
    orderIndex: 10,
    startWeek: 40,
    endWeek: 45,
    consumerTension:
      "Batch cooking, soupes, congélation — pic naturel d'usage du produit",
    recommendedAngle: "AstuceFraicheur",
    recommendedFormat: "Comparatif",
    recommendedLayout: "L10",
  },
  {
    code: "Black_Friday",
    orderIndex: 11,
    startWeek: 46,
    endWeek: 48,
    consumerTension:
      "CPM au plus haut de l'année, ne fonctionne que porté par une offre réelle",
    recommendedAngle: "OffreRisqueZero",
    recommendedFormat: "StaticOffer",
    recommendedLayout: "L07",
  },
  {
    code: "Navidad",
    orderIndex: 12,
    startWeek: 49,
    endWeek: 52,
    consumerTension:
      "Achats massifs, restes de fêtes, cadeau utile — meilleur ROAS potentiel",
    recommendedAngle: "Famille",
    recommendedFormat: "Storytelling",
    recommendedLayout: "L05",
  },
] as const;

const OFFERS = [
  {
    name: "Offre 1 — Packs 1/2/3",
    isActive: true,
    psp: 0.03,
    vat: 0,
    otherFees: 0,
    minMargin: 0.15,
    targetMargin: 0.2,
    lines: [
      { bundle: 1, cogs: 9.08, price: 39.9, salesShare: 0.7 },
      { bundle: 2, cogs: 12.72, price: 73.9, salesShare: 0.2 },
      { bundle: 3, cogs: 15.03, price: 98.9, salesShare: 0.1 },
    ],
  },
  {
    name: "Offre 2 — Prix unique, COGS fixe",
    isActive: false,
    psp: 0.03,
    vat: 0,
    otherFees: 0,
    minMargin: 0.15,
    targetMargin: 0.2,
    lines: [
      { bundle: 1, cogs: 19.9, price: 69.0, salesShare: 0.1 },
      { bundle: 1, cogs: 19.9, price: 79.99, salesShare: 0.2 },
      { bundle: 1, cogs: 19.9, price: 89.99, salesShare: 0.7 },
    ],
  },
  {
    name: "Offre 3 — COGS indexé au prix",
    isActive: false,
    psp: 0.03,
    vat: 0,
    otherFees: 0,
    minMargin: 0.15,
    targetMargin: 0.2,
    lines: [
      { bundle: 1, cogs: 16.34, price: 69.0, salesShare: 0.1 },
      { bundle: 1, cogs: 18.08, price: 79.99, salesShare: 0.2 },
      { bundle: 1, cogs: 19.67, price: 89.99, salesShare: 0.7 },
    ],
  },
] as const;

async function main() {
  for (const p of PERIODS) {
    const { code, ...rest } = p;
    await prisma.commercialPeriod.upsert({
      where: { code },
      update: rest,
      create: { code, ...rest },
    });
  }
  console.log(`Périodes commerciales : ${PERIODS.length}`);

  const existingOffers = await prisma.offer.count();
  if (existingOffers === 0) {
    for (const o of OFFERS) {
      const { lines, ...offer } = o;
      await prisma.offer.create({
        data: {
          ...offer,
          lines: {
            create: lines.map((l, position) => ({ ...l, position })),
          },
        },
      });
    }
    console.log(`Offres : ${OFFERS.length} (offre 1 active)`);
  } else {
    console.log(`Offres : ${existingOffers} déjà en base, non touchées`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
