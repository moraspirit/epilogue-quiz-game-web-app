import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt'; 

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;

  // If no token, kick them to the secret admin login page
  if (!token) {
    return NextResponse.redirect(new URL('/admin-login', request.url));
  }

  try {
    const payload = await verifyToken(token);
    
    if (payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/admin-login', request.url));
  }
}

// Protect the dashboard
export const config = {
  matcher: ['/admin', '/admin/:path*'],
};