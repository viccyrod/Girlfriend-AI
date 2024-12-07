import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Add any required headers
  const response = NextResponse.next()
  response.headers.set('x-middleware-cache', 'no-cache')
  return response
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
  ],
}