import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

export function ComingSoon({ label }: { label: string }) {
  return (
    <div className="p-6">
      <Empty className="border-border rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyTitle className="text-sm">{label} n&apos;existe pas encore</EmptyTitle>
          <EmptyDescription className="text-xs">
            Le shell est prêt à l&apos;accueillir. Un module, un dossier, une entrée
            dans le registre.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild size="sm" variant="outline">
            <Link href="/creative">Retour au Creative OS</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
