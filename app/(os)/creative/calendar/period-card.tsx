"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { updatePeriod } from "@/lib/actions/periods";
import { money, ratio } from "@/lib/format";
import {
  ANGLE_LABEL,
  PERIOD_LABEL,
  VIDEO_FORMAT_LABEL,
  type Angle,
  type Period,
  type VideoFormat,
} from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

export type PeriodRow = {
  code: Period;
  startWeek: number;
  endWeek: number;
  consumerTension: string;
  recommendedAngle: Angle;
  recommendedFormat: string;
  recommendedLayout: string;
  memo: string | null;
  relaunchNextYear: boolean;
  isCurrent: boolean;
  /** ROAS per calendar year, side by side — the year-on-year comparison. */
  byYear: { year: number; spend: number; revenue: number; roas: number | null }[];
  winners: string[];
};

export function PeriodCard({ period }: { period: PeriodRow }) {
  const [memo, setMemo] = useState(period.memo ?? "");
  const [relaunch, setRelaunch] = useState(period.relaunchNextYear);
  const [pending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);

  const save = (nextRelaunch = relaunch) =>
    startTransition(async () => {
      const res = await updatePeriod({
        code: period.code,
        memo,
        relaunchNextYear: nextRelaunch,
      });
      if (res.ok) {
        toast.success(`${PERIOD_LABEL[period.code]} enregistrée`);
        setDirty(false);
      } else toast.error(res.error);
    });

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <Card
      className={cn("gap-0 py-3", period.isCurrent && "border-primary/50")}
    >
      <CardHeader className="px-3 pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          {PERIOD_LABEL[period.code]}
          {period.isCurrent && (
            <Badge className="rounded-sm px-1 py-0 text-[9px]">En cours</Badge>
          )}
        </CardTitle>
        <CardDescription className="text-[11px]">
          {/* These are diffusion windows, not event dates. */}
          <span className="code">
            Diffusion W{pad(period.startWeek)}–W{pad(period.endWeek)}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2.5 px-3">
        <p className="text-muted-foreground text-xs leading-snug">
          {period.consumerTension}
        </p>

        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="rounded-sm px-1 py-0 text-[10px] font-normal">
            {ANGLE_LABEL[period.recommendedAngle]}
          </Badge>
          <Badge variant="outline" className="rounded-sm px-1 py-0 text-[10px] font-normal">
            {VIDEO_FORMAT_LABEL[period.recommendedFormat as VideoFormat] ??
              period.recommendedFormat}
          </Badge>
          <Badge variant="outline" className="code rounded-sm px-1 py-0 text-[10px] font-normal">
            {period.recommendedLayout}
          </Badge>
        </div>

        <div className="border-border border-t pt-2">
          <div className="text-muted-foreground mb-1 text-[10px] tracking-wide uppercase">
            ROAS par année
          </div>
          {period.byYear.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              Aucune diffusion enregistrée sur cette fenêtre.
            </p>
          ) : (
            <div className="flex gap-3">
              {period.byYear.map((y) => (
                <div key={y.year}>
                  <div className="code text-muted-foreground text-[10px]">
                    {y.year}
                  </div>
                  <div className="num text-sm font-semibold">
                    {ratio(y.roas)}
                  </div>
                  <div className="num text-muted-foreground text-[10px]">
                    {money(y.spend)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {period.winners.length > 0 && (
          <div>
            <div className="text-muted-foreground mb-1 text-[10px] tracking-wide uppercase">
              Codes gagnants
            </div>
            <div className="flex flex-wrap gap-1">
              {period.winners.map((code) => (
                <code
                  key={code}
                  className="code bg-muted rounded-sm px-1 py-0.5 text-[10px]"
                >
                  {code}
                </code>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-[11px]">Mémo</Label>
          <Textarea
            value={memo}
            onChange={(e) => {
              setMemo(e.target.value);
              setDirty(true);
            }}
            rows={2}
            placeholder="Ce qu'il faut retenir pour l'an prochain."
            className="text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id={`relaunch-${period.code}`}
            checked={relaunch}
            onCheckedChange={(v) => {
              setRelaunch(v);
              save(v);
            }}
          />
          <Label htmlFor={`relaunch-${period.code}`} className="text-[11px]">
            Relancer l&apos;an prochain
          </Label>
          {dirty && (
            <Button
              size="sm"
              variant="outline"
              className="ml-auto h-6 gap-1 px-1.5 text-[10px]"
              disabled={pending}
              onClick={() => save()}
            >
              <Check className="size-3" />
              Enregistrer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
