export type PerfField =
  | "spend"
  | "impressions"
  | "views3s"
  | "thruplays"
  | "outboundClicks"
  | "lpViews"
  | "atc"
  | "checkouts"
  | "purchases"
  | "revenue";

export const PERF_FIELDS: { key: PerfField; label: string }[] = [
  { key: "spend", label: "Montant dépensé" },
  { key: "impressions", label: "Impressions" },
  { key: "views3s", label: "Vues 3 s" },
  { key: "thruplays", label: "ThruPlays" },
  { key: "outboundClicks", label: "Clics sortants" },
  { key: "lpViews", label: "Vues de page" },
  { key: "atc", label: "Ajouts au panier" },
  { key: "checkouts", label: "Paiements initiés" },
  { key: "purchases", label: "Achats" },
  { key: "revenue", label: "Valeur de conversion" },
];

/** Header spellings Meta exports use, in ES/EN/FR. Matched loosely. */
const HEADER_PATTERNS: Record<PerfField | "name", RegExp[]> = {
  name: [/^(ad|anuncio|publicit)/i, /nombre del anuncio/i, /ad name/i],
  spend: [/amount spent/i, /importe gastado/i, /montant/i, /^spend$/i, /gasto/i],
  impressions: [/impressions/i, /impresiones/i],
  views3s: [
    /3-second/i,
    /3 s/i,
    /reproducciones de v[ií]deo de 3/i,
    /video plays at 3/i,
  ],
  thruplays: [/thruplay/i, /reproducciones completas/i],
  outboundClicks: [
    /outbound clicks/i,
    /clics salientes/i,
    /clics sortants/i,
    /link clicks/i,
    /clics en el enlace/i,
  ],
  lpViews: [
    /landing page views/i,
    /visitas a la p[aá]gina/i,
    /vues de page de destination/i,
  ],
  atc: [/add.*to cart/i, /carrito/i, /panier/i],
  checkouts: [
    /checkouts? initiated/i,
    /pagos iniciados/i,
    /paiements? initi/i,
    /initiate checkout/i,
  ],
  purchases: [/^purchases/i, /^compras/i, /^achats/i, /website purchases/i],
  revenue: [
    /purchase.*conversion value/i,
    /valor de conversi[oó]n/i,
    /valeur de conversion/i,
    /conversion value/i,
  ],
};

export type ColumnMapping = Partial<Record<PerfField | "name", number>>;

export type ParsedPaste = {
  headers: string[];
  rows: string[][];
  mapping: ColumnMapping;
  /** Fields the app could not confidently place — the dialog asks about these. */
  unmapped: PerfField[];
  delimiter: string;
  locale: NumberLocale;
};

function detectDelimiter(firstLine: string): string {
  const counts: [string, number][] = [
    ["\t", (firstLine.match(/\t/g) ?? []).length],
    [";", (firstLine.match(/;/g) ?? []).length],
    [",", (firstLine.match(/,/g) ?? []).length],
  ];
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : "\t";
}

function splitLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else quoted = !quoted;
    } else if (ch === delimiter && !quoted) {
      out.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  out.push(current.trim());
  return out;
}

/**
 * Accepts European (1.234,56) and Anglo (1,234.56) number formats, plus
 * currency symbols and stray spaces, because a Meta export is whatever the
 * account locale happens to be.
 */
export type NumberLocale = "eu" | "anglo" | "auto";

/**
 * "7.652" is 7652 in a Spanish export and 7.652 in an English one, and no
 * single cell can tell you which. So the format is decided once for the whole
 * pasted block, from whichever separator shows up as a decimal somewhere in it.
 */
export function detectNumberLocale(cells: readonly string[]): NumberLocale {
  let eu = 0;
  let anglo = 0;
  for (const cell of cells) {
    const s = cell.replace(/[^\d.,-]/g, "");
    if (/^-?\d{1,3}(\.\d{3})+,\d+$/.test(s)) eu += 3;
    else if (/^-?\d{1,3}(,\d{3})+\.\d+$/.test(s)) anglo += 3;
    else if (/^-?\d+,\d{1,2}$/.test(s)) eu += 2;
    else if (/^-?\d+\.\d{1,2}$/.test(s)) anglo += 2;
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) eu += 1;
    else if (/^-?\d{1,3}(,\d{3})+$/.test(s)) anglo += 1;
  }
  if (eu === anglo) return "auto";
  return eu > anglo ? "eu" : "anglo";
}

