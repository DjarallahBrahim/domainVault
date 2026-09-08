"use client";

import { useTheme } from "next-themes";
import { getChartTheme, resolveChartMode } from "@/lib/theme/chart-colors";

/**
 * Resolve the chart palette from live CSS tokens for the current theme.
 * Returns a new object per render; series colours are concrete `rgb(...)`
 * strings that Recharts SVG attributes accept (ADR-011).
 */
export function useChartTheme() {
  const { theme, resolvedTheme } = useTheme();
  return getChartTheme(resolveChartMode(theme, resolvedTheme));
}
