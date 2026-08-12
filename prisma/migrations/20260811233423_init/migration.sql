-- CreateTable
CREATE TABLE "Creative" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "parentCode" TEXT,
    "generation" INTEGER NOT NULL DEFAULT 0,
    "changedElement" TEXT,
    "angle" TEXT NOT NULL,
    "videoFormat" TEXT,
    "layout" TEXT,
    "accrocheId" TEXT,
    "durationS" INTEGER,
    "visualId" TEXT,
    "launchDate" DATETIME NOT NULL,
    "period" TEXT NOT NULL,
    "legacyMetaName" TEXT,
    "videoUrl" TEXT,
    "scriptUrl" TEXT,
    "hook3sUrl" TEXT,
    "imageUrl" TEXT,
    "briefUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BACKLOG',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Creative_parentCode_fkey" FOREIGN KEY ("parentCode") REFERENCES "Creative" ("code") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "Creative_accrocheId_fkey" FOREIGN KEY ("accrocheId") REFERENCES "Accroche" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Accroche" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "verbatim" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "deepDesire" TEXT,
    "previewUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'A_TESTER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WeeklyPerf" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creativeId" TEXT NOT NULL,
    "isoWeek" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "spend" REAL NOT NULL,
    "impressions" INTEGER NOT NULL,
    "views3s" INTEGER,
    "thruplays" INTEGER,
    "outboundClicks" INTEGER NOT NULL,
    "lpViews" INTEGER NOT NULL,
    "atc" INTEGER NOT NULL,
    "checkouts" INTEGER NOT NULL,
    "purchases" INTEGER NOT NULL,
    "revenue" REAL NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WeeklyPerf_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "Creative" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "psp" REAL NOT NULL,
    "vat" REAL NOT NULL,
    "otherFees" REAL NOT NULL,
    "minMargin" REAL NOT NULL,
    "targetMargin" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OfferLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "offerId" TEXT NOT NULL,
    "bundle" INTEGER NOT NULL,
    "cogs" REAL NOT NULL,
    "price" REAL NOT NULL,
    "salesShare" REAL NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "OfferLine_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BacklogItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "creativeKind" TEXT NOT NULL,
    "productionType" TEXT NOT NULL,
    "parentCode" TEXT,
    "targetCode" TEXT,
    "elementToChange" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "targetPeriod" TEXT NOT NULL,
    "prodStatus" TEXT NOT NULL DEFAULT 'A_ECRIRE',
    "targetWeek" TEXT,
    "briefUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScriptFamily" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "nickname" TEXT NOT NULL,
    "promise" TEXT NOT NULL,
    "visibleMechanism" TEXT NOT NULL,
    "narrativeStructure" TEXT NOT NULL,
    "competitiveFrame" TEXT NOT NULL,
    "emotionalDriver" TEXT NOT NULL,
    "neverTouch" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Script" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creativeCode" TEXT NOT NULL,
    "familyCode" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "changedVsParent" JSONB,
    "hookVisual" TEXT,
    "hookDialogue" TEXT,
    "hookScreenText" TEXT,
    "hookType" TEXT,
    "scenes" JSONB NOT NULL,
    "learning" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Script_creativeCode_fkey" FOREIGN KEY ("creativeCode") REFERENCES "Creative" ("code") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Script_familyCode_fkey" FOREIGN KEY ("familyCode") REFERENCES "ScriptFamily" ("code") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SimulationScenario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "budget" REAL NOT NULL,
    "cpm" REAL NOT NULL,
    "ctr" REAL NOT NULL,
    "clickToVisitDrop" REAL NOT NULL,
    "cvr" REAL NOT NULL,
    "averageOrderValue" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CommercialPeriod" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "orderIndex" INTEGER NOT NULL,
    "startWeek" INTEGER NOT NULL,
    "endWeek" INTEGER NOT NULL,
    "consumerTension" TEXT NOT NULL,
    "recommendedAngle" TEXT NOT NULL,
    "recommendedFormat" TEXT NOT NULL,
    "recommendedLayout" TEXT NOT NULL,
    "memo" TEXT,
    "relaunchNextYear" BOOLEAN NOT NULL DEFAULT false
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
