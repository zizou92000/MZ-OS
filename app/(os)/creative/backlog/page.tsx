import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { Kanban, type BacklogCard } from "./kanban";

export default async function BacklogPage() {
  const items = await prisma.backlogItem.findMany({
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  });

  const cards: BacklogCard[] = items.map((i) => ({
    id: i.id,
    targetCode: i.targetCode,
    parentCode: i.parentCode,
    creativeKind: i.creativeKind,
    productionType: i.productionType,
    elementToChange: i.elementToChange,
    hypothesis: i.hypothesis,
    targetPeriod: i.targetPeriod,
    targetWeek: i.targetWeek,
    prodStatus: i.prodStatus,
  }));

  return (
    <div className="p-4">
      <PageHeader
        title="Production"
        subtitle="Chaque carte porte son hypothèse. Sans hypothèse, elle n'aurait pas pu être créée."
      />
      <Kanban items={cards} />
    </div>
  );
}
