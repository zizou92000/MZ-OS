import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CHANGED_ELEMENT_LABEL } from "@/lib/taxonomy";

type Difference = { element: string; parent: string; here: string };

/**
 * More than one difference against the parent means the result cannot be
 * attributed to anything. Saying so plainly is the whole point.
 */
export function InvalidTestAlert({
  changedElement,
  differences,
}: {
  changedElement: string | null;
  differences: Difference[];
}) {
  if (differences.length <= 1) return null;

  return (
    <Alert variant="destructive">
      <TriangleAlert />
      <AlertTitle className="text-xs">
        Test invalide — {differences.length} différences vis-à-vis du parent
      </AlertTitle>
      <AlertDescription className="text-xs">
        <p>
          Cette créative déclare{" "}
          <strong>
            {changedElement
              ? (CHANGED_ELEMENT_LABEL[changedElement] ?? changedElement)
              : "un changement"}
          </strong>{" "}
          comme variable testée, mais {differences.length} éléments diffèrent
          réellement. Aucun résultat ne peut être attribué à l&apos;un plutôt
          qu&apos;à l&apos;autre.
        </p>
        <ul className="mt-1.5 space-y-0.5">
          {differences.map((d) => (
            <li key={d.element} className="code text-[11px]">
              {CHANGED_ELEMENT_LABEL[d.element] ?? d.element} : {d.parent} →{" "}
              {d.here}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
