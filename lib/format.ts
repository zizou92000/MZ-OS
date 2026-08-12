const EUR = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const EUR_PRECISE = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const INT = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

export const EMPTY = "—";

export function money(value: number | null | undefined, precise = false) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EMPTY;
  }
  return precise ? EUR_PRECISE.format(value) : EUR.format(value);
}

export function integer(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EMPTY;
  }
  return INT.format(value);
}

export function ratio(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EMPTY;
  }
  return value.toFixed(digits);
}

export function percent(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EMPTY;
  }
  return `${(value * 100).toFixed(digits)} %`;
}

export function signedPercent(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EMPTY;
  }
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(digits)} pts`;
}

export function dateShort(value: Date | string | null | undefined) {
  if (!value) return EMPTY;
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return EMPTY;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(d);
}
