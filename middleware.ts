
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    if (
      req.nextUrl.pathname.startsWith("/dashboard/admin") &&
      req.nextauth.token?.role !== "ADMIN"
    ) {
      return NextResponse.rewrite(new URL("/auth/login?message=You Are Not Authorized!", req.url));
    }
    // Protect aliado dashboard for ALIADO role
    if (
      req.nextUrl.pathname.startsWith("/dashboard/aliado") &&
      req.nextauth.token?.role !== "ALIADO"
    ) {
      return NextResponse.rewrite(new URL("/auth/login?message=You Are Not Authorized!", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = { matcher: ["/dashboard/admin/:path*", "/checkout/:path*", "/dashboard/cliente/:path*", "/dashboard/aliado/:path*"] };
