import { describe, expect, it } from "vitest";
import {
  applyMapping,
  detectNumberLocale,
  matchCreative,
  parseNumber,
  parsePaste,
} from "./paste-import";

describe("parseNumber", () => {
  it("reads plain integers and decimals", () => {
    expect(parseNumber("42")).toBe(42);
    expect(parseNumber("42.5")).toBe(42.5);
  });

  it("reads European decimal commas", () => {
    expect(parseNumber("42,50")).toBe(42.5);
    expect(parseNumber("1.234,56")).toBe(1234.56);
  });

  it("reads Anglo thousands separators", () => {
    expect(parseNumber("1,234.56")).toBe(1234.56);
    expect(parseNumber("1,234")).toBe(1234);
  });

  it("strips currency symbols and spaces", () => {
    expect(parseNumber("€ 1.234,56")).toBe(1234.56);
    expect(parseNumber("12,5 %")).toBe(12.5);
    expect(parseNumber(" 89 ")).toBe(89);
  });

  it("returns null for blanks and placeholders", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("-")).toBeNull();
    expect(parseNumber("N/A")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
  });
});

const META_ES = `Nombre del anuncio\tImporte gastado (EUR)\tImpresiones\tReproducciones de vídeo de 3 segundos\tThruPlays\tClics salientes\tVisitas a la página de destino\tArtículos añadidos al carrito\tPagos iniciados\tCompras\tValor de conversión de compras
C01.2_Organisation_DemoFAQ_H06_HOOK_26W31\t88,40\t7.652\t2.219\t574\t96\t84\t14\t8\t3\t171,00
C02.1_Fraicheur_Comparatif_H04_HOOK_26W31\t58,10\t5.043\t1.462\t378\t63\t55\t9\t5\t2\t101,20`;

describe("detectNumberLocale", () => {
  it("reads a Spanish export as European", () => {
    expect(detectNumberLocale(["88,40", "7.652", "171,00"])).toBe("eu");
  });

  it("reads an English export as Anglo", () => {
    expect(detectNumberLocale(["88.40", "7,652", "171.00"])).toBe("anglo");
  });

  it("resolves ambiguous thousands using the decimals in the same block", () => {
    // 7.652 alone is ambiguous; 88,40 proves the block is European.
    expect(parseNumber("7.652", detectNumberLocale(["88,40", "7.652"]))).toBe(
      7652,
    );
    expect(parseNumber("7,652", detectNumberLocale(["88.40", "7,652"]))).toBe(
      7652,
    );
  });
});

describe("parsePaste", () => {
  it("detects tab delimiter and maps Spanish Meta headers", () => {
    const parsed = parsePaste(META_ES);
    expect(parsed.delimiter).toBe("\t");
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.mapping.name).toBe(0);
    expect(parsed.mapping.spend).toBe(1);
    expect(parsed.mapping.impressions).toBe(2);
    expect(parsed.mapping.views3s).toBe(3);
    expect(parsed.mapping.thruplays).toBe(4);
    expect(parsed.mapping.outboundClicks).toBe(5);
    expect(parsed.mapping.lpViews).toBe(6);
    expect(parsed.mapping.purchases).toBe(9);
    expect(parsed.mapping.revenue).toBe(10);
    expect(parsed.unmapped).toEqual([]);
  });

  it("maps English headers too", () => {
    const parsed = parsePaste(
      `Ad name,Amount spent (EUR),Impressions,Outbound clicks,Landing page views,Purchases,Purchases conversion value
C01,10.50,900,12,10,1,52.60`,
    );
    expect(parsed.delimiter).toBe(",");
    expect(parsed.mapping.spend).toBe(1);
    expect(parsed.mapping.revenue).toBe(6);
    expect(parsed.unmapped).toContain("views3s");
  });

  it("reads values through the mapping with European numbers", () => {
    const parsed = parsePaste(META_ES);
    const rows = applyMapping(parsed, parsed.mapping);
    expect(rows[0].name).toBe("C01.2_Organisation_DemoFAQ_H06_HOOK_26W31");
    expect(rows[0].values.spend).toBe(88.4);
    expect(rows[0].values.impressions).toBe(7652);
    expect(rows[0].values.revenue).toBe(171);
    expect(rows[1].values.purchases).toBe(2);
  });

  it("treats a headerless paste as data", () => {
    const parsed = parsePaste("C01\t10\t900\nC02\t20\t800");
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.headers[0]).toBe("Colonne 1");
  });

  it("handles quoted cells containing the delimiter", () => {
    const parsed = parsePaste(
      `Ad name,Amount spent\n"C01, version longue",12.00`,
    );
    const rows = applyMapping(parsed, parsed.mapping);
    expect(rows[0].name).toBe("C01, version longue");
    expect(rows[0].values.spend).toBe(12);
  });

  it("returns an empty result for empty input", () => {
    const parsed = parsePaste("   \n  ");
    expect(parsed.rows).toEqual([]);
  });
});

const CREATIVES = [
  {
    code: "C01",
    metaName: "C01_Organisation_DemoFAQ_H01_ORIGINE_26W28",
    legacyMetaName: "Video antiguo 3",
  },
  {
    code: "C01.2",
    metaName: "C01.2_Organisation_DemoFAQ_H06_HOOK_26W31",
    legacyMetaName: null,
  },
];

describe("matchCreative", () => {
  it("matches the derived Meta name exactly", () => {
    expect(
      matchCreative("C01.2_Organisation_DemoFAQ_H06_HOOK_26W31", CREATIVES),
    ).toBe("C01.2");
  });

  it("matches a legacy name kept from before the migration", () => {
    expect(matchCreative("Video antiguo 3", CREATIVES)).toBe("C01");
  });

  it("matches on the leading code segment when the rest drifted", () => {
    expect(matchCreative("C01.2_Organisation_DemoFAQ_H06_CTA_26W40", CREATIVES)).toBe(
      "C01.2",
    );
  });

  it("does not confuse C01 with C01.2", () => {
    expect(matchCreative("C01.2", CREATIVES)).toBe("C01.2");
    expect(matchCreative("C01", CREATIVES)).toBe("C01");
  });

  it("returns null when nothing matches", () => {
    expect(matchCreative("Anuncio desconocido", CREATIVES)).toBeNull();
    expect(matchCreative(null, CREATIVES)).toBeNull();
    expect(matchCreative("", CREATIVES)).toBeNull();
  });
});
