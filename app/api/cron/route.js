import { NextResponse } from 'next/server';

export async function GET(request) {
    // Basic security: In production, verify auth header from Vercel
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

    console.log('[CRON] Starting daily jobs...');

    try {
        // Determine the base URL
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('host');
        const baseUrl = `${protocol}://${host}`;

        const report = {
            sync: null,
            resolve: null
        };

        // 1. Run Market Sync (Future Games)
        console.log('[CRON] running sync-markets...');
        const syncRes = await fetch(`${baseUrl}/api/sync-markets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        report.sync = await syncRes.json();

        // 2. Run Market Resolution (Past Games)
        console.log('[CRON] running resolve-markets...');
        const resolveRes = await fetch(`${baseUrl}/api/resolve-markets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        report.resolve = await resolveRes.json();

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            report: report
        });

    } catch (error) {
        console.error('[CRON] Global Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
