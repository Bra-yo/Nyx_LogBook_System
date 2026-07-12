import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface RoleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  active?: boolean;
  onClick: () => void;
}

export function RoleCard({
  title,
  description,
  icon: Icon,
  active,
  onClick,
}: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex h-full min-h-[200px] w-full flex-col items-center justify-center rounded-2xl border p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-primary/60 hover:shadow-xl",
        active
          ? "border-primary/70 bg-primary/10 shadow-md"
          : "border-border/70 bg-card/80",
      )}
    >
      <div
        className={cn(
          "mb-5 inline-flex rounded-2xl p-4 transition-colors duration-300",
          active
            ? "bg-primary text-primary-foreground"
            : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mx-auto max-w-[220px] text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </button>
  );
}
