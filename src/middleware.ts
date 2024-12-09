import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function middleware(request: NextRequest) {
  // Add required headers
  const response = NextResponse.next()
  response.headers.set('x-middleware-cache', 'no-cache')

  // Protected routes that require authentication
  const path = request.nextUrl.pathname;
  const isProtectedRoute = path === '/my-models' || 
                          path.startsWith('/my-models/') || 
                          path === '/chat' || 
                          path.startsWith('/chat/');

  if (isProtectedRoute) {
    const { isAuthenticated } = getKindeServerSession();
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.redirect(new URL('/api/auth/login', request.url));
    }
  }

  return response
}

export const config = {
  matcher: [
    '/my-models',
    '/my-models/:path*',
    '/chat',
    '/chat/:path*',
    '/api/:path*',
  ],
}