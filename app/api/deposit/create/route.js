import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const payment = new Payment(client);

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
    try {
        const { amount, user_id, email, description } = await request.json();

        if (!amount || !user_id || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const uniqueRef = `DEPOSIT-${user_id}-${Date.now()}`;

        const paymentData = {
            transaction_amount: Number(amount),
            description: description || 'Depósito BolaObr',
            payment_method_id: 'pix',
            payer: {
                email: email,
            },
            external_reference: uniqueRef,
            notification_url: `${request.headers.get('origin')}/api/deposit/webhook` // Or your public URL
        };

        const response = await payment.create({ body: paymentData });
        const { id, point_of_interaction } = response;

        // Save initial transaction state to Supabase
        const { error: dbError } = await supabase
            .from('transactions')
            .insert({
                user_id: user_id,
                amount: amount,
                type: 'deposit',
                status: 'pending',
                payment_id: id.toString(),
                external_reference: uniqueRef,
                description: description || 'Depósito via PIX',
                metadata: response
            });

        if (dbError) {
            console.error('Supabase Error:', dbError);
            // We might want to cancel the payment here if DB fails, but for now just returning error
            return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 });
        }

        return NextResponse.json({
            payment_id: id,
            qr_code: point_of_interaction.transaction_data.qr_code,
            qr_code_base64: point_of_interaction.transaction_data.qr_code_base64,
            ticket_url: point_of_interaction.transaction_data.ticket_url
        });

    } catch (error) {
        console.error('Mercado Pago Error:', error);
        return NextResponse.json({ error: 'Payment creation failed', details: error.message }, { status: 500 });
    }
}
