import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function middleware(request: NextRequest) {
  const { isAuthenticated } = getKindeServerSession();
  const authStatus = await isAuthenticated();

  // Allow access to the home page and API routes without authentication
  if (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  if (!authStatus) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
