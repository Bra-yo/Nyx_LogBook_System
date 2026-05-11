"use client"

import { Suspense } from "react"
import { Loader2 } from "lucide-react"

// This component will be used to wrap the attendance page content
export function AttendancePageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      {children}
    </Suspense>
  )
}
