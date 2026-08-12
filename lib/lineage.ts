import { compareCodes, parentCodeOf } from "./derive";

export type TreeRow<T> = {
  item: T;
  code: string;
  depth: number;
  /**
   * For each ancestor level, whether that ancestor still has siblings below it.
   * Drives which vertical guides keep running past this row.
   */
  guides: boolean[];
  isLast: boolean;
  hasChildren: boolean;
};

/**
 * Orders items so every child follows its parent, and annotates each row with
 * the guide state needed to draw the lineage thread. Items whose declared
 * parent is absent from the set are treated as roots so nothing disappears.
 */
export function buildTree<T>(
  items: readonly T[],
  getCode: (item: T) => string,
): TreeRow<T>[] {
  const byCode = new Map<string, T>();
  for (const item of items) byCode.set(getCode(item), item);

  const childrenOf = new Map<string, string[]>();
  const roots: string[] = [];

  for (const item of items) {
    const code = getCode(item);
    const parent = parentCodeOf(code);
    if (parent && byCode.has(parent)) {
      const siblings = childrenOf.get(parent) ?? [];
      siblings.push(code);
      childrenOf.set(parent, siblings);
    } else {
      roots.push(code);
    }
  }

  for (const list of childrenOf.values()) list.sort(compareCodes);
  roots.sort(compareCodes);

  const rows: TreeRow<T>[] = [];

  const walk = (code: string, depth: number, guides: boolean[], isLast: boolean) => {
    const children = childrenOf.get(code) ?? [];
    rows.push({
      item: byCode.get(code)!,
      code,
      depth,
      guides,
      isLast,
      hasChildren: children.length > 0,
    });
    children.forEach((child, i) => {
      walk(child, depth + 1, [...guides, !isLast], i === children.length - 1);
    });
  };

  roots.forEach((code, i) => walk(code, 0, [], i === roots.length - 1));
  return rows;
}

/** Ancestor codes of `code`, outermost first: C01.2.1 -> [C01, C01.2]. */
export function ancestorsOf(code: string): string[] {
  const parts = code.split(".");
  return parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join("."));
}
