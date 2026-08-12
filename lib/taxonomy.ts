export const ANGLES = [
  "Organisation",
  "Innovation",
  "Famille",
  "AstuceFraicheur",
  "AntiMachineTable",
  "Decouverte",
  "Fraicheur",
  "OffreRisqueZero",
] as const;
export type Angle = (typeof ANGLES)[number];

export const VIDEO_FORMATS = [
  "Testimonial",
  "DemoFAQ",
  "Storytelling",
  "Benefices",
  "Comparatif",
  "UGCCourt",
  "StaticDemo",
  "StaticOffer",
  "UGCScreen",
] as const;
export type VideoFormat = (typeof VIDEO_FORMATS)[number];

export const ACCROCHE_TYPES = [
  "Question",
  "ChocVisuel",
  "Negatif",
  "Chiffre",
  "Callout",
  "AvantApres",
  "Autorite",
  "Curiosite",
  "Demo",
] as const;
export type AccrocheType = (typeof ACCROCHE_TYPES)[number];

export const CHANGED_ELEMENT_VIDEO = [
  "ORIGINE",
  "HOOK",
  "ANGLE",
  "FORMAT",
  "ACTEUR",
  "LIEU",
  "MONTAGE",
  "DUREE",
  "PREUVE",
  "CTA",
  "OFFRE",
  "MUSIQUE",
] as const;
export type ChangedElementVideo = (typeof CHANGED_ELEMENT_VIDEO)[number];

export const CHANGED_ELEMENT_STATIC = [
  "ORIGINE",
  "HEADLINE",
  "VISUEL",
  "LAYOUT",
  "ANGLE",
  "COULEUR",
  "BADGE",
  "PREUVE",
  "OFFRE",
  "CTA",
] as const;
export type ChangedElementStatic = (typeof CHANGED_ELEMENT_STATIC)[number];

export type ChangedElement = ChangedElementVideo | ChangedElementStatic;

export const PERIODS = [
  "Rebajas_Enero",
  "San_Valentin",
  "Primavera",
  "Semana_Santa",
  "Dia_de_la_Madre",
  "Pre_Verano",
  "Rebajas_Verano",
  "Agosto_Vacaciones",
  "Vuelta_al_Cole",
  "Otono",
  "Black_Friday",
  "Navidad",
] as const;
export type Period = (typeof PERIODS)[number];

export const VERDICTS = [
  "TEST_EN_COURS",
  "KILL",
  "SURVEILLER",
  "SOUS_MARGE",
  "GARDER",
  "WINNER",
] as const;
export type Verdict = (typeof VERDICTS)[number];

export const LAYOUTS = [
  "L01",
  "L02",
  "L03",
  "L04",
  "L05",
  "L06",
  "L07",
  "L08",
  "L09",
  "L10",
] as const;
export type Layout = (typeof LAYOUTS)[number];

export const VISUAL_IDS = [
  "V01",
  "V02",
  "V03",
  "V04",
  "V05",
  "V06",
  "V07",
  "V08",
  "V09",
  "V10",
  "V11",
  "V12",
] as const;
export type VisualId = (typeof VISUAL_IDS)[number];

export const CREATIVE_KINDS = ["VIDEO", "STATIC"] as const;
export type CreativeKind = (typeof CREATIVE_KINDS)[number];

export const CREATIVE_STATUSES = [
  "BACKLOG",
  "LIVE",
  "PAUSE",
  "WINNER",
  "KILL",
] as const;
export type CreativeStatus = (typeof CREATIVE_STATUSES)[number];

export const ACCROCHE_KINDS = ["HOOK", "HEADLINE"] as const;
export type AccrocheKind = (typeof ACCROCHE_KINDS)[number];

export const ACCROCHE_STATUSES = [
  "A_TESTER",
  "EN_TEST",
  "VALIDE",
  "MORT",
] as const;
export type AccrocheStatus = (typeof ACCROCHE_STATUSES)[number];

export const PRODUCTION_TYPES = [
  "ITERATION_MAJEURE",
  "ITERATION_MINEURE",
  "NEW_CONCEPT",
] as const;
export type ProductionType = (typeof PRODUCTION_TYPES)[number];

export const PROD_STATUSES = [
  "A_ECRIRE",
  "SCRIPT_OK",
  "TOURNAGE",
  "MONTAGE",
  "PRET",
  "LANCE",
] as const;
export type ProdStatus = (typeof PROD_STATUSES)[number];

// ---------------------------------------------------------------------------
// Display labels. The stored value stays machine-readable; only the UI is
// humanised.
// ---------------------------------------------------------------------------

export const ANGLE_LABEL: Record<Angle, string> = {
  Organisation: "Organisation",
  Innovation: "Innovation",
  Famille: "Famille",
  AstuceFraicheur: "Astuce fraîcheur",
  AntiMachineTable: "Anti machine de table",
  Decouverte: "Découverte",
  Fraicheur: "Fraîcheur",
  OffreRisqueZero: "Offre risque zéro",
};

