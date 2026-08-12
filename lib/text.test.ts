import { describe, expect, it } from "vitest";
import { normaliseVerbatim, pickCanonical } from "./text";

describe("pickCanonical", () => {
  it("prefers the spelling that kept its accents and punctuation", () => {
    expect(
      pickCanonical(["Sabes cuanto tiras", "¿Sabes cuánto tiras?"]),
    ).toBe("¿Sabes cuánto tiras?");
  });

  it("never lets an all-caps variant win on a tie, whatever its position", () => {
    const proper = "¿Sabes cuánto tiras a la basura?";
    const shouty = "¿SABES CUÁNTO TIRAS A LA BASURA?";
    expect(pickCanonical([shouty, proper])).toBe(proper);
    expect(pickCanonical([proper, shouty])).toBe(proper);
  });

  it("returns the only variant when there is one", () => {
    expect(pickCanonical(["Adiós bolsas"])).toBe("Adiós bolsas");
  });
});

describe("normaliseVerbatim", () => {
  it("collapses case differences", () => {
    expect(normaliseVerbatim("Adiós Bolsas")).toBe(
      normaliseVerbatim("adiós bolsas"),
    );
  });

  it("collapses accent differences", () => {
    expect(normaliseVerbatim("adios bolsas")).toBe(
      normaliseVerbatim("adiós bolsas"),
    );
  });

  it("collapses Spanish punctuation", () => {
    expect(normaliseVerbatim("¿Cuánto tiras?")).toBe(
      normaliseVerbatim("Cuanto tiras"),
    );
  });

  it("collapses repeated whitespace", () => {
    expect(normaliseVerbatim("tu  comida   fresca")).toBe("tu comida fresca");
  });

  it("keeps genuinely different verbatims apart", () => {
    expect(normaliseVerbatim("Tu comida fresca 14 días")).not.toBe(
      normaliseVerbatim("Tu comida fresca 7 días"),
    );
  });

  it("returns an empty string for whitespace only", () => {
    expect(normaliseVerbatim("   ")).toBe("");
  });
});
