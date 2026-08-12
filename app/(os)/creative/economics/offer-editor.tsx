"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VerdictBadge } from "@/components/verdict-badge";
import {
  activateOffer,
  previewOfferSwitch,
  saveOffer,
} from "@/lib/actions/offers";
import { computeThresholds, UNREACHABLE_MARGIN } from "@/lib/economics";
import { money, percent, ratio } from "@/lib/format";
import type { Verdict } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

export type OfferRecord = {
  id: string;
  name: string;
  isActive: boolean;
  psp: number;
  vat: number;
  otherFees: number;
  minMargin: number;
  targetMargin: number;
  lines: {
    id: string;
    bundle: number;
    cogs: number;
    price: number;
    salesShare: number;
  }[];
};

type Draft = {
  id?: string;
  name: string;
  psp: number;
  vat: number;
  otherFees: number;
  minMargin: number;
  targetMargin: number;
  lines: { bundle: number; cogs: number; price: number; salesShare: number }[];
};

function toDraft(offer: OfferRecord): Draft {
  return {
    id: offer.id,
    name: offer.name,
    psp: offer.psp,
    vat: offer.vat,
    otherFees: offer.otherFees,
    minMargin: offer.minMargin,
    targetMargin: offer.targetMargin,
    lines: offer.lines.map((l) => ({
      bundle: l.bundle,
      cogs: l.cogs,
      price: l.price,
      salesShare: l.salesShare,
    })),
  };
}

const NEW_OFFER: Draft = {
  name: "",
  psp: 0.03,
  vat: 0,
  otherFees: 0,
  minMargin: 0.15,
  targetMargin: 0.2,
  lines: [{ bundle: 1, cogs: 0, price: 0, salesShare: 1 }],
};

type SwitchPreview = {
  offerName: string;
  thresholds: {
    roasBreakEven: number | null;
    roasMinMargin: number | null;
    roasTarget: number | null;
  };
  changes: { code: string; from: Verdict; to: Verdict }[];
  total: number;
  targetId: string;
};

