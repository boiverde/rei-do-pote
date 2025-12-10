import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        const supabaseUrl = 'https://qqupjuyebqaajpvhhwpk.supabase.co'
        const supabaseAnonKey = 'sb_publishable_S-b2b-pAyD4wwtexHVGeOQ_qTTyuZcE'
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        await supabase.auth.exchangeCodeForSession(code)
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(requestUrl.origin)
}
