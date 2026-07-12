"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItemProps {
  question: string;
  answer: string;
}

export function FAQItem({ question, answer }: FAQItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-medium">{question}</span>
        <ChevronRight
          className={cn("h-4 w-4 transition-transform", open && "rotate-90")}
        />
      </button>
      {open && (
        <p className="px-5 pb-5 text-sm text-muted-foreground">{answer}</p>
      )}
    </div>
  );
}
