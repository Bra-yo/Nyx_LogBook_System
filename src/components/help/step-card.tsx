import { cn } from "@/lib/utils";

interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  accent?: boolean;
}

export function StepCard({
  stepNumber,
  title,
  description,
  accent,
}: StepCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm",
        accent && "border-primary/30 bg-primary/5",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {stepNumber}
        </div>
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
