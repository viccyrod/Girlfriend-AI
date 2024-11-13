import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    
    // Add authentication check for chat routes
    if (pathname.startsWith('/chat')) {
      // Kinde's withAuth will handle the authentication check
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    // Configure your authentication options
    callbacks: {
      authorized: async ({ token }: { token: any }) => {
        return !!token; // Return true if token exists
      },
    },
  }
);

// Update matcher to include chat routes
export const config = {
  matcher: [
    '/chat/:path*',
    '/dashboard/:path*',
    // Add other protected routes here
  ],
};