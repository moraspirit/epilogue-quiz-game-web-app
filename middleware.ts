import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/jwt'; // Adjust path if your middleware is elsewhere

export async function middleware(request: NextRequest) {
  // 1. Grab the cookie
  const token = request.cookies.get('admin_session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // 2. Use your existing verifyToken utility
    const payload = await verifyToken(token);
    
    // 3. (Optional) Check if the token specifically belongs to an admin
    if (payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // Token is invalid or expired
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};