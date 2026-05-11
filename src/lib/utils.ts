import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function getInitials(name?: string | null): string {
  if (!name) return "U"

  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
export function formatDate(date?: string | Date | null): string {
  if (!date) return "N/A"

  const parsedDate = typeof date === "string" ? new Date(date) : date

  if (Number.isNaN(parsedDate.getTime())) {
    return "N/A"
  }

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsedDate)
}