import type { ReactNode } from "react";
import { clsx } from "clsx";

export function RiskBadge({ status }: { status?: string | null }) {
  const normalized = (status || "GREEN").toUpperCase();
  const tone =
    normalized === "RED"
      ? "border-red-200 bg-red-50 text-red-700"
      : normalized === "AMBER"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <span className={clsx("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", tone)}>
      {normalized}
    </span>
  );
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  tone = "default",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClasses = {
    default: "border-border bg-background",
    success: "border-emerald-200 bg-emerald-50",
    warning: "border-amber-200 bg-amber-50",
    danger: "border-red-200 bg-red-50",
  };

  return (
    <div className={clsx("rounded-lg border p-4", toneClasses[tone])}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

export function ProgressMeter({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "success" | "warning" | "danger" }) {
  const toneClasses = {
    default: "bg-primary",
    success: "bg-emerald-600",
    warning: "bg-amber-600",
    danger: "bg-red-600",
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={clsx("h-full rounded-full", toneClasses[tone])} style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
      </div>
    </div>
  );
}
