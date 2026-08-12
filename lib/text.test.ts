import { describe, expect, it } from "vitest";
import { normaliseVerbatim } from "./text";

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
