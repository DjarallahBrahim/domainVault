"use client";

interface CsvOptionToggleProps {
  mode: "skip" | "update";
  onModeChange: (mode: "skip" | "update") => void;
  disabled?: boolean;
}

export function CsvOptionToggle({
  mode,
  onModeChange,
  disabled = false,
}: CsvOptionToggleProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-text-muted">Duplicate handling:</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onModeChange("skip")}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          mode === "skip"
            ? "bg-accent-primary text-white"
            : "bg-bg-elevated text-text-muted hover:text-text-primary"
        }`}
      >
        Skip existing
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onModeChange("update")}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          mode === "update"
            ? "bg-accent-primary text-white"
            : "bg-bg-elevated text-text-muted hover:text-text-primary"
        }`}
      >
        Update existing
      </button>
    </div>
  );
}
