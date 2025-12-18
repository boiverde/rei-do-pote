
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        // 1. Get current user from session (Standard Auth)
        const supabase = await createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Initialize Service Role Client (To bypass RLS)
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            return NextResponse.json({ error: 'Server configuration error: Missing Service Role Key' }, { status: 500 });
        }

        const adminSb = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // 3. Update User Profile
        const { error: updateError } = await adminSb
            .from('profiles')
            .update({ is_admin: true })
            .eq('id', user.id);

        if (updateError) {
            console.error('Error promoting user:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'User promoted to Admin successfully' });

    } catch (err) {
        console.error('Unexpected error in dev-promote:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
