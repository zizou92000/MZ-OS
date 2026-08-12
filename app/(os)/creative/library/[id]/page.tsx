import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ExternalLink,
  FileText,
  Film,
  ImageIcon,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "@/components/copy-button";
import { LineagePath } from "@/components/lineage-thread";
import { PageHeader } from "@/components/page-header";
import { VerdictBadge } from "@/components/verdict-badge";
import { deriveMetaName } from "@/lib/derive";
import { money, ratio } from "@/lib/format";
import { deriveWeekly } from "@/lib/metrics";
import { getCreativeByCode } from "@/lib/queries";
import {
  ANGLE_LABEL,
  CHANGED_ELEMENT_LABEL,
  CREATIVE_STATUS_LABEL,
  LAYOUT_LABEL,
  PERIOD_LABEL,
  VIDEO_FORMAT_LABEL,
} from "@/lib/taxonomy";
import { CreativeCharts } from "./creative-charts";
import { InvalidTestAlert } from "./invalid-test-alert";
import { IterationDialog } from "./iteration-dialog";

export default async function CreativeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const creative = await getCreativeByCode(decodeURIComponent(id));
  if (!creative) notFound();

  const metaName = deriveMetaName({
    code: creative.code,
    kind: creative.kind,
    angle: creative.angle,
    videoFormat: creative.videoFormat,
    layout: creative.layout,
    accrocheCode: creative.accroche?.code ?? null,
    changedElement: creative.changedElement,
    launchDate: creative.launchDate,
  });

  const series = creative.weeklySeries.map((w) => {
    const d = deriveWeekly(w);
    return {
      isoWeek: w.isoWeek,
      spend: w.spend,
      roas: d.roas,
      hookRate: d.hookRate,
    };
  });

  const links = [
    { href: creative.videoUrl, label: "Vidéo", icon: Film },
    { href: creative.hook3sUrl, label: "Accroche 3 s", icon: Zap },
    { href: creative.scriptUrl, label: "Script", icon: FileText },
    { href: creative.imageUrl, label: "Visuel", icon: ImageIcon },
  ].filter((l) => l.href);

  const changes = creative.script?.changedVsParent as
    | { element: string; parent: string; here: string }
    | { element: string; parent: string; here: string }[]
    | null
    | undefined;
  const changeList = Array.isArray(changes) ? changes : changes ? [changes] : [];

  return (
    <div className="p-4">
      <PageHeader
        title={creative.code}
        subtitle={`${ANGLE_LABEL[creative.angle]} · ${
          creative.kind === "VIDEO"
            ? creative.videoFormat
              ? VIDEO_FORMAT_LABEL[creative.videoFormat]
              : "Vidéo"
            : creative.layout
              ? LAYOUT_LABEL[creative.layout]
              : "Statique"
        } · ${PERIOD_LABEL[creative.period]}`}
        actions={
          <>
            <VerdictBadge verdict={creative.verdict} />
            <Badge variant="outline" className="rounded-sm text-[11px]">
              {CREATIVE_STATUS_LABEL[creative.status]}
            </Badge>
            <IterationDialog
              parentCode={creative.code}
              kind={creative.kind}
              angle={creative.angle}
              videoFormat={creative.videoFormat}
              layout={creative.layout}
              period={creative.period}
            />
          </>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <Card className="gap-0 py-3">
            <CardContent className="space-y-3 px-4">
              <div>
                <div className="text-muted-foreground mb-1 text-[10px] tracking-wide uppercase">
                  Nom Meta — calculé, jamais saisi
                </div>
                <div className="bg-muted/50 flex items-center gap-1 rounded-md px-2 py-1.5">
                  <code className="code flex-1 truncate text-xs">
                    {metaName}
                  </code>
                  <CopyButton value={metaName} label="Copier le nom Meta" />
                </div>
                {creative.legacyMetaName && (
                  <p className="text-muted-foreground mt-1.5 text-[11px]">
                    Nom actuel dans Meta :{" "}
                    <code className="code">{creative.legacyMetaName}</code> — ne
                    pas renommer, l&apos;apprentissage repartirait de zéro.
                  </p>
                )}
              </div>

              {links.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {links.map((l) => {
                    const Icon = l.icon;
                    return (
                      <Button
                        key={l.label}
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1.5 text-xs"
                      >
                        <a href={l.href!} target="_blank" rel="noreferrer">
                          <Icon className="size-3.5" />
                          {l.label}
                          <ExternalLink className="size-3 opacity-50" />
                        </a>
                      </Button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <InvalidTestAlert
            changedElement={creative.changedElement}
            differences={changeList}
          />

          <Card className="gap-0 py-3">
            <CardHeader className="px-4 pb-2">
              <CardTitle className="text-sm">Cumuls</CardTitle>
              <CardDescription className="text-xs">
                Verdict calculé au prix de l&apos;offre active.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Spend" value={money(creative.spendCum)} />
                <Stat label="CA" value={money(creative.revenueCum)} />
                <Stat label="ROAS" value={ratio(creative.roasCum)} strong />
                <Stat
                  label="Semaines"
                  value={String(creative.weeklyPerfs.length)}
                />
              </div>
            </CardContent>
          </Card>

          {series.length > 0 ? (
            <CreativeCharts series={series} />
          ) : (
            <Card className="gap-0 py-6">
              <CardContent className="px-4 text-center">
                <p className="text-muted-foreground text-xs">
                  Aucune semaine saisie pour cette créative.
                </p>
                <Button asChild size="sm" variant="outline" className="mt-2">
                  <Link href="/creative/performance">Saisir la semaine</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-3">
          <Card className="gap-0 py-3">
            <CardHeader className="px-4 pb-2">
              <CardTitle className="text-sm">Généalogie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4">
              <LineagePath code={creative.code} />

              <Relation
                label="Parent"
                items={creative.parent ? [creative.parent] : []}
                empty="Origine — pas de parent"
              />
              <Separator />
              <Relation
                label="Sœurs"
                items={creative.siblings}
                empty="Aucune sœur"
              />
              <Separator />
              <Relation
                label="Enfants"
                items={creative.children}
                empty="Aucune itération encore"
              />
            </CardContent>
          </Card>

          {creative.accroche && (
            <Card className="gap-0 py-3">
              <CardHeader className="px-4 pb-2">
                <CardTitle className="text-sm">Accroche</CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <p className="text-sm leading-snug">
                  « {creative.accroche.verbatim} »
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <code className="code text-muted-foreground text-[11px]">
                    {creative.accroche.code}
                  </code>
                  <Badge
                    variant="outline"
                    className="rounded-sm px-1 py-0 text-[10px]"
                  >
                    {creative.accroche.type}
                  </Badge>
                </div>
                {creative.accroche.deepDesire && (
                  <p className="text-muted-foreground mt-2 text-xs">
                    {creative.accroche.deepDesire}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="gap-0 py-3">
            <CardHeader className="px-4 pb-2">
              <CardTitle className="text-sm">Fiche</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 px-4 text-xs">
              <Row
                label="Élément changé"
                value={
                  creative.changedElement
                    ? (CHANGED_ELEMENT_LABEL[creative.changedElement] ??
                      creative.changedElement)
                    : "Origine"
                }
              />
              <Row label="Génération" value={String(creative.generation)} />
              <Row
                label="Lancement"
                value={new Intl.DateTimeFormat("fr-FR").format(
                  creative.launchDate,
                )}
              />
              {creative.durationS && (
                <Row label="Durée" value={`${creative.durationS} s`} />
              )}
              {creative.visualId && (
                <Row label="Visuel" value={creative.visualId} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <div className="text-muted-foreground text-[10px] tracking-wide uppercase">
        {label}
      </div>
      <div
        className={`num mt-0.5 leading-none ${strong ? "text-lg font-semibold" : "text-base"}`}
      >
        {value}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function Relation({
  label,
  items,
  empty,
}: {
  label: string;
  items: { code: string }[];
  empty: string;
}) {
  return (
    <div>
      <div className="text-muted-foreground mb-1 text-[10px] tracking-wide uppercase">
        {label}
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-xs">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {items.map((c) => (
            <Link
              key={c.code}
              href={`/creative/library/${encodeURIComponent(c.code)}`}
              className="code bg-muted hover:bg-accent rounded-sm px-1.5 py-0.5 text-[11px] transition-colors"
            >
              {c.code}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
