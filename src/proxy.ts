import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { UserRole } from "@/types"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Public routes - allow access without authentication
    if (pathname.startsWith("/auth") || pathname === "/") {
      return NextResponse.next()
    }

    // If user is not authenticated, redirect to signin
    if (!token) {
      const signInUrl = new URL("/auth/signin", req.url)
      signInUrl.searchParams.set("callbackUrl", req.url)
      return NextResponse.redirect(signInUrl)
    }

    // If authenticated user tries to access signin page, redirect to their dashboard
    if (pathname.startsWith("/auth/signin")) {
      const role = token.role as UserRole
      const roleRedirects: Record<UserRole, string> = {
        [UserRole.STUDENT]: "/student",
        [UserRole.SUPERVISOR]: "/supervisor", 
        [UserRole.LECTURER]: "/lecturer",
        [UserRole.ADMIN]: "/admin"
      }
      return NextResponse.redirect(new URL(roleRedirects[role], req.url))
    }

    // Role-based access control
    const role = token.role as UserRole
    const roleRedirects: Record<UserRole, string> = {
      [UserRole.STUDENT]: "/student",
      [UserRole.SUPERVISOR]: "/supervisor", 
      [UserRole.LECTURER]: "/lecturer",
      [UserRole.ADMIN]: "/admin"
    }

    // Check if user is trying to access wrong role's pages
    if (pathname.startsWith("/student") && role !== UserRole.STUDENT) {
      return NextResponse.redirect(new URL(roleRedirects[role], req.url))
    }
    if (pathname.startsWith("/supervisor") && role !== UserRole.SUPERVISOR) {
      return NextResponse.redirect(new URL(roleRedirects[role], req.url))
    }
    if (pathname.startsWith("/lecturer") && role !== UserRole.LECTURER) {
      return NextResponse.redirect(new URL(roleRedirects[role], req.url))
    }
    if (pathname.startsWith("/admin") && role !== UserRole.ADMIN) {
      return NextResponse.redirect(new URL(roleRedirects[role], req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages without authentication
        if (req.nextUrl.pathname.startsWith("/auth")) {
          return true
        }
        // Allow access to root page without authentication
        if (req.nextUrl.pathname === "/") {
          return true
        }
        // For all other pages, require authentication
        return !!token
      }
    },
    pages: {
      signIn: "/auth/signin",
    }
  }
)

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ]
}
