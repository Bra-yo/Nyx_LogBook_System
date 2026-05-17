"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { UserRole } from "@/types"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
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
    <div className="relative min-h-screen bg-background text-foreground">
      <div
        className={`fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-[100] w-72 max-w-[85vw] transform border-r border-white/10 bg-[#020617] text-white shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0 lg:block lg:w-64 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar userRole={userRole} onNavigate={() => setSidebarOpen(false)} />
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-0">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 min-w-0 w-full overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          {children}
        </main>
        <footer className="border-t bg-muted/50 px-4 py-4 text-center text-xs sm:text-sm sm:px-6 lg:px-8">
          <p className="break-words text-muted-foreground">
            © 2026 NYX QUANT SYSTEMS LTD. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  )
}
