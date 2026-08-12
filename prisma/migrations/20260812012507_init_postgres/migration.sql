-- CreateEnum
CREATE TYPE "CreativeKind" AS ENUM ('VIDEO', 'STATIC');

-- CreateEnum
CREATE TYPE "CreativeStatus" AS ENUM ('BACKLOG', 'LIVE', 'PAUSE', 'WINNER', 'KILL');

-- CreateEnum
CREATE TYPE "Angle" AS ENUM ('Organisation', 'Innovation', 'Famille', 'AstuceFraicheur', 'AntiMachineTable', 'Decouverte', 'Fraicheur', 'OffreRisqueZero');

-- CreateEnum
CREATE TYPE "VideoFormat" AS ENUM ('Testimonial', 'DemoFAQ', 'Storytelling', 'Benefices', 'Comparatif', 'UGCCourt', 'StaticDemo', 'StaticOffer', 'UGCScreen');

-- CreateEnum
CREATE TYPE "Layout" AS ENUM ('L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'L08', 'L09', 'L10');

-- CreateEnum
CREATE TYPE "VisualId" AS ENUM ('V01', 'V02', 'V03', 'V04', 'V05', 'V06', 'V07', 'V08', 'V09', 'V10', 'V11', 'V12');

-- CreateEnum
CREATE TYPE "ChangedElement" AS ENUM ('ORIGINE', 'HOOK', 'ANGLE', 'FORMAT', 'ACTEUR', 'LIEU', 'MONTAGE', 'DUREE', 'PREUVE', 'CTA', 'OFFRE', 'MUSIQUE', 'HEADLINE', 'VISUEL', 'LAYOUT', 'COULEUR', 'BADGE');

-- CreateEnum
CREATE TYPE "AccrocheKind" AS ENUM ('HOOK', 'HEADLINE');

-- CreateEnum
CREATE TYPE "AccrocheType" AS ENUM ('Question', 'ChocVisuel', 'Negatif', 'Chiffre', 'Callout', 'AvantApres', 'Autorite', 'Curiosite', 'Demo');

-- CreateEnum
CREATE TYPE "AccrocheStatus" AS ENUM ('A_TESTER', 'EN_TEST', 'VALIDE', 'MORT');

-- CreateEnum
CREATE TYPE "Period" AS ENUM ('Rebajas_Enero', 'San_Valentin', 'Primavera', 'Semana_Santa', 'Dia_de_la_Madre', 'Pre_Verano', 'Rebajas_Verano', 'Agosto_Vacaciones', 'Vuelta_al_Cole', 'Otono', 'Black_Friday', 'Navidad');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('TEST_EN_COURS', 'KILL', 'SURVEILLER', 'SOUS_MARGE', 'GARDER', 'WINNER');

-- CreateEnum
CREATE TYPE "ProductionType" AS ENUM ('ITERATION_MAJEURE', 'ITERATION_MINEURE', 'NEW_CONCEPT');

-- CreateEnum
CREATE TYPE "ProdStatus" AS ENUM ('A_ECRIRE', 'SCRIPT_OK', 'TOURNAGE', 'MONTAGE', 'PRET', 'LANCE');

-- CreateTable
CREATE TABLE "Creative" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "kind" "CreativeKind" NOT NULL,
    "parentCode" TEXT,
    "generation" INTEGER NOT NULL DEFAULT 0,
    "changedElement" "ChangedElement",
    "angle" "Angle" NOT NULL,
    "videoFormat" "VideoFormat",
    "layout" "Layout",
    "accrocheId" TEXT,
    "durationS" INTEGER,
    "visualId" "VisualId",
    "launchDate" TIMESTAMP(3) NOT NULL,
    "period" "Period" NOT NULL,
    "legacyMetaName" TEXT,
    "videoUrl" TEXT,
    "scriptUrl" TEXT,
    "hook3sUrl" TEXT,
    "imageUrl" TEXT,
    "briefUrl" TEXT,
    "status" "CreativeStatus" NOT NULL DEFAULT 'BACKLOG',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Creative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Accroche" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "kind" "AccrocheKind" NOT NULL,
    "verbatim" TEXT NOT NULL,
    "type" "AccrocheType" NOT NULL,
    "deepDesire" TEXT,
    "previewUrl" TEXT,
    "status" "AccrocheStatus" NOT NULL DEFAULT 'A_TESTER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Accroche_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyPerf" (
    "id" TEXT NOT NULL,
    "creativeId" TEXT NOT NULL,
    "isoWeek" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL,
    "impressions" INTEGER NOT NULL,
    "views3s" INTEGER,
    "thruplays" INTEGER,
    "outboundClicks" INTEGER NOT NULL,
    "lpViews" INTEGER NOT NULL,
    "atc" INTEGER NOT NULL,
    "checkouts" INTEGER NOT NULL,
    "purchases" INTEGER NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyPerf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "psp" DOUBLE PRECISION NOT NULL,
    "vat" DOUBLE PRECISION NOT NULL,
    "otherFees" DOUBLE PRECISION NOT NULL,
    "minMargin" DOUBLE PRECISION NOT NULL,
    "targetMargin" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferLine" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "bundle" INTEGER NOT NULL,
    "cogs" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "salesShare" DOUBLE PRECISION NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OfferLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BacklogItem" (
    "id" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "creativeKind" "CreativeKind" NOT NULL,
    "productionType" "ProductionType" NOT NULL,
    "parentCode" TEXT,
    "targetCode" TEXT,
    "elementToChange" "ChangedElement" NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "targetPeriod" "Period" NOT NULL,
    "prodStatus" "ProdStatus" NOT NULL DEFAULT 'A_ECRIRE',
    "targetWeek" TEXT,
    "briefUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BacklogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScriptFamily" (
    "code" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "promise" TEXT NOT NULL,
    "visibleMechanism" TEXT NOT NULL,
    "narrativeStructure" TEXT NOT NULL,
    "competitiveFrame" TEXT NOT NULL,
    "emotionalDriver" TEXT NOT NULL,
    "neverTouch" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScriptFamily_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Script" (
    "id" TEXT NOT NULL,
    "creativeCode" TEXT NOT NULL,
    "familyCode" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "changedVsParent" JSONB,
    "hookVisual" TEXT,
    "hookDialogue" TEXT,
    "hookScreenText" TEXT,
    "hookType" "AccrocheType",
    "scenes" JSONB NOT NULL,
    "learning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Script_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationScenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL,
    "cpm" DOUBLE PRECISION NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "clickToVisitDrop" DOUBLE PRECISION NOT NULL,
    "cvr" DOUBLE PRECISION NOT NULL,
    "averageOrderValue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialPeriod" (
    "code" "Period" NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "startWeek" INTEGER NOT NULL,
    "endWeek" INTEGER NOT NULL,
    "consumerTension" TEXT NOT NULL,
    "recommendedAngle" "Angle" NOT NULL,
    "recommendedFormat" TEXT NOT NULL,
    "recommendedLayout" "Layout" NOT NULL,
    "memo" TEXT,
    "relaunchNextYear" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CommercialPeriod_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "Creative_code_key" ON "Creative"("code");

-- CreateIndex
CREATE INDEX "Creative_kind_idx" ON "Creative"("kind");

-- CreateIndex
CREATE INDEX "Creative_status_idx" ON "Creative"("status");

-- CreateIndex
CREATE INDEX "Creative_period_idx" ON "Creative"("period");

-- CreateIndex
CREATE INDEX "Creative_angle_idx" ON "Creative"("angle");

-- CreateIndex
CREATE INDEX "Creative_accrocheId_idx" ON "Creative"("accrocheId");

-- CreateIndex
CREATE INDEX "Creative_parentCode_idx" ON "Creative"("parentCode");

-- CreateIndex
CREATE UNIQUE INDEX "Accroche_code_key" ON "Accroche"("code");

-- CreateIndex
CREATE INDEX "Accroche_kind_idx" ON "Accroche"("kind");

-- CreateIndex
CREATE INDEX "Accroche_type_idx" ON "Accroche"("type");

-- CreateIndex
CREATE INDEX "WeeklyPerf_isoWeek_idx" ON "WeeklyPerf"("isoWeek");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyPerf_creativeId_isoWeek_key" ON "WeeklyPerf"("creativeId", "isoWeek");

-- CreateIndex
CREATE INDEX "OfferLine_offerId_idx" ON "OfferLine"("offerId");

-- CreateIndex
CREATE INDEX "BacklogItem_prodStatus_idx" ON "BacklogItem"("prodStatus");

-- CreateIndex
CREATE INDEX "BacklogItem_targetPeriod_idx" ON "BacklogItem"("targetPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "Script_creativeCode_key" ON "Script"("creativeCode");

-- CreateIndex
CREATE INDEX "Script_familyCode_idx" ON "Script"("familyCode");

-- AddForeignKey
ALTER TABLE "Creative" ADD CONSTRAINT "Creative_parentCode_fkey" FOREIGN KEY ("parentCode") REFERENCES "Creative"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Creative" ADD CONSTRAINT "Creative_accrocheId_fkey" FOREIGN KEY ("accrocheId") REFERENCES "Accroche"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyPerf" ADD CONSTRAINT "WeeklyPerf_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "Creative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferLine" ADD CONSTRAINT "OfferLine_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Script" ADD CONSTRAINT "Script_creativeCode_fkey" FOREIGN KEY ("creativeCode") REFERENCES "Creative"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Script" ADD CONSTRAINT "Script_familyCode_fkey" FOREIGN KEY ("familyCode") REFERENCES "ScriptFamily"("code") ON DELETE CASCADE ON UPDATE CASCADE;
