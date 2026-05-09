"use client"

import { useSession } from "next-auth/react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { UserRole } from "@/types"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const userRole = session.user.role as UserRole

  return (
    <div className="flex h-screen bg-background">
      <Sidebar userRole={userRole} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
        <footer className="border-t bg-muted/50 px-6 py-4">
          <p className="text-center text-sm text-muted-foreground">
            © 2026 NYX QUANT SYSTEMS LTD. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  )
}
