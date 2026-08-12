"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Lock, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { LineageThread } from "@/components/lineage-thread";
import { VerdictBadge } from "@/components/verdict-badge";
import { updateScript } from "@/lib/actions/scripts";
import { money, ratio } from "@/lib/format";
import { buildTree } from "@/lib/lineage";
import { ACCROCHE_TYPE_LABEL, type AccrocheType, type Verdict } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

export type Scene = {
  tc: string;
  visual: string;
  dialogue: string;
  screenText: string;
};

export type ScriptRow = {
  creativeCode: string;
  familyCode: string;
  hypothesis: string;
  hookVisual: string | null;
  hookDialogue: string | null;
  hookScreenText: string | null;
  hookType: AccrocheType | null;
  scenes: Scene[];
  learning: string | null;
  verdict: Verdict | null;
  spendCum: number;
  roasCum: number | null;
  killed: boolean;
};

export type FamilyRow = {
  code: string;
  nickname: string;
  promise: string;
  visibleMechanism: string;
  narrativeStructure: string;
  competitiveFrame: string;
  emotionalDriver: string;
  neverTouch: string;
  scripts: ScriptRow[];
};

export function ScriptsView({ families }: { families: FamilyRow[] }) {
  const focus = useSearchParams().get("script");
  const allScripts = families.flatMap((f) => f.scripts);
  const [selectedCode, setSelectedCode] = useState<string | null>(
    focus ?? allScripts[0]?.creativeCode ?? null,
  );

  const selected = allScripts.find((s) => s.creativeCode === selectedCode);
  const family = families.find((f) => f.code === selected?.familyCode);

  if (families.length === 0) {
    return (
      <Empty className="rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyTitle className="text-sm">Aucune famille de script</EmptyTitle>
          <EmptyDescription className="text-xs">
            Une famille regroupe une lignée et son ADN : la promesse, le
            mécanisme, et ce qu&apos;on ne touche jamais.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="min-h-[70vh] rounded-lg border"
    >
      <ResizablePanel defaultSize="26%" minSize="18%">
        <ScrollArea className="h-full">
          <div className="space-y-3 p-2">
            {families.map((f) => (
              <FamilyBranch
                key={f.code}
                family={f}
                selectedCode={selectedCode}
                onSelect={setSelectedCode}
              />
            ))}
          </div>
        </ScrollArea>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize="74%">
        <ScrollArea className="h-full">
          {selected && family ? (
            <ScriptDetail script={selected} family={family} />
          ) : (
            <div className="text-muted-foreground p-6 text-sm">
              Choisis un script à gauche.
            </div>
          )}
        </ScrollArea>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function FamilyBranch({
  family,
  selectedCode,
  onSelect,
}: {
  family: FamilyRow;
  selectedCode: string | null;
  onSelect: (code: string) => void;
}) {
  const tree = useMemo(
    () => buildTree(family.scripts, (s) => s.creativeCode),
    [family.scripts],
  );

  return (
    <div>
      <div className="px-1.5 py-1">
        <div className="code text-[11px] font-semibold">{family.code}</div>
        <div className="text-muted-foreground text-[11px]">
          {family.nickname}
        </div>
      </div>
      <div>
        {tree.map((node) => (
          <button
            key={node.code}
            onClick={() => onSelect(node.code)}
            className={cn(
              "hover:bg-accent flex w-full items-center rounded-md px-1 py-1 text-left transition-colors",
              selectedCode === node.code && "bg-accent",
            )}
          >
            <LineageThread
              depth={node.depth}
              guides={node.guides}
              isLast={node.isLast}
              hasChildren={node.hasChildren}
              className="min-h-6"
            />
            <span className="code ml-1 flex-1 truncate text-[11px]">
              {node.code}
            </span>
            {node.item.verdict && <VerdictBadge verdict={node.item.verdict} />}
          </button>
        ))}
      </div>
    </div>
  );
}

function ScriptDetail({
  script,
  family,
}: {
  script: ScriptRow;
  family: FamilyRow;
}) {
  const [learning, setLearning] = useState(script.learning ?? "");
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const res = await updateScript({
        creativeCode: script.creativeCode,
        hookVisual: script.hookVisual,
        hookDialogue: script.hookDialogue,
        hookScreenText: script.hookScreenText,
        scenes: script.scenes,
        learning,
      });
      if (res.ok) toast.success("Enseignement enregistré");
      else toast.error(res.error);
    });

  return (
    <div className="space-y-4 p-4">
      {/* The family contract, pinned above every script in the lineage. */}
      <Card className="gap-0 py-3">
        <CardContent className="space-y-3 px-4">
          <div className="flex items-baseline gap-2">
            <code className="code text-sm font-semibold">{family.code}</code>
            <span className="text-sm font-medium">{family.nickname}</span>
            <Badge variant="outline" className="ml-auto rounded-sm text-[10px]">
              ADN de la famille
            </Badge>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Dna label="Promesse" value={family.promise} />
            <Dna label="Mécanisme visible" value={family.visibleMechanism} />
            <Dna label="Structure narrative" value={family.narrativeStructure} />
            <Dna label="Cadre concurrentiel" value={family.competitiveFrame} />
            <Dna label="Moteur émotionnel" value={family.emotionalDriver} />
          </div>

          <div className="border-destructive/40 bg-destructive/5 rounded-md border p-2">
            <div className="text-destructive mb-0.5 flex items-center gap-1.5 text-[10px] font-medium tracking-wide uppercase">
              <Lock className="size-3" />
              Ce qu&apos;on ne touche jamais
            </div>
            <p className="text-xs leading-snug">{family.neverTouch}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/creative/library/${encodeURIComponent(script.creativeCode)}`}
          className="code hover:text-primary text-sm font-semibold"
        >
          {script.creativeCode}
        </Link>
        {script.verdict && <VerdictBadge verdict={script.verdict} />}
        <span className="num text-muted-foreground text-xs">
          {money(script.spendCum)} · ROAS {ratio(script.roasCum)}
        </span>
        {script.killed && (
          <Badge variant="outline" className="rounded-sm text-[10px]">
            Coupée — la leçon reste
          </Badge>
        )}
      </div>

      <Card className="gap-0 py-3">
        <CardContent className="space-y-1 px-4">
          <div className="text-muted-foreground text-[10px] tracking-wide uppercase">
            Hypothèse
          </div>
          <p className="text-xs leading-snug">{script.hypothesis}</p>
        </CardContent>
      </Card>

      <Card className="gap-0 py-3">
        <CardContent className="space-y-2 px-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">Accroche</span>
            {script.hookType && (
              <Badge variant="outline" className="rounded-sm px-1 py-0 text-[10px]">
                {ACCROCHE_TYPE_LABEL[script.hookType]}
              </Badge>
            )}
          </div>
          <Field label="Visuel" value={script.hookVisual} />
          <Field label="Dialogue" value={script.hookDialogue} spanish />
          <Field label="Texte écran" value={script.hookScreenText} />
        </CardContent>
      </Card>

      <Card className="gap-0 py-3">
        <CardContent className="px-4">
          <div className="mb-2 text-xs font-medium">Plans</div>
          <Table className="min-w-[36rem]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-7 w-20 text-[11px]">TC</TableHead>
                <TableHead className="h-7 text-[11px]">Visuel</TableHead>
                <TableHead className="h-7 text-[11px]">Dialogue</TableHead>
                <TableHead className="h-7 w-32 text-[11px]">
                  Texte écran
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {script.scenes.map((scene, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  <TableCell className="code py-1.5 align-top text-[11px]">
                    {scene.tc}
                  </TableCell>
                  <TableCell className="py-1.5 align-top text-xs leading-snug">
                    {scene.visual}
                  </TableCell>
                  <TableCell className="py-1.5 align-top text-xs leading-snug italic">
                    {scene.dialogue}
                  </TableCell>
                  <TableCell className="code py-1.5 align-top text-[11px]">
                    {scene.screenText}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="gap-0 py-3">
        <CardContent className="space-y-2 px-4">
          <Label className="text-xs">Ce que ça prouve</Label>
          <Textarea
            value={learning}
            onChange={(e) => setLearning(e.target.value)}
            rows={3}
            className="text-xs"
            placeholder="L'enseignement que cette créative laisse, même si elle a été coupée."
          />
          <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={save} disabled={pending}>
            <Save className="size-3.5" />
            Enregistrer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Dna({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-[10px] tracking-wide uppercase">
        {label}
      </div>
      <p className="text-xs leading-snug">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  spanish,
}: {
  label: string;
  value: string | null;
  spanish?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground w-20 shrink-0 text-[11px]">
        {label}
      </span>
      <span className={cn("flex-1 text-xs leading-snug", spanish && "italic")}>
        {value}
      </span>
    </div>
  );
}
