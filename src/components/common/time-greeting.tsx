"use client";

import { getTimeBasedGreeting } from "@/lib/greeting";

interface TimeGreetingProps {
  userName?: string | null;
  className?: string;
}

/**
 * Time-based greeting component
 * Uses browser time for client-side rendering
 * Shows personalized greeting based on time of day
 */
export function TimeGreeting({
  userName,
  className = "text-2xl font-bold",
}: TimeGreetingProps) {
  if (typeof window === "undefined") {
    return <div className={className}>Welcome back!</div>;
  }

  const greeting = getTimeBasedGreeting(userName);
  return <h2 className={className}>{greeting}</h2>;
}
