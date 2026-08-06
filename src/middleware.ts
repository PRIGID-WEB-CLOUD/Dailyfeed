
import { type NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // The new Firebase JS SDK (v9+) is client-side and manages session state automatically.
  // A server-side middleware for session refreshing is no longer the standard approach.
  // We can rely on the onAuthStateChanged listener in our hooks to manage auth state.
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
