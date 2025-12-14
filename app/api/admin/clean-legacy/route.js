import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
    try {
        // 1. Get IDs of legacy markets (no logo)
        message: `Cleaned ${ids.length} legacy markets.`
    });

} catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
}
}
