"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, CircleCheck, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  groupVerbatims,
  importAccroches,
  importCreatives,
  importPerformance,
  type VerbatimGroup,
} from "@/lib/actions/migration";
import { parsePaste } from "@/lib/paste-import";
import { LEGACY_WEEK } from "@/lib/derive";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Accroches" },
  { id: 2, label: "Créatives" },
  { id: 3, label: "Historique" },
  { id: 4, label: "Terminé" },
] as const;

export function MigrationWizard({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();

  const [hookText, setHookText] = useState("");
  const [groups, setGroups] = useState<VerbatimGroup[] | null>(null);

  const [creativeCsv, setCreativeCsv] = useState("");
  const [creativeCount, setCreativeCount] = useState(0);

  const [perfCsv, setPerfCsv] = useState("");
  const [cumulative, setCumulative] = useState(true);
  const [perfResult, setPerfResult] = useState<{
    imported: number;
    unknown: string[];
  } | null>(null);

  const analyseHooks = () =>
    startTransition(async () => {
      const result = await groupVerbatims(hookText, "HOOK");
      setGroups(result);
    });

  const saveHooks = () =>
    startTransition(async () => {
      if (!groups) return;
      const res = await importAccroches(
        groups.map((g) => ({
          code: g.suggestedCode,
          kind: "HOOK" as const,
          verbatim: g.canonical,
          type: "Question" as const,
        })),
      );
      if (res.ok) {
        toast.success(`${res.created} accroches importées`);
        setStep(2);
      } else toast.error(res.error);
    });

  const saveCreatives = () =>
    startTransition(async () => {
      const parsed = parsePaste(creativeCsv);
      const rows = parsed.rows
        .map((cells) => {
          const [code, kind, angle, slot, period, launchDate, legacyMetaName, accrocheCode] =
            cells;
          if (!code) return null;
          const isVideo = (kind ?? "VIDEO").toUpperCase() === "VIDEO";
          return {
            code: code.trim(),
            kind: (isVideo ? "VIDEO" : "STATIC") as "VIDEO" | "STATIC",
            angle: (angle ?? "Organisation").trim(),
            videoFormat: isVideo ? (slot ?? "").trim() || null : null,
            layout: isVideo ? null : (slot ?? "").trim() || null,
            period: (period ?? "Otono").trim(),
            launchDate: launchDate || new Date().toISOString(),
            legacyMetaName: legacyMetaName?.trim() || null,
            accrocheCode: accrocheCode?.trim() || null,
            status: "LIVE" as const,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      const res = await importCreatives(rows as never);
      if (res.ok) {
        setCreativeCount(res.created);
        toast.success(`${res.created} créatives importées`);
        setStep(3);
      } else toast.error(res.error);
    });

  const savePerf = () =>
    startTransition(async () => {
      const parsed = parsePaste(perfCsv);
      const rows = parsed.rows
        .map((cells) => {
          const [code, spend, impressions, clicks, lpViews, purchases, revenue] =
            cells;
          if (!code) return null;
          const n = (v: string | undefined) => Number((v ?? "0").replace(",", ".")) || 0;
          return {
            code: code.trim(),
            spend: n(spend),
            impressions: Math.round(n(impressions)),
            outboundClicks: Math.round(n(clicks)),
            lpViews: Math.round(n(lpViews)),
            atc: 0,
            checkouts: 0,
            purchases: Math.round(n(purchases)),
            revenue: n(revenue),
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      const res = await importPerformance(rows, cumulative);
      if (res.ok) {
        setPerfResult({ imported: res.imported, unknown: res.unknown });
        toast.success(`${res.imported} lignes importées`);
        setStep(4);
      } else toast.error(res.error);
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-sm">
            Migrer depuis les fichiers Google
          </DialogTitle>
          <DialogDescription className="text-xs">
            Trois imports, dans l&apos;ordre : les accroches, les créatives,
            puis l&apos;historique.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-1">
          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-1 items-center gap-1">
              <div
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium",
                  step === s.id
                    ? "bg-primary text-primary-foreground"
                    : step > s.id
                      ? "bg-verdict-garder/20 text-verdict-garder"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {step > s.id ? <CircleCheck className="size-3" /> : s.id}
              </div>
              <span
                className={cn(
                  "text-[11px]",
                  step === s.id ? "font-medium" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
              {s.id < STEPS.length && (
                <div className="bg-border h-px flex-1" />
              )}
            </div>
          ))}
        </div>

        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle className="text-xs">
            Ne renomme jamais les annonces existantes dans Meta
          </AlertTitle>
          <AlertDescription className="text-xs">
            Renommer une annonce en diffusion remet son apprentissage à zéro. La
            colonne <code className="code">legacyMetaName</code> garde le nom
            actuel ; la nouvelle nomenclature ne s&apos;applique qu&apos;aux
            créatives à venir.
          </AlertDescription>
        </Alert>

        <ScrollArea className="max-h-[46vh]">
          {step === 1 && (
            <div className="space-y-2 pr-3">
              <Label className="text-xs">
                Colle la liste des verbatims espagnols, un par ligne
              </Label>
              <Textarea
                value={hookText}
                onChange={(e) => {
                  setHookText(e.target.value);
                  setGroups(null);
                }}
                rows={8}
                className="text-xs"
                placeholder={"¿Sabes cuánto tiras a la basura?\nMira lo que le pasa a este aguacate…"}
              />
              {groups && (
                <div className="space-y-1">
                  <p className="text-xs font-medium">
                    {groups.length} accroches distinctes ·{" "}
                    {groups.reduce((n, g) => n + g.duplicates.length, 0)} doublons
                    regroupés
                  </p>
                  <div className="divide-border divide-y rounded-md border">
                    {groups.map((g) => (
                      <div
                        key={g.suggestedCode}
                        className="flex items-center gap-2 px-2 py-1"
                      >
                        <code className="code w-12 shrink-0 text-[11px]">
                          {g.suggestedCode}
                        </code>
                        <span className="flex-1 truncate text-xs">
                          {g.canonical}
                        </span>
                        {g.duplicates.length > 0 && (
                          <Badge
                            variant="outline"
                            className="rounded-sm px-1 text-[9px]"
                          >
                            +{g.duplicates.length}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2 pr-3">
              <Label className="text-xs">
                Créatives — CSV : code, type, angle, format ou layout, période,
                date de lancement, nom Meta actuel, code accroche
              </Label>
              <Textarea
                value={creativeCsv}
                onChange={(e) => setCreativeCsv(e.target.value)}
                rows={8}
                className="code text-xs"
                placeholder={
                  "code,kind,angle,slot,period,launchDate,legacyMetaName,accroche\nC01,VIDEO,Organisation,DemoFAQ,Vuelta_al_Cole,2026-07-06,Video antiguo 3,H01"
                }
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2 pr-3">
              <Label className="text-xs">
                Historique — CSV : code, spend, impressions, clics, visites,
                achats, CA
              </Label>
              <Textarea
                value={perfCsv}
                onChange={(e) => setPerfCsv(e.target.value)}
                rows={7}
                className="code text-xs"
                placeholder={"code,spend,impressions,clicks,lpViews,purchases,revenue\nC01,240.50,21000,260,229,9,473.40"}
              />
              <div className="flex items-start gap-2 rounded-md border p-2">
                <Switch
                  id="cumulative"
                  checked={cumulative}
                  onCheckedChange={setCumulative}
                />
                <div>
                  <Label htmlFor="cumulative" className="text-xs">
                    Données cumulées, pas hebdomadaires
                  </Label>
                  <p className="text-muted-foreground text-[11px]">
                    Crée une ligne unique en semaine{" "}
                    <code className="code">{LEGACY_WEEK}</code>, exclue des
                    courbes hebdomadaires mais comptée dans les cumuls et donc
                    dans les verdicts.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-2 pr-3">
              <Alert>
                <CircleCheck />
                <AlertTitle className="text-xs">Migration terminée</AlertTitle>
                <AlertDescription className="text-xs">
                  {creativeCount} créatives et {perfResult?.imported ?? 0} lignes
                  d&apos;historique importées.
                  {perfResult && perfResult.unknown.length > 0 && (
                    <span className="text-destructive mt-1 block">
                      {perfResult.unknown.length} codes inconnus ignorés :{" "}
                      <code className="code">
                        {perfResult.unknown.slice(0, 8).join(", ")}
                      </code>
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            disabled={step === 1 || pending}
            onClick={() => setStep((s) => s - 1)}
          >
            <ArrowLeft className="size-3.5" />
            Retour
          </Button>

          {step === 1 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={analyseHooks}
                disabled={pending || !hookText.trim()}
              >
                Analyser
              </Button>
              <Button size="sm" onClick={saveHooks} disabled={pending || !groups}>
                Importer
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          )}
          {step === 2 && (
            <Button
              size="sm"
              onClick={saveCreatives}
              disabled={pending || !creativeCsv.trim()}
            >
              Importer
              <ArrowRight className="size-3.5" />
            </Button>
          )}
          {step === 3 && (
            <Button
              size="sm"
              onClick={savePerf}
              disabled={pending || !perfCsv.trim()}
            >
              Importer
              <ArrowRight className="size-3.5" />
            </Button>
          )}
          {step === 4 && (
            <Button size="sm" onClick={() => setOpen(false)}>
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
