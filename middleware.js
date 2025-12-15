import { NextResponse } from 'next/server';

export async function middleware(request) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const path = request.nextUrl.pathname;

    // 1. RATE LIMITING (Critical Routes Only)
    // In production, use Upstash Redis or Vercel KV for distributed state.
    // For this prototype, we'll skip complex implementation but leave the structure.
    // Vercel Edge Middleware doesn't share state between executions easily without a database.

    // Simple Header Check for Bots
    const userAgent = request.headers.get('user-agent') || '';
    if (userAgent.includes('curl') || userAgent.includes('python-requests')) {
        return new NextResponse(JSON.stringify({ success: false, message: 'Bot detected.' }), { status: 403 });
    }

    // 2. SECURITY HEADERS
    const response = NextResponse.next();

    // HSTS (Force HTTPS)
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

    // Anti-Clickjacking
    response.headers.set('X-Frame-Options', 'DENY');

    // Anti-Sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // Referrer Policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
}

export const config = {
    matcher: ['/api/:path*', '/login', '/signup', '/deposit', '/withdraw'],
};
