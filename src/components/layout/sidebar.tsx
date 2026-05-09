"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  GraduationCap, 
  Settings,
  LogOut,
  FileText,
  Calendar,
  Bell,
  BarChart3
} from "lucide-react"
import { UserRole } from "@/types"

interface SidebarProps {
  userRole: UserRole
  className?: string
}

const navigationItems = {
  [UserRole.STUDENT]: [
    {
      title: "Dashboard",
      href: "/student",
      icon: LayoutDashboard,
    },
    {
      title: "Logbook Entries",
      href: "/student/logbook",
      icon: BookOpen,
    },
    {
      title: "Calendar",
      href: "/student/calendar",
      icon: Calendar,
    },
    {
      title: "Reports",
      href: "/student/reports",
      icon: FileText,
    },
    {
      title: "Notifications",
      href: "/student/notifications",
      icon: Bell,
    },
  ],
  [UserRole.SUPERVISOR]: [
    {
      title: "Dashboard",
      href: "/supervisor",
      icon: LayoutDashboard,
    },
    {
      title: "Students",
      href: "/supervisor/students",
      icon: Users,
    },
    {
      title: "Review Entries",
      href: "/supervisor/review",
      icon: FileText,
    },
    {
      title: "Analytics",
      href: "/supervisor/analytics",
      icon: BarChart3,
    },
    {
      title: "Notifications",
      href: "/supervisor/notifications",
      icon: Bell,
    },
  ],
  [UserRole.LECTURER]: [
    {
      title: "Dashboard",
      href: "/lecturer",
      icon: LayoutDashboard,
    },
    {
      title: "Students",
      href: "/lecturer/students",
      icon: Users,
    },
    {
      title: "Assessments",
      href: "/lecturer/assessments",
      icon: GraduationCap,
    },
    {
      title: "Reports",
      href: "/lecturer/reports",
      icon: FileText,
    },
    {
      title: "Analytics",
      href: "/lecturer/analytics",
      icon: BarChart3,
    },
  ],
  [UserRole.ADMIN]: [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "Departments",
      href: "/admin/departments",
      icon: Settings,
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
    },
    {
      title: "System Logs",
      href: "/admin/logs",
      icon: FileText,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ],
}

export function Sidebar({ userRole, className }: SidebarProps) {
  const pathname = usePathname()
  const navigation = navigationItems[userRole] || []

  return (
    <div className={cn("flex h-full w-64 flex-col bg-card border-r", className)}>
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">NYX</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold">LogBook</h1>
            <p className="text-xs text-muted-foreground">Quant Systems</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/student" && pathname.startsWith(item.href))
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-secondary text-secondary-foreground"
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <Link href="/auth/signout">
          <Button variant="ghost" className="w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </Link>
      </div>
    </div>
  )
}
