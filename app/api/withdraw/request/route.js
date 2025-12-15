
import { createClient } from '@/app/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { amount, pix_key_type, pix_key } = body;

        // 1. Fetch Profile to verify CPF ownership
        const { data: profile } = await supabase
            .from('profiles')
            .select('balance, cpf')
            .eq('id', user.id)
            .single();

        if (!profile || !profile.cpf) {
            return NextResponse.json({ error: 'Você precisa cadastrar seu CPF no perfil antes de sacar.' }, { status: 400 });
        }

        // 2. Security Check: Key MUST match CPF
        // Allow simple cleaning (remove . and -) for comparison if needed, but for now exact match is safer / stricter.
        // Assuming frontend sends cleaned or raw, lets enforce strict equality or simple clean.
        // Let's Clean both just in case.
        const cleanKey = pix_key.replace(/\D/g, '');
        const cleanCpf = profile.cpf.replace(/\D/g, '');

        if (cleanKey !== cleanCpf) {
            return NextResponse.json({ error: 'A Chave PIX deve ser o seu CPF cadastrado. (Titularidade Obrigatória)' }, { status: 403 });
        }

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }
        if (!pix_key || !pix_key_type) {
            return NextResponse.json({ error: 'Pix Key is required' }, { status: 400 });
        }

        const { data, error } = await supabase.rpc('request_withdrawal', {
            p_amount: amount,
            p_metadata: {
                pix_key_type,
                pix_key
            }
        });

        if (error) {
            console.error('RPC Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data.success) {
            return NextResponse.json({ error: data.error }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            new_balance: data.new_balance
        });

    } catch (error) {
        console.error('Withdraw API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
