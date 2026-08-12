"use client";

import { useMemo, useState, useTransition } from "react";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteScenario, saveScenario } from "@/lib/actions/scenarios";
import { integer, money, percent, ratio, signedPercent } from "@/lib/format";
import { diagnose, simulate, type ScenarioInput } from "@/lib/simulator";
import { cn } from "@/lib/utils";

export type ScenarioRecord = ScenarioInput & { id: string; name: string };

export type RealBaseline = {
  spend: number;
  cpm: number | null;
  ctr: number | null;
  clickToVisitDrop: number | null;
  cvr: number | null;
  aov: number | null;
  roas: number | null;
  previousCpm: number | null;
  previousCtr: number | null;
} | null;

const DEFAULTS: ScenarioInput = {
  budget: 500,
  cpm: 12,
  ctr: 0.012,
  clickToVisitDrop: 0.12,
  cvr: 0.018,
  averageOrderValue: 52.6,
};

export function Simulator({
  roasTarget,
  scenarios,
  real,
}: {
  roasTarget: number | null;
  scenarios: ScenarioRecord[];
  real: RealBaseline;
}) {
  const [input, setInput] = useState<ScenarioInput>(DEFAULTS);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  const out = useMemo(() => simulate(input, roasTarget), [input, roasTarget]);
  const diagnostics = useMemo(
    () =>
      diagnose(
        input,
        out,
        real?.previousCpm != null && real?.previousCtr != null
          ? { cpm: real.previousCpm, ctr: real.previousCtr }
          : null,
      ),
    [input, out, real],
  );

  const realOut = useMemo(() => {
    if (!real || real.cpm === null || real.ctr === null) return null;
    return simulate(
      {
        budget: real.spend,
        cpm: real.cpm,
        ctr: real.ctr,
        clickToVisitDrop: real.clickToVisitDrop ?? 0,
        cvr: real.cvr ?? 0,
        averageOrderValue: real.aov ?? 0,
      },
      roasTarget,
    );
  }, [real, roasTarget]);

  const patch = (v: Partial<ScenarioInput>) => setInput((p) => ({ ...p, ...v }));

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <div className="space-y-4">
        <Card className="gap-0 py-3">
          <CardHeader className="px-3 pb-2">
            <CardTitle className="text-xs font-medium">Hypothèses</CardTitle>
            <CardDescription className="text-[11px]">
              Six champs saisis, douze calculés.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 px-3">
            <Field
              label="Budget"
              suffix="€"
              value={input.budget}
              step={10}
              onChange={(v) => patch({ budget: v })}
            />
            <Field
              label="CPM"
              suffix="€"
              value={input.cpm}
              step={0.5}
              onChange={(v) => patch({ cpm: v })}
            />
            <Field
              label="CTR"
              suffix="%"
              value={round(input.ctr * 100, 3)}
              step={0.05}
              onChange={(v) => patch({ ctr: v / 100 })}
            />
            <Field
              label="Perte clic → visite"
              suffix="%"
              value={round(input.clickToVisitDrop * 100, 2)}
              step={0.5}
              onChange={(v) => patch({ clickToVisitDrop: v / 100 })}
            />
            <Field
              label="Taux de conversion"
              suffix="%"
              value={round(input.cvr * 100, 3)}
              step={0.05}
              onChange={(v) => patch({ cvr: v / 100 })}
            />
            <Field
              label="Panier moyen"
              suffix="€"
              value={input.averageOrderValue}
              step={1}
              onChange={(v) => patch({ averageOrderValue: v })}
            />

            <Separator className="my-1" />

            <div className="flex gap-1.5">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom du scénario"
                className="h-7 text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-7 shrink-0 px-2"
                disabled={pending || !name.trim()}
                onClick={() =>
                  startTransition(async () => {
                    const res = await saveScenario({ ...input, name });
                    if (res.ok) {
                      toast.success("Scénario enregistré");
                      setName("");
                    } else toast.error(res.error);
                  })
                }
              >
                <Save className="size-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {scenarios.length > 0 && (
          <Card className="gap-0 py-3">
            <CardHeader className="px-3 pb-2">
              <CardTitle className="text-xs font-medium">
                Scénarios enregistrés
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 px-2">
              {scenarios.map((s) => (
                <div key={s.id} className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setInput({
                        budget: s.budget,
                        cpm: s.cpm,
                        ctr: s.ctr,
                        clickToVisitDrop: s.clickToVisitDrop,
                        cvr: s.cvr,
                        averageOrderValue: s.averageOrderValue,
                      })
                    }
                    className="hover:bg-accent min-w-0 flex-1 truncate rounded-md px-2 py-1 text-left text-xs"
                  >
                    {s.name}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0"
                    onClick={() =>
                      startTransition(async () => {
                        await deleteScenario(s.id);
                        toast.success("Scénario supprimé");
                      })
                    }
                  >
                    <Trash2 className="size-3" />
                    <span className="sr-only">Supprimer</span>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <Card className="gap-0 py-4">
          <CardHeader className="px-4 pb-3">
            <CardTitle className="text-sm">Projection</CardTitle>
            <CardDescription className="text-xs">
              La ligne « réel » vient des données saisies, pas du modèle.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-8 text-[11px]">Étape</TableHead>
                  <TableHead className="h-8 text-right text-[11px]">
                    Projection
                  </TableHead>
                  <TableHead className="h-8 text-right text-[11px]">
                    Réel
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <FunnelRow
                  label="Impressions"
                  projected={integer(out.impressions)}
                  real={realOut ? integer(realOut.impressions) : "—"}
                />
                <FunnelRow
                  label="Clics sortants"
                  projected={integer(out.clicks)}
                  real={realOut ? integer(realOut.clicks) : "—"}
                />
                <FunnelRow
                  label="Visites"
                  projected={integer(out.visits)}
                  real={realOut ? integer(realOut.visits) : "—"}
                />
                <FunnelRow
                  label="Achats"
                  projected={ratio(out.purchases, 1)}
                  real={realOut ? ratio(realOut.purchases, 1) : "—"}
                />
                <FunnelRow
                  label="Chiffre d'affaires"
                  projected={money(out.revenue)}
                  real={realOut ? money(realOut.revenue) : "—"}
                />
                <FunnelRow
                  label="CPC"
                  projected={money(out.cpc, true)}
                  real={realOut ? money(realOut.cpc, true) : "—"}
                />
                <FunnelRow
                  label="CPA"
                  projected={money(out.cpa, true)}
                  real={realOut ? money(realOut.cpa, true) : "—"}
                />
                <FunnelRow
                  label="ROAS"
                  projected={ratio(out.roas)}
                  real={real?.roas != null ? ratio(real.roas) : "—"}
                  emphasise
                />
                <FunnelRow
                  label="CVR requis pour la cible"
                  projected={percent(out.requiredCvr, 2)}
                  real="—"
                />
                <FunnelRow
                  label="Écart de CVR"
                  projected={signedPercent(out.cvrGap)}
                  real="—"
                  emphasise
                />
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {diagnostics.map((d) => (
            <Alert
              key={d.headline}
              variant={d.tone === "critical" ? "destructive" : "default"}
              className={cn(
                d.tone === "good" && "border-verdict-garder/40",
                d.tone === "warning" && "border-verdict-winner/40",
              )}
            >
              <AlertTitle className="text-xs">{d.headline}</AlertTitle>
              <AlertDescription className="text-xs">{d.detail}</AlertDescription>
            </Alert>
          ))}
        </div>
      </div>
    </div>
  );
}

function FunnelRow({
  label,
  projected,
  real,
  emphasise,
}: {
  label: string;
  projected: string;
  real: string;
  emphasise?: boolean;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className={cn("py-1.5 text-xs", emphasise && "font-medium")}>
        {label}
      </TableCell>
      <TableCell
        className={cn(
          "num py-1.5 text-right text-xs",
          emphasise && "font-semibold",
        )}
      >
        {projected}
      </TableCell>
      <TableCell className="num text-muted-foreground py-1.5 text-right text-xs">
        {real}
      </TableCell>
    </TableRow>
  );
}

function Field({
  label,
  value,
  onChange,
  step,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
  suffix: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="num h-7 pr-6 text-sm"
        />
        <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs">
          {suffix}
        </span>
      </div>
    </div>
  );
}

function round(value: number, digits: number) {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}
