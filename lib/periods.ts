import { getISOWeek, getISOWeekYear } from "date-fns";
import type { Period } from "./taxonomy";

/** Creatives must be live before the window opens, not on the event date. */
export const LEAD_WEEKS = 2;

export type PeriodWindow = {
  code: Period;
  startWeek: number;
  endWeek: number;
  orderIndex: number;
};

export type WindowStatus = {
  period: PeriodWindow;
  /** Weeks until the diffusion window opens; negative once it has opened. */
  weeksUntilStart: number;
  /** Weeks until creatives must be live (start minus the lead time). */
  weeksUntilLaunch: number;
  isCurrent: boolean;
};

export function currentWeekNumber(date: Date): number {
  return getISOWeek(date);
}

export function isoYearOf(date: Date): number {
  return getISOWeekYear(date);
}

/**
 * The period containing today, and the next one to prepare for. Wraps around
 * the year end so December still points at January.
 */
export function windowStatus(
  periods: readonly PeriodWindow[],
  date: Date,
): { current: WindowStatus | null; next: WindowStatus | null } {
  if (periods.length === 0) return { current: null, next: null };

  const week = currentWeekNumber(date);
  const ordered = [...periods].sort((a, b) => a.startWeek - b.startWeek);

  const current =
    ordered.find((p) => week >= p.startWeek && week <= p.endWeek) ?? null;

  const upcoming =
    ordered.find((p) => p.startWeek > week) ??
    // Past the last window: the next one is the first of next year.
    ordered[0];

  const weeksTo = (p: PeriodWindow) =>
    p.startWeek > week ? p.startWeek - week : p.startWeek + 52 - week;

  return {
    current: current
      ? {
          period: current,
          weeksUntilStart: current.startWeek - week,
          weeksUntilLaunch: current.startWeek - LEAD_WEEKS - week,
          isCurrent: true,
        }
      : null,
    next: upcoming
      ? {
          period: upcoming,
          weeksUntilStart: weeksTo(upcoming),
          weeksUntilLaunch: weeksTo(upcoming) - LEAD_WEEKS,
          isCurrent: false,
        }
      : null,
  };
}

export function formatWindow(p: { startWeek: number; endWeek: number }): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `W${pad(p.startWeek)}–W${pad(p.endWeek)}`;
}
