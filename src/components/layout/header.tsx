"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Settings, LogOut, User, Menu, CircleHelp } from "lucide-react";
import { getInitials } from "@/lib/utils";
import Link from "next/link";

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-[#020617]/95 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="inline-flex lg:hidden h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-slate-900 text-white shadow-sm hover:bg-slate-800"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">
              {title || "Dashboard"}
            </h1>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-3">
          <Link href="/help" aria-label="Open help center">
            <Button variant="ghost" size="icon" className="relative">
              <CircleHelp className="h-4 w-4" />
            </Button>
          </Link>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={session?.user?.image || ""}
                    alt={session?.user?.name || ""}
                  />
                  <AvatarFallback>
                    {getInitials(session?.user?.name || "User")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
