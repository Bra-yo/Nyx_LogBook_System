"use client";

import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StepCard } from "@/components/help/step-card";

interface StepItem {
  title: string;
  description: string;
}

interface GuideSectionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  steps?: StepItem[];
  tips?: string[];
  mistakes?: string[];
  children?: ReactNode;
}

export function GuideSection({
  icon: Icon,
  title,
  description,
  steps = [],
  tips = [],
  mistakes = [],
  children,
}: GuideSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="w-full text-left"
      >
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
            {isOpen ? (
              <ChevronDown className="mt-1 h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="mt-1 h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
      </button>
      {isOpen && (
        <CardContent className="space-y-5 px-6 py-6">
          {steps.length > 0 && (
            <div className="space-y-3">
              {steps.map((step, index) => (
                <StepCard
                  key={`${title}-${step.title}`}
                  stepNumber={index + 1}
                  title={step.title}
                  description={step.description}
                  accent={index === 0}
                />
              ))}
            </div>
          )}

          {tips.length > 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <h4 className="mb-2 font-semibold text-emerald-700 dark:text-emerald-400">
                Tips
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {tips.map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {mistakes.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <h4 className="mb-2 font-semibold text-amber-700 dark:text-amber-400">
                Common mistakes
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {mistakes.map((mistake) => (
                  <li key={mistake} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {children}
        </CardContent>
      )}
    </Card>
  );
}
