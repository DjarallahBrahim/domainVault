/**
 * Chart theme constants (ADR-011).
 *
 * Recharts takes concrete colour strings for `fill`/`stroke`. CSS variables
 * don't resolve inside SVG presentation attributes, so charts need resolved
 * colours. This module reads the token triplets from the live document so a
 * single source of truth (app/globals.css) drives both UI and charts, with
 * static fallbacks mirroring the light theme for SSR/first paint.
 */

export type ChartTheme = {
  accent: string;
  success: string;
  warning: string;
  danger: string;
  text: string;
  textMuted: string;
  grid: string;
  tooltipBg: string;
  tooltipBorder: string;
  /** Categorical scale anchored on the accent + neutrals (platform chart). */
  category: string[];
};

/** Blend two resolved rgb colours toward each other (w in 0..1). */
export function blend(a: string, b: string, w: number): string {
  const [r1, g1, b1] = toRgb(a);
  const [r2, g2, b2] = toRgb(b);
  const r = Math.round(r1 + (r2 - r1) * w);
  const g = Math.round(g1 + (g2 - g1) * w);
  const bl = Math.round(b1 + (b2 - b1) * w);
  return `rgb(${r}, ${g}, ${bl})`;
}

const FALLBACK: ChartTheme = {
  accent: "rgb(79, 70, 229)",
  success: "rgb(5, 150, 105)",
  warning: "rgb(217, 119, 6)",
  danger: "rgb(220, 38, 38)",
  text: "rgb(29, 29, 31)",
  textMuted: "rgb(110, 110, 115)",
  grid: "rgb(227, 227, 232)",
  tooltipBg: "rgb(255, 255, 255)",
  tooltipBorder: "rgb(227, 227, 232)",
  category: [
    "rgb(79, 70, 229)",
    "rgb(5, 150, 105)",
    "rgb(245, 158, 11)",
    "rgb(14, 165, 233)",
    "rgb(236, 72, 153)",
    "rgb(168, 85, 247)",
    "rgb(20, 184, 166)",
    "rgb(244, 63, 94)",
  ],
};

function readVar(name: string): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!raw) return null;
  const parts = raw.split(/\s+/).filter(Boolean).join(", ");
  return `rgb(${parts})`;
}

function toRgb(value: string): [number, number, number] {
  const match = value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : [0, 0, 0];
}

/**
 * Resolve the chart theme from live CSS variables. `mode` is the effective
 * `light` | `dark` theme (resolved from next-themes, see resolveChartMode).
 */
export function getChartTheme(mode: "light" | "dark"): ChartTheme {
  const c = (name: string, fallback: string) => readVar(name) ?? fallback;
  const light = mode === "light";

  const accent = c("--accent-primary", FALLBACK.accent);
  const success = c("--accent-success", FALLBACK.success);
  const warning = c("--accent-warning", FALLBACK.warning);
  const danger = c("--accent-danger", FALLBACK.danger);
  const textMuted = c("--text-muted", FALLBACK.textMuted);
  const border = c("--border", FALLBACK.grid);
  const surface = c("--bg-surface", FALLBACK.tooltipBg);
  const text = c("--text-primary", FALLBACK.text);
  const bg = light ? "rgb(255, 255, 255)" : "rgb(28, 28, 30)";
  const base = light ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)";

  // Gridlines should whisper, not shout — blend the border well toward the
  // background so the series stays the visual anchor.
  const grid = light
    ? blend(border, "rgb(255, 255, 255)", 0.6)
    : blend(border, "rgb(0, 0, 0)", 0.45);

  return {
    accent,
    success,
    warning,
    danger,
    text,
    textMuted,
    grid,
    tooltipBg: surface,
    tooltipBorder: light ? border : blend(bg, "rgb(255, 255, 255)", 0.22),
    category: [
      accent,
      success,
      warning,
      light ? "rgb(2, 132, 199)" : "rgb(56, 189, 248)",
      light ? "rgb(190, 24, 93)" : "rgb(244, 114, 182)",
      light ? "rgb(126, 34, 206)" : "rgb(192, 132, 252)",
      light ? "rgb(13, 148, 136)" : "rgb(45, 212, 191)",
      light ? "rgb(225, 29, 72)" : "rgb(251, 113, 133)",
    ].map((x) => blend(x, base, light ? 0.08 : 0)),
  };
}

/** Resolve an opaque next-themes value into an effective light/dark mode. */
export function resolveChartMode(
  theme: string | undefined,
  resolvedTheme: string | undefined
): "light" | "dark" {
  const effective = theme === "system" ? resolvedTheme : theme;
  return effective === "dark" ? "dark" : "light";
}
