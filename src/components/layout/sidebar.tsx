"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BRANDING } from "@/lib/branding";
import { terminology } from "@/lib/terminology";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  Settings,
  LogOut,
  FileText,
  Folder,
  Calendar,
  Bell,
  BarChart3,
  Clock,
  QrCode,
  UserCircle2,
} from "lucide-react";
import { UserRole } from "@/types";

interface SidebarProps {
  userRole: UserRole;
  className?: string;
  onNavigate?: () => void;
}

const navigationItems = {
  [UserRole.STUDENT]: [
    {
      title: "Dashboard",
      href: "/student",
      icon: LayoutDashboard,
    },
    {
      title: "My Portfolio",
      href: "/portfolio",
      icon: UserCircle2,
    },
    {
      title: "Attendance",
      href: "/student/attendance",
      icon: Clock,
    },
    {
      title: terminology.projects,
      href: "/student/projects",
      icon: Folder,
    },
    {
      title: "WorkLog",
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
    {
      title: "Profile",
      href: "/student/profile",
      icon: UserCircle2,
    },
    {
      title: "Settings",
      href: "/student/settings",
      icon: Settings,
    },
  ],
  [UserRole.SUPERVISOR]: [
    {
      title: "Dashboard",
      href: "/supervisor",
      icon: LayoutDashboard,
    },
    {
      title: "My Portfolio",
      href: "/portfolio",
      icon: UserCircle2,
    },
    {
      title: "Office Location",
      href: "/supervisor/office-location",
      icon: QrCode,
    },
    {
      title: terminology.projects,
      href: "/supervisor/projects",
      icon: Folder,
    },
    {
      title: "Learners",
      href: "/supervisor/students",
      icon: Users,
    },
    {
      title: "Attendance",
      href: "/supervisor/attendance",
      icon: Clock,
    },
    {
      title: "Mentor Reviews",
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
    {
      title: "Profile",
      href: "/supervisor/profile",
      icon: UserCircle2,
    },
    {
      title: "Settings",
      href: "/supervisor/settings",
      icon: Settings,
    },
  ],
  [UserRole.LECTURER]: [
    {
      title: "Dashboard",
      href: "/lecturer",
      icon: LayoutDashboard,
    },
    {
      title: "My Portfolio",
      href: "/portfolio",
      icon: UserCircle2,
    },
    {
      title: "Learners",
      href: "/lecturer/students",
      icon: Users,
    },
    {
      title: "Attendance",
      href: "/lecturer/attendance",
      icon: Clock,
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
    {
      title: "Profile",
      href: "/lecturer/profile",
      icon: UserCircle2,
    },
    {
      title: "Settings",
      href: "/lecturer/settings",
      icon: Settings,
    },
  ],
  [UserRole.WORKER]: [
    {
      title: "Dashboard",
      href: "/worker",
      icon: LayoutDashboard,
    },
    {
      title: "My Portfolio",
      href: "/portfolio",
      icon: UserCircle2,
    },
    {
      title: "Attendance",
      href: "/worker/attendance",
      icon: Clock,
    },
    {
      title: "Work Log",
      href: "/worker/logbook",
      icon: BookOpen,
    },
    {
      title: "Profile",
      href: "/worker/profile",
      icon: UserCircle2,
    },
    {
      title: "Settings",
      href: "/worker/settings",
      icon: Settings,
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
      title: "Attendance",
      href: "/admin/attendance",
      icon: Clock,
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
      title: "Profile",
      href: "/admin/profile",
      icon: UserCircle2,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ],
};

export function Sidebar({ userRole, className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const navigation = navigationItems[userRole] || [];

  return (
    <div
      className={cn(
        "flex h-full min-h-full flex-col bg-[#020617] text-white border-r border-white/10",
        className,
      )}
    >
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <div className="flex items-center space-x-2">
          <div>
            <h1 className="text-sm font-semibold">
              {BRANDING.organizationName}
            </h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/student" && pathname.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start text-slate-100 hover:bg-slate-800 hover:text-white",
                  isActive && "bg-slate-800 text-white",
                )}
                onClick={onNavigate}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          );
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
  );
}
