/**
 * Verbatims that differ only by case, accents, punctuation or spacing are the
 * same hook typed twice. Collapsing them is what makes the accroche table
 * aggregate correctly instead of splitting a hook's evidence in two.
 */
/**
 * Among variants of the same verbatim, the one to keep. Longest first, because
 * it usually carries the accents and punctuation; on a tie, the least SHOUTY,
 * so an all-caps spelling never becomes the canonical just by arriving first.
 */
export function pickCanonical(variants: readonly string[]): string {
  const uppercaseCount = (s: string) =>
    [...s].filter((c) => c !== c.toLowerCase() && c === c.toUpperCase()).length;

  return [...variants].sort(
    (a, b) => b.length - a.length || uppercaseCount(a) - uppercaseCount(b),
  )[0];
}

export function normaliseVerbatim(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[¿?¡!.,;:"'«»…]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
