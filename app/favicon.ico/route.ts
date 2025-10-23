import { NextResponse } from 'next/server';

export const runtime = 'edge';

export function GET(request: Request) {
  // Redirect browsers requesting /favicon.ico to the Next.js /icon route
  return NextResponse.redirect(new URL('/icon', request.url), 308);
}