export function OfferEditor({ offers }: { offers: OfferRecord[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    offers.find((o) => o.isActive)?.id ?? offers[0]?.id ?? null,
  );
  const [draft, setDraft] = useState<Draft | null>(() => {
    const initial = offers.find((o) => o.isActive) ?? offers[0];
    return initial ? toDraft(initial) : null;
  });
  const [preview, setPreview] = useState<SwitchPreview | null>(null);
  const [pending, startTransition] = useTransition();

  const thresholds = useMemo(
    () => (draft ? computeThresholds(draft) : null),
    [draft],
  );

  const shareSum = draft?.lines.reduce((s, l) => s + l.salesShare, 0) ?? 0;

  const select = (offer: OfferRecord) => {
    setSelectedId(offer.id);
    setDraft(toDraft(offer));
  };

  const patch = (values: Partial<Draft>) =>
    setDraft((d) => (d ? { ...d, ...values } : d));

  const patchLine = (
    index: number,
    values: Partial<Draft["lines"][number]>,
  ) =>
    setDraft((d) =>
      d
        ? {
            ...d,
            lines: d.lines.map((l, i) => (i === index ? { ...l, ...values } : l)),
          }
        : d,
    );

  const onSave = () => {
    if (!draft) return;
    startTransition(async () => {
      const res = await saveOffer(draft);
      if (res.ok) toast.success("Offre enregistrée");
      else toast.error(res.error);
    });
  };

  const onRequestActivate = (offer: OfferRecord) => {
    startTransition(async () => {
      const res = await previewOfferSwitch(offer.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setPreview({ ...res, targetId: offer.id });
    });
  };

  const onConfirmActivate = () => {
    if (!preview) return;
    startTransition(async () => {
      await activateOffer(preview.targetId);
      setPreview(null);
      toast.success(`« ${preview.offerName} » est désormais l'offre active`);
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <Card className="h-fit gap-0 py-3">
        <CardHeader className="px-3 pb-2">
          <CardTitle className="text-xs font-medium">Offres</CardTitle>
          <CardDescription className="text-[11px]">
            Une seule est active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 px-2">
          {offers.map((offer) => (
            <button
              key={offer.id}
              onClick={() => select(offer)}
              className={cn(
                "hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                selectedId === offer.id && "bg-accent",
              )}
            >
              <span className="min-w-0 flex-1 truncate text-xs">
                {offer.name}
              </span>
              {offer.isActive && (
                <Badge className="rounded-sm px-1 py-0 text-[10px]">
                  Active
                </Badge>
              )}
            </button>
          ))}
          <Separator className="my-2" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-full justify-start gap-1.5 text-xs"
            onClick={() => {
              setSelectedId(null);
              setDraft({ ...NEW_OFFER, lines: [...NEW_OFFER.lines] });
            }}
          >
            <Plus className="size-3.5" />
            Nouvelle offre
          </Button>
        </CardContent>
      </Card>

      {draft && (
        <div className="space-y-4">
          <ThresholdStrip thresholds={thresholds} />

          <Card className="gap-0 py-4">
            <CardHeader className="px-4 pb-3">
              <CardTitle className="text-sm">Paramètres</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="offer-name" className="text-xs">
                    Nom
                  </Label>
                  <Input
                    id="offer-name"
                    value={draft.name}
                    onChange={(e) => patch({ name: e.target.value })}
                    className="h-8 text-sm"
                    placeholder="Offre été 2026"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-5">
                <PercentField
                  label="PSP"
                  value={draft.psp}
                  onChange={(v) => patch({ psp: v })}
                />
                <PercentField
                  label="TVA"
                  value={draft.vat}
                  onChange={(v) => patch({ vat: v })}
                />
                <PercentField
                  label="Autres frais"
                  value={draft.otherFees}
                  onChange={(v) => patch({ otherFees: v })}
                />
                <PercentField
                  label="Marge mini"
                  value={draft.minMargin}
                  onChange={(v) => patch({ minMargin: v })}
                />
                <PercentField
                  label="Marge cible"
                  value={draft.targetMargin}
                  onChange={(v) => patch({ targetMargin: v })}
                />
              </div>

              <Separator />

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label className="text-xs">Lignes de produit</Label>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "num text-[11px]",
                        Math.abs(shareSum - 1) > 0.001
                          ? "text-muted-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      part totale {percent(shareSum, 0)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      disabled={draft.lines.length >= 4}
                      onClick={() =>
                        patch({
                          lines: [
                            ...draft.lines,
                            { bundle: 1, cogs: 0, price: 0, salesShare: 0 },
                          ],
                        })
                      }
                    >
                      <Plus className="size-3" />
                      Ligne
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-8 text-[11px]">Pack</TableHead>
                      <TableHead className="h-8 text-[11px]">COGS</TableHead>
                      <TableHead className="h-8 text-[11px]">Prix</TableHead>
                      <TableHead className="h-8 text-[11px]">
                        Part des ventes
                      </TableHead>
                      <TableHead className="h-8 w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {draft.lines.map((line, i) => (
                      <TableRow key={i} className="hover:bg-transparent">
                        <TableCell className="py-1">
                          <NumberCell
                            value={line.bundle}
                            step={1}
                            onChange={(v) => patchLine(i, { bundle: v })}
                          />
                        </TableCell>
                        <TableCell className="py-1">
                          <NumberCell
                            value={line.cogs}
                            step={0.01}
                            onChange={(v) => patchLine(i, { cogs: v })}
                          />
                        </TableCell>
                        <TableCell className="py-1">
                          <NumberCell
                            value={line.price}
                            step={0.01}
                            onChange={(v) => patchLine(i, { price: v })}
                          />
                        </TableCell>
                        <TableCell className="py-1">
                          <NumberCell
                            value={Math.round(line.salesShare * 1000) / 10}
                            step={0.1}
                            suffix="%"
                            onChange={(v) =>
                              patchLine(i, { salesShare: v / 100 })
                            }
                          />
                        </TableCell>
                        <TableCell className="py-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            disabled={draft.lines.length <= 1}
                            onClick={() =>
                              patch({
                                lines: draft.lines.filter((_, j) => j !== i),
                              })
                            }
                          >
                            <Trash2 className="size-3.5" />
                            <span className="sr-only">Retirer la ligne</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" onClick={onSave} disabled={pending}>
                  Enregistrer
                </Button>
                {selectedId &&
                  !offers.find((o) => o.id === selectedId)?.isActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => {
                        const offer = offers.find((o) => o.id === selectedId);
                        if (offer) onRequestActivate(offer);
                      }}
                    >
                      Activer cette offre
                    </Button>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <SwitchDialog
        preview={preview}
        pending={pending}
        onCancel={() => setPreview(null)}
        onConfirm={onConfirmActivate}
      />
    </div>
  );
}

function ThresholdStrip({
  thresholds,
}: {
  thresholds: ReturnType<typeof computeThresholds> | null;
}) {
  const unreachable =
    thresholds !== null && thresholds.roasBreakEven === null;

  return (
    <Card className="gap-0 py-3">
      <CardContent className="px-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Metric
            label="Prix pondéré"
            value={money(thresholds?.weightedPrice, true)}
          />
          <Metric
            label="Contribution"
            value={money(thresholds?.contribution, true)}
          />
          <Metric
            label="ROAS break-even"
            value={ratio(thresholds?.roasBreakEven)}
            accent
          />
          <Metric
            label="ROAS marge mini"
            value={ratio(thresholds?.roasMinMargin)}
            accent
          />
          <Metric
            label="ROAS cible"
            value={ratio(thresholds?.roasTarget)}
            accent
          />
        </div>
        {unreachable && (
          <p className="text-destructive mt-2 text-xs">{UNREACHABLE_MARGIN}</p>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-muted-foreground text-[10px] tracking-wide uppercase">
        {label}
      </div>
      <div
        className={cn(
          "num mt-0.5 text-lg leading-none font-semibold",
          accent && "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function PercentField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          step={0.1}
          value={Math.round(value * 1000) / 10}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          className="num h-8 pr-6 text-sm"
        />
        <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs">
          %
        </span>
      </div>
    </div>
  );
}

function NumberCell({
  value,
  onChange,
  step,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
  suffix?: string;
}) {
  return (
    <div className="relative">
      <Input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn("num h-7 text-sm", suffix && "pr-6")}
      />
      {suffix && (
        <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs">
          {suffix}
        </span>
      )}
    </div>
  );
}

function SwitchDialog({
  preview,
  pending,
  onCancel,
  onConfirm,
}: {
  preview: SwitchPreview | null;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={preview !== null} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">
            Activer « {preview?.offerName} » ?
          </DialogTitle>
          <DialogDescription className="text-xs">
            {preview?.changes.length === 0
              ? `Aucun verdict ne change sur les ${preview.total} créatives.`
              : `${preview?.changes.length} créative${(preview?.changes.length ?? 0) > 1 ? "s" : ""} sur ${preview?.total} ${(preview?.changes.length ?? 0) > 1 ? "changent" : "change"} de verdict.`}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/40 grid grid-cols-3 gap-2 rounded-md p-2 text-center">
          <div>
            <div className="text-muted-foreground text-[10px] uppercase">
              Break-even
            </div>
            <div className="num text-sm font-semibold">
              {ratio(preview?.thresholds.roasBreakEven)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-[10px] uppercase">
              Marge mini
            </div>
            <div className="num text-sm font-semibold">
              {ratio(preview?.thresholds.roasMinMargin)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-[10px] uppercase">
              Cible
            </div>
            <div className="num text-sm font-semibold">
              {ratio(preview?.thresholds.roasTarget)}
            </div>
          </div>
        </div>

        {preview && preview.changes.length > 0 && (
          <ScrollArea className="max-h-56 rounded-md border">
            <div className="divide-border divide-y">
              {preview.changes.map((c) => (
                <div
                  key={c.code}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs"
                >
                  <span className="code w-24 shrink-0 font-medium">
                    {c.code}
                  </span>
                  <VerdictBadge verdict={c.from} />
                  <span className="text-muted-foreground">→</span>
                  <VerdictBadge verdict={c.to} />
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onCancel}>
            Annuler
          </Button>
          <Button size="sm" onClick={onConfirm} disabled={pending}>
            <Check className="size-3.5" />
            Activer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
