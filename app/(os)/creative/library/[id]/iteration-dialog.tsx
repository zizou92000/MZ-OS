"use client";

import { GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BacklogForm } from "@/components/backlog-form";
import type { CreativeKind, Period } from "@/lib/taxonomy";

export function IterationDialog({
  parentCode,
  kind,
  period,
}: {
  parentCode: string;
  kind: CreativeKind;
  angle: string;
  videoFormat: string | null;
  layout: string | null;
  period: Period;
}) {
  return (
    <BacklogForm
      title={`Itérer sur ${parentCode}`}
      defaults={{
        parentCode,
        creativeKind: kind,
        targetPeriod: period,
        productionType: "ITERATION_MAJEURE",
      }}
      trigger={
        <Button size="sm" className="h-7 gap-1.5 text-xs">
          <GitBranch className="size-3.5" />
          Créer une itération
        </Button>
      }
    />
  );
}
