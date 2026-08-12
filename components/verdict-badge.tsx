import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VERDICT_LABEL, type Verdict } from "@/lib/taxonomy";

/**
 * Verdicts are the only place colour carries information in this product.
 * The ramp runs cold (dead capital) to warm (compounding), so the six states
 * read as one continuous scale rather than three buckets.
 */
const TONE: Record<Verdict, string> = {
  TEST_EN_COURS:
    "border-verdict-test/35 text-verdict-test bg-verdict-test/10",
  KILL: "border-verdict-kill/45 text-verdict-kill bg-verdict-kill/12",
  SURVEILLER:
    "border-verdict-surveiller/45 text-verdict-surveiller bg-verdict-surveiller/12",
  SOUS_MARGE:
    "border-verdict-sous-marge/45 text-verdict-sous-marge bg-verdict-sous-marge/12",
  GARDER: "border-verdict-garder/45 text-verdict-garder bg-verdict-garder/12",
  WINNER: "border-verdict-winner/50 text-verdict-winner bg-verdict-winner/12",
};

const DOT: Record<Verdict, string> = {
  TEST_EN_COURS: "bg-verdict-test",
  KILL: "bg-verdict-kill",
  SURVEILLER: "bg-verdict-surveiller",
  SOUS_MARGE: "bg-verdict-sous-marge",
  GARDER: "bg-verdict-garder",
  WINNER: "bg-verdict-winner",
};

export function VerdictBadge({
  verdict,
  className,
}: {
  verdict: Verdict;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-sm px-1.5 py-0 text-[11px] font-medium tracking-tight tabular-nums",
        TONE[verdict],
        className,
      )}
    >
      {VERDICT_LABEL[verdict]}
    </Badge>
  );
}

/** Scale marker used in legends and dense rows. */
export function VerdictDot({
  verdict,
  className,
}: {
  verdict: Verdict;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("size-2 shrink-0 rounded-[2px]", DOT[verdict], className)}
    />
  );
}
