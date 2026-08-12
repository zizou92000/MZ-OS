/**
 * Verbatims that differ only by case, accents, punctuation or spacing are the
 * same hook typed twice. Collapsing them is what makes the accroche table
 * aggregate correctly instead of splitting a hook's evidence in two.
 */
export function normaliseVerbatim(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[¿?¡!.,;:"'«»…]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
