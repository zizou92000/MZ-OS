"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Scissors } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BacklogForm } from "@/components/backlog-form";
import { bulkSetStatus } from "@/lib/actions/creatives";
import type { CreativeKind, Period } from "@/lib/taxonomy";

export function CutButton({ id, code }: { id: string; code: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      className="h-6 gap-1 px-1.5 text-[11px]"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await bulkSetStatus([id], "KILL");
          if (res.ok) toast.success(`${code} coupée`);
          else toast.error(res.error);
        })
      }
    >
      <Scissors className="size-3" />
      Couper
    </Button>
  );
}

export function IterateButton({
  code,
  kind,
  period,
}: {
  code: string;
  kind: CreativeKind;
  period: Period;
}) {
  return (
    <BacklogForm
      title={`Itérer sur ${code}`}
      defaults={{
        parentCode: code,
        creativeKind: kind,
        targetPeriod: period,
        productionType: "ITERATION_MAJEURE",
      }}
      trigger={
        <Button size="sm" variant="outline" className="h-6 px-1.5 text-[11px]">
          Itérer
        </Button>
      }
    />
  );
}

export function OpenButton({ code }: { code: string }) {
  return (
    <Button
      asChild
      size="sm"
      variant="outline"
      className="h-6 px-1.5 text-[11px]"
    >
      <Link href={`/creative/library/${encodeURIComponent(code)}`}>Ouvrir</Link>
    </Button>
  );
}
