import { cn } from "@/lib/utils";

const STEP = 14;

/**
 * Draws the descent of a creative as an actual line rather than leaving it
 * encoded in the code string. This is the one place the interface spends
 * visual ambition.
 */
export function LineageThread({
  depth,
  guides,
  isLast,
  hasChildren,
  className,
}: {
  depth: number;
  guides: boolean[];
  isLast: boolean;
  hasChildren: boolean;
  className?: string;
}) {
  if (depth === 0 && !hasChildren) {
    return <span className={cn("inline-block", className)} style={{ width: 0 }} />;
  }

  const width = depth * STEP + (depth > 0 ? STEP : 6);

  return (
    <span
      aria-hidden
      className={cn("relative inline-block self-stretch", className)}
      style={{ width }}
    >
      {/* Trunks of ancestors that still have siblings below. */}
      {guides.map((running, i) =>
        running ? (
          <span
            key={i}
            className="bg-lineage absolute top-0 bottom-0 w-px"
            style={{ left: i * STEP + STEP / 2 }}
          />
        ) : null,
      )}

      {depth > 0 && (
        <>
          {/* Vertical drop into this row: full height unless it is the last child. */}
          <span
            className="bg-lineage absolute top-0 w-px"
            style={{
              left: (depth - 1) * STEP + STEP / 2,
              height: isLast ? "50%" : "100%",
            }}
          />
          {/* Elbow into the row's own label. */}
          <span
            className="bg-lineage absolute h-px"
            style={{
              left: (depth - 1) * STEP + STEP / 2,
              width: STEP / 2 + 2,
              top: "50%",
            }}
          />
        </>
      )}

      {/* Node marker: filled when the creative has descendants. */}
      <span
        className={cn(
          "absolute size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-[1px]",
          hasChildren ? "bg-muted-foreground" : "bg-lineage",
        )}
        style={{ left: depth * STEP + (depth > 0 ? STEP / 2 : 3), top: "50%" }}
      />
    </span>
  );
}

/**
 * Compact inline version for cards and headers: C01 › C01.2 › C01.2.1
 */
export function LineagePath({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const parts = code.split(".");
  return (
    <span className={cn("code text-muted-foreground text-[11px]", className)}>
      {parts.map((_, i) => (
        <span key={i}>
          {i > 0 && <span className="text-lineage mx-0.5">›</span>}
          <span className={i === parts.length - 1 ? "text-foreground" : ""}>
            {parts.slice(0, i + 1).join(".")}
          </span>
        </span>
      ))}
    </span>
  );
}
