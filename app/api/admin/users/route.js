import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(users);
    } catch (error) {
        console.error('Admin Users Fetch Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
