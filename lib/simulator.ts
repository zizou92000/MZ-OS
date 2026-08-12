export type ScenarioInput = {
  budget: number;
  cpm: number;
  ctr: number;
  clickToVisitDrop: number;
  cvr: number;
  averageOrderValue: number;
};

export type ScenarioOutput = {
  impressions: number;
  clicks: number;
  visits: number;
  lostVisits: number;
  lostSpend: number;
  purchases: number;
  revenue: number;
  roas: number | null;
  cpa: number | null;
  cpc: number | null;
  requiredCvr: number | null;
  cvrGap: number | null;
};

export function simulate(
  input: ScenarioInput,
  roasTarget: number | null,
): ScenarioOutput {
  const impressions = input.cpm > 0 ? (input.budget / input.cpm) * 1000 : 0;
  const clicks = impressions * input.ctr;
  const visits = clicks * (1 - input.clickToVisitDrop);
  const lostVisits = clicks - visits;
  const purchases = visits * input.cvr;
  const revenue = purchases * input.averageOrderValue;

  const requiredCvr =
    roasTarget !== null && visits > 0 && input.averageOrderValue > 0
      ? (roasTarget * input.budget) / (visits * input.averageOrderValue)
      : null;

  return {
    impressions,
    clicks,
    visits,
    lostVisits,
    lostSpend: clicks > 0 ? input.budget * (lostVisits / clicks) : 0,
    purchases,
    revenue,
    roas: input.budget > 0 ? revenue / input.budget : null,
    cpa: purchases > 0 ? input.budget / purchases : null,
    cpc: clicks > 0 ? input.budget / clicks : null,
    requiredCvr,
    cvrGap: requiredCvr === null ? null : input.cvr - requiredCvr,
  };
}

export type DiagnosticTone = "critical" | "warning" | "neutral" | "good";

export type Diagnostic = {
  tone: DiagnosticTone;
  headline: string;
  detail: string;
};

const GOOD_CTR = 0.01;
const LEAK_LIMIT = 0.15;

/**
 * The written diagnosis is the only output of this module that no raw metric
 * states on its own, so it is phrased as a conclusion, not a statistic.
 */
export function diagnose(
  input: ScenarioInput,
  out: ScenarioOutput,
  previous?: { cpm: number; ctr: number } | null,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  if (out.cvrGap !== null && out.cvrGap < 0 && input.ctr >= GOOD_CTR) {
    diagnostics.push({
      tone: "critical",
      headline: "Le goulot est la boutique, pas la créative",
      detail: `La créative amène ${Math.round(out.visits)} visites avec un CTR de ${(input.ctr * 100).toFixed(2)} %. À ce trafic, il faut ${((out.requiredCvr ?? 0) * 100).toFixed(2)} % de conversion pour tenir la cible, et la boutique en fait ${(input.cvr * 100).toFixed(2)} %. Produire une créative de plus ne comblera pas cet écart.`,
    });
  } else if (out.cvrGap !== null && out.cvrGap < 0) {
    diagnostics.push({
      tone: "warning",
      headline: "Cible hors d'atteinte à ce CTR",
      detail: `Il manque ${Math.abs(out.cvrGap * 100).toFixed(2)} points de conversion. Le CTR de ${(input.ctr * 100).toFixed(2)} % est trop bas pour compenser : le levier est la créative.`,
    });
  } else if (out.cvrGap !== null && out.cvrGap >= 0) {
    diagnostics.push({
      tone: "good",
      headline: "Scénario au-dessus de la cible",
      detail: `${(out.cvrGap * 100).toFixed(2)} points de conversion en réserve au-dessus du minimum requis.`,
    });
  }

  if (input.clickToVisitDrop > LEAK_LIMIT) {
    diagnostics.push({
      tone: "critical",
      headline: "Perte technique avant affichage",
      detail: `${(input.clickToVisitDrop * 100).toFixed(1)} % des clics n'atteignent jamais la page : ${out.lostSpend.toFixed(2)} € brûlés sur ce budget. C'est un problème de vitesse ou de redirection, pas de créative.`,
    });
  }

  if (previous) {
    const cpmUp = input.cpm > previous.cpm * 1.1;
    const ctrDown = input.ctr < previous.ctr * 0.9;
    const ctrStable = Math.abs(input.ctr - previous.ctr) <= previous.ctr * 0.1;
    const cpmStable = Math.abs(input.cpm - previous.cpm) <= previous.cpm * 0.1;

    if (cpmUp && ctrStable) {
      diagnostics.push({
        tone: "warning",
        headline: "Fatigue d'audience",
        detail:
          "Le CPM monte à CTR stable : la créative tient, c'est l'audience qui sature. Élargir le ciblage avant de reproduire.",
      });
    } else if (cpmStable && ctrDown) {
      diagnostics.push({
        tone: "warning",
        headline: "Fatigue créative",
        detail:
          "Le CTR baisse à CPM stable : l'audience est intacte, c'est l'accroche qui s'use. Itérer sur le hook.",
      });
    }
  }

  return diagnostics;
}
