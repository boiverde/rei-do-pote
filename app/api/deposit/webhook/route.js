import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const payment = new Payment(client);

// Use Service Role Key for Webhook as it operates backend-side without user session
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Ideally Service Role, but RLS 'confirm_deposit' is security definer so it works if function is public or we auth properly. 
    // ACTUALLY: RPC check, if security definer, anon key is fine IF the RPC is accessible.
    // But updating tables directly would fail. The RPC handles it.
);

export async function POST(request) {
    try {
        const url = new URL(request.url);
        const searchParams = url.searchParams;
        const topic = searchParams.get('topic') || searchParams.get('type');
        const id = searchParams.get('id') || searchParams.get('data.id');

        // MP sends notifications in different formats, sometimes body has type/data
        let paymentId = id;
        if (!paymentId) {
            const body = await request.json().catch(() => ({}));
            if (body.type === 'payment') {
                paymentId = body.data.id;
            }
        }

        if (!paymentId) {
            return NextResponse.json({ ok: true }); // Acknowledge even if irrelevant event
        }

        // Verify status with MP
        const paymentData = await payment.get({ id: paymentId });
        const status = paymentData.status;
        // approved, pending, authorized, in_process, in_mediation, rejected, cancelled, refunded, charged_back

        if (status) {
            // Call RPC
            const { data, error } = await supabase.rpc('confirm_deposit', {
                p_payment_id: paymentId.toString(),
                p_status: status
            });

            if (error) {
                console.error('RPC Error:', error);
                return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
            }
        }

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('Webhook Error:', error);
        // Return 200 to MP to avoid retries if it's a verify error vs server error
        return NextResponse.json({ error: error.message }, { status: 200 });
    }
}
