import { NextResponse, type NextRequest } from 'next/server'

const COOKIE_NAME = 'admin_session'

export function handleAdminRoute(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname

  // Check if this is an admin route
  if (!pathname.startsWith('/admin')) {
    return null
  }

  // Allow login page without auth
  if (pathname === '/admin/login') {
    // If already logged in, redirect to dashboard
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (token) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Check for valid admin session
  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