export const VIDEO_FORMAT_LABEL: Record<VideoFormat, string> = {
  Testimonial: "Témoignage",
  DemoFAQ: "Démo FAQ",
  Storytelling: "Storytelling",
  Benefices: "Bénéfices",
  Comparatif: "Comparatif",
  UGCCourt: "UGC court",
  StaticDemo: "Statique démo",
  StaticOffer: "Statique offre",
  UGCScreen: "UGC screen",
};

export const ACCROCHE_TYPE_LABEL: Record<AccrocheType, string> = {
  Question: "Question",
  ChocVisuel: "Choc visuel",
  Negatif: "Négatif",
  Chiffre: "Chiffre",
  Callout: "Callout",
  AvantApres: "Avant / après",
  Autorite: "Autorité",
  Curiosite: "Curiosité",
  Demo: "Démo",
};

export const PERIOD_LABEL: Record<Period, string> = {
  Rebajas_Enero: "Rebajas Enero",
  San_Valentin: "San Valentín",
  Primavera: "Primavera",
  Semana_Santa: "Semana Santa",
  Dia_de_la_Madre: "Día de la Madre",
  Pre_Verano: "Pre Verano",
  Rebajas_Verano: "Rebajas Verano",
  Agosto_Vacaciones: "Agosto / Vacaciones",
  Vuelta_al_Cole: "Vuelta al Cole",
  Otono: "Otoño",
  Black_Friday: "Black Friday",
  Navidad: "Navidad",
};

export const VERDICT_LABEL: Record<Verdict, string> = {
  TEST_EN_COURS: "Test en cours",
  KILL: "À couper",
  SURVEILLER: "À surveiller",
  SOUS_MARGE: "Sous marge",
  GARDER: "À garder",
  WINNER: "Winner",
};

/**
 * Operational state in Meta — deliberately worded so it never collides with a
 * verdict label. The verdict is computed; the status is what was done about it.
 */
export const CREATIVE_STATUS_LABEL: Record<CreativeStatus, string> = {
  BACKLOG: "En production",
  LIVE: "En diffusion",
  PAUSE: "En pause",
  WINNER: "Scalée",
  KILL: "Coupée",
};

export const ACCROCHE_STATUS_LABEL: Record<AccrocheStatus, string> = {
  A_TESTER: "À tester",
  EN_TEST: "En test",
  VALIDE: "Validée",
  MORT: "Morte",
};

export const PRODUCTION_TYPE_LABEL: Record<ProductionType, string> = {
  ITERATION_MAJEURE: "Itération majeure",
  ITERATION_MINEURE: "Itération mineure",
  NEW_CONCEPT: "Nouveau concept",
};

export const PROD_STATUS_LABEL: Record<ProdStatus, string> = {
  A_ECRIRE: "À écrire",
  SCRIPT_OK: "Script OK",
  TOURNAGE: "Tournage",
  MONTAGE: "Montage",
  PRET: "Prêt",
  LANCE: "Lancé",
};

export const CHANGED_ELEMENT_LABEL: Record<string, string> = {
  ORIGINE: "Origine",
  HOOK: "Hook",
  ANGLE: "Angle",
  FORMAT: "Format",
  ACTEUR: "Acteur",
  LIEU: "Lieu",
  MONTAGE: "Montage",
  DUREE: "Durée",
  PREUVE: "Preuve",
  CTA: "CTA",
  OFFRE: "Offre",
  MUSIQUE: "Musique",
  HEADLINE: "Headline",
  VISUEL: "Visuel",
  LAYOUT: "Layout",
  COULEUR: "Couleur",
  BADGE: "Badge",
};

export const LAYOUT_LABEL: Record<Layout, string> = {
  L01: "Avant / après (J1 vs J7)",
  L02: "Comparatif sacs et film plastique",
  L03: "Titre pleine largeur + produit détouré",
  L04: "Capture d'avis ou de conversation",
  L05: "Flat lay frigo ou plan de travail",
  L06: "Zoom mécanisme",
  L07: "Badge offre (prix barré, garantie)",
  L08: "Bénéfices numérotés sur visuel",
  L09: "Format natif feed",
  L10: "Chronologie J1 → J7 → J14",
};

export const CHANGED_ELEMENTS_FOR_KIND: Record<
  CreativeKind,
  readonly string[]
> = {
  VIDEO: CHANGED_ELEMENT_VIDEO,
  STATIC: CHANGED_ELEMENT_STATIC,
};

// Verdicts ordered worst -> best. Used for sorting and for the ramp.
export const VERDICT_RANK: Record<Verdict, number> = {
  TEST_EN_COURS: 0,
  KILL: 1,
  SURVEILLER: 2,
  SOUS_MARGE: 3,
  GARDER: 4,
  WINNER: 5,
};

export const VERDICT_COLOR_VAR: Record<Verdict, string> = {
  TEST_EN_COURS: "var(--verdict-test)",
  KILL: "var(--verdict-kill)",
  SURVEILLER: "var(--verdict-surveiller)",
  SOUS_MARGE: "var(--verdict-sous-marge)",
  GARDER: "var(--verdict-garder)",
  WINNER: "var(--verdict-winner)",
};
