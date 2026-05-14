"use client"

import { useEffect, useState } from "react"
import { getTimeBasedGreeting } from "@/lib/greeting"

interface TimeGreetingProps {
  userName?: string | null
  className?: string
}

/**
 * Time-based greeting component
 * Uses browser time for client-side rendering
 * Shows personalized greeting based on time of day
 */
export function TimeGreeting({ userName, className = "text-2xl font-bold" }: TimeGreetingProps) {
  const [greeting, setGreeting] = useState<string>("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Set greeting on mount using browser time
    setGreeting(getTimeBasedGreeting(userName))
    setMounted(true)
  }, [userName])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div className={className}>Welcome back!</div>
  }

  return <h2 className={className}>{greeting}</h2>
}
