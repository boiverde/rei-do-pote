
import { NextResponse } from 'next/server';
import { createClient } from '../../utils/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // Fetch all profiles
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, username, full_name, cpf, balance');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ profiles });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
