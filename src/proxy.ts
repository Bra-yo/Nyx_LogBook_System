import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { authOptions } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow access to auth routes and static files
  if (pathname.startsWith('/api/auth') || 
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.svg')) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  
  // If user must change password, only allow access to change password page
  if (token?.mustChangePassword === true) {
    if (pathname === '/auth/change-password') {
      return NextResponse.next()
    }
    
    // Redirect to change password page for all other routes
    const changePasswordUrl = new URL('/auth/change-password', request.url)
    return NextResponse.redirect(changePasswordUrl)
  }

  // Allow access to sign-in page for unauthenticated users
  if (!token && pathname === '/auth/signin') {
    return NextResponse.next()
  }

  // Redirect unauthenticated users to sign-in
  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url)
    return NextResponse.redirect(signInUrl)
  }

  // Role-based redirects for authenticated users
  const roleRedirects = {
    ADMIN: '/admin',
    STUDENT: '/student',
    SUPERVISOR: '/supervisor',
    LECTURER: '/lecturer'
  }

  const userRole = token.role as string
  const expectedPath = roleRedirects[userRole as keyof typeof roleRedirects]

  // If user is trying to access wrong role dashboard, redirect to correct one
  if (expectedPath && !pathname.startsWith(expectedPath)) {
    const correctUrl = new URL(expectedPath, request.url)
    return NextResponse.redirect(correctUrl)
  }

  // Protect role-based routes
  const protectedRoutes = {
    '/admin': 'ADMIN',
    '/student': 'STUDENT', 
    '/supervisor': 'SUPERVISOR',
    '/lecturer': 'LECTURER'
  }

  for (const [route, requiredRole] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route) && token?.role !== requiredRole) {
      const homeUrl = new URL('/', request.url)
      return NextResponse.redirect(homeUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/student/:path*',
    '/supervisor/:path*', 
    '/lecturer/:path*',
    '/auth/change-password',
    '/api/auth/:path*'
  ]
}