export function parseNumber(
  raw: string,
  locale: NumberLocale = "auto",
): number | null {
  if (!raw) return null;
  if (locale === "eu" || locale === "anglo") {
    const cleaned = raw.replace(/[^\d.,-]/g, "").trim();
    if (cleaned === "" || cleaned === "-" || !/\d/.test(cleaned)) return null;
    const normalised =
      locale === "eu"
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "");
    const parsed = Number(normalised);
    return Number.isFinite(parsed) ? parsed : null;
  }
  let s = raw.replace(/[€$£\s %]/g, "").trim();
  if (s === "" || s === "-" || /^n\/?a$/i.test(s)) return null;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    // Whichever separator comes last is the decimal one.
    if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (lastComma !== -1) {
    const decimals = s.length - lastComma - 1;
    // "1,234" is a thousands group; "1,23" is a decimal.
    s = decimals === 3 ? s.replace(/,/g, "") : s.replace(",", ".");
  } else {
    s = s.replace(/(?<=\d),(?=\d{3}\b)/g, "");
  }

  const value = Number(s);
  return Number.isFinite(value) ? value : null;
}

export function parsePaste(text: string): ParsedPaste {
  const lines = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((l) => l.trim() !== "");

  if (lines.length === 0) {
    return {
      headers: [],
      rows: [],
      mapping: {},
      unmapped: PERF_FIELDS.map((f) => f.key),
      delimiter: "\t",
      locale: "auto",
    };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitLine(lines[0], delimiter);

  // A real header row is mostly words. A data row whose first cell is an ad
  // name still has numbers in the majority of its columns.
  const nonNumeric = headers.filter(
    (h) => h !== "" && parseNumber(h) === null,
  ).length;
  const looksLikeHeader = nonNumeric > headers.length / 2;

  const rows = (looksLikeHeader ? lines.slice(1) : lines).map((l) =>
    splitLine(l, delimiter),
  );
  const locale = detectNumberLocale(rows.flat());

  const mapping: ColumnMapping = {};
  if (looksLikeHeader) {
    const taken = new Set<number>();
    for (const [field, patterns] of Object.entries(HEADER_PATTERNS) as [
      PerfField | "name",
      RegExp[],
    ][]) {
      const index = headers.findIndex(
        (h, i) => !taken.has(i) && patterns.some((p) => p.test(h)),
      );
      if (index !== -1) {
        mapping[field] = index;
        taken.add(index);
      }
    }
  }

  const unmapped = PERF_FIELDS.map((f) => f.key).filter(
    (k) => mapping[k] === undefined,
  );

  return {
    headers: looksLikeHeader ? headers : headers.map((_, i) => `Colonne ${i + 1}`),
    rows,
    mapping,
    unmapped,
    delimiter,
    locale,
  };
}

export type MappedRow = {
  name: string | null;
  values: Partial<Record<PerfField, number | null>>;
};

export function applyMapping(
  parsed: Pick<ParsedPaste, "rows"> & { locale?: NumberLocale },
  mapping: ColumnMapping,
): MappedRow[] {
  const locale = parsed.locale ?? "auto";
  return parsed.rows.map((cells) => {
    const values: Partial<Record<PerfField, number | null>> = {};
    for (const { key } of PERF_FIELDS) {
      const index = mapping[key];
      values[key] =
        index === undefined ? null : parseNumber(cells[index] ?? "", locale);
    }
    const nameIndex = mapping.name;
    return {
      name: nameIndex === undefined ? null : (cells[nameIndex] ?? null),
      values,
    };
  });
}

/**
 * Matches a pasted ad name to a known creative. Meta names carry the code as
 * their first underscore-separated segment, but legacy names do not, so both
 * paths are tried.
 */
export function matchCreative(
  name: string | null,
  creatives: readonly { code: string; metaName: string; legacyMetaName: string | null }[],
): string | null {
  if (!name) return null;
  const clean = name.trim();
  if (clean === "") return null;

  const exact = creatives.find(
    (c) => c.metaName === clean || c.legacyMetaName === clean,
  );
  if (exact) return exact.code;

  const firstSegment = clean.split("_")[0];
  const byCode = creatives.find((c) => c.code === firstSegment);
  if (byCode) return byCode.code;

  const contained = creatives.filter((c) =>
    new RegExp(`(^|[^\\w.])${escapeRegExp(c.code)}([^\\w.]|$)`).test(clean),
  );
  if (contained.length === 1) return contained[0].code;

  return null;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
