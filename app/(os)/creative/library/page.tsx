import { PageHeader } from "@/components/page-header";
import { deriveMetaName } from "@/lib/derive";
import { getCreativesWithPerf } from "@/lib/queries";
import { LibraryTable, type LibraryRow } from "./library-table";

export default async function LibraryPage() {
  const creatives = await getCreativesWithPerf();

  const rows: LibraryRow[] = creatives.map((c) => ({
    id: c.id,
    code: c.code,
    kind: c.kind,
    angle: c.angle,
    videoFormat: c.videoFormat,
    layout: c.layout,
    accrocheCode: c.accroche?.code ?? null,
    accrocheVerbatim: c.accroche?.verbatim ?? null,
    period: c.period,
    status: c.status,
    metaName: deriveMetaName({
      code: c.code,
      kind: c.kind,
      angle: c.angle,
      videoFormat: c.videoFormat,
      layout: c.layout,
      accrocheCode: c.accroche?.code ?? null,
      changedElement: c.changedElement,
      launchDate: c.launchDate,
    }),
    spendCum: c.spendCum,
    roasCum: c.roasCum,
    verdict: c.verdict,
  }));

  return (
    <div className="p-4">
      <PageHeader
        title="Librairie"
        subtitle="Toutes les créatives, leur lignée et leur verdict au prix actuel."
      />
      <LibraryTable rows={rows} />
    </div>
  );
}
