import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request) {
    try {
        // 1. Check Auth Token
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 2. Verify User
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
        }

        // 3. Admin Authorization Check
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        // If not admin, block.
        if (profileError || !profile || !profile.is_admin) {
            return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
        }

        // 4. Fetch Data
        const { data: users, error } = await supabase
            .from('profiles')
            .select('*');
        // .order('created_at', { ascending: false }); // Column missing in profiles

        if (error) throw error;

        return NextResponse.json(users);
    } catch (error) {
        console.error('Admin Users Fetch Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
