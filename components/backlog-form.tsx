"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createBacklogItem, suggestTargetCode } from "@/lib/actions/backlog";
import {
  CHANGED_ELEMENT_LABEL,
  CHANGED_ELEMENTS_FOR_KIND,
  PERIOD_LABEL,
  PERIODS,
  PRODUCTION_TYPE_LABEL,
  PRODUCTION_TYPES,
  type CreativeKind,
  type Period,
  type ProductionType,
} from "@/lib/taxonomy";

const MIN_HYPOTHESIS = 12;

export function BacklogForm({
  trigger,
  defaults,
  title = "Nouvel élément de production",
}: {
  trigger: React.ReactNode;
  title?: string;
  defaults?: {
    parentCode?: string | null;
    creativeKind?: CreativeKind;
    targetPeriod?: Period;
    productionType?: ProductionType;
  };
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<CreativeKind>(
    defaults?.creativeKind ?? "VIDEO",
  );
  const [productionType, setProductionType] = useState<ProductionType>(
    defaults?.productionType ??
      (defaults?.parentCode ? "ITERATION_MAJEURE" : "NEW_CONCEPT"),
  );
  const [elementToChange, setElementToChange] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [targetPeriod, setTargetPeriod] = useState<Period>(
    defaults?.targetPeriod ?? "Otono",
  );
  const [targetCode, setTargetCode] = useState("");
  const [targetWeek, setTargetWeek] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !defaults?.parentCode) return;
    suggestTargetCode(defaults.parentCode).then(setTargetCode);
  }, [open, defaults?.parentCode]);

  const hypothesisTooShort = hypothesis.trim().length < MIN_HYPOTHESIS;

  const submit = () => {
    startTransition(async () => {
      const res = await createBacklogItem({
        creativeKind: kind,
        productionType,
        parentCode: defaults?.parentCode ?? null,
        targetCode: targetCode || null,
        elementToChange,
        hypothesis,
        targetPeriod,
        targetWeek: targetWeek || null,
      });
      if (res.ok) {
        toast.success("Ajouté à la production");
        setOpen(false);
        setHypothesis("");
        setElementToChange("");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
          <DialogDescription className="text-xs">
            {defaults?.parentCode
              ? `Hérite de ${defaults.parentCode}. Ne reste que l'élément à changer et l'hypothèse.`
              : "Un test sans hypothèse écrite n'apprend rien."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select
                value={kind}
                onValueChange={(v) => {
                  setKind(v as CreativeKind);
                  setElementToChange("");
                }}
              >
                <SelectTrigger size="sm" className="h-8 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIDEO" className="text-xs">
                    Vidéo
                  </SelectItem>
                  <SelectItem value="STATIC" className="text-xs">
                    Statique
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Nature</Label>
              <Select
                value={productionType}
                onValueChange={(v) => setProductionType(v as ProductionType)}
              >
                <SelectTrigger size="sm" className="h-8 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {PRODUCTION_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Code cible</Label>
              <Input
                value={targetCode}
                onChange={(e) => setTargetCode(e.target.value)}
                placeholder="C01.2.3"
                className="code h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Semaine visée</Label>
              <Input
                value={targetWeek}
                onChange={(e) => setTargetWeek(e.target.value)}
                placeholder="26W36"
                className="code h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Élément à changer</Label>
              <Select value={elementToChange} onValueChange={setElementToChange}>
                <SelectTrigger size="sm" className="h-8 w-full text-xs">
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  {CHANGED_ELEMENTS_FOR_KIND[kind].map((el) => (
                    <SelectItem key={el} value={el} className="text-xs">
                      {CHANGED_ELEMENT_LABEL[el] ?? el}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Période visée</Label>
              <Select
                value={targetPeriod}
                onValueChange={(v) => setTargetPeriod(v as Period)}
              >
                <SelectTrigger size="sm" className="h-8 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">
                      {PERIOD_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="hypothesis" className="text-xs">
              Hypothèse <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="hypothesis"
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              rows={3}
              className="text-xs"
              placeholder="Ce que tu attends de ce changement, et pourquoi."
              aria-invalid={hypothesis.length > 0 && hypothesisTooShort}
            />
            <p className="text-muted-foreground text-[11px]">
              {hypothesisTooShort
                ? "Obligatoire — décris ce que ce test doit prouver."
                : "Bien. Cette phrase est ce qui rendra le résultat lisible."}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            size="sm"
            onClick={submit}
            disabled={pending || hypothesisTooShort || !elementToChange}
          >
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
