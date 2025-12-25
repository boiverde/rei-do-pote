import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '../../../utils/supabase/server';

const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const payment = new Payment(mpClient);

export async function POST(request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('Auth Error:', authError);
            return NextResponse.json({ error: 'Unauthorized', details: 'Você precisa estar logado para depositar.' }, { status: 401 });
        }

        console.log('User ID for Deposit:', user.id);

        // Verify if user has CPF in profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('cpf')
            .eq('id', user.id)
            .single();

        console.log('Profile Fetch Result:', { profile, profileError });
        console.log('CPF Value:', profile?.cpf);

        if (!profile?.cpf) {
            console.log('Blocking deposit due to missing CPF');
            return NextResponse.json({
                error: 'CPF Required',
                details: 'É necessário verificar seu CPF no perfil antes de fazer um depósito.'
            }, { status: 400 });
        }

        const { amount, description } = await request.json();

        if (!amount) {
            return NextResponse.json({ error: 'Missing amount' }, { status: 400 });
        }

        const uniqueRef = `DEPOSIT-${user.id}-${Date.now()}`;

        const paymentData = {
            transaction_amount: Number(amount),
            description: description || 'Depósito BolaObr',
            payment_method_id: 'pix',
            payer: {
                email: user.email,
                first_name: user.user_metadata?.full_name?.split(' ')[0] || 'User',
            },
            external_reference: uniqueRef,
            notification_url: `${request.headers.get('origin')}/api/deposit/webhook`
        };

        let response;
        try {
            response = await payment.create({ body: paymentData });
        } catch (mpError) {
            console.error('Mercado Pago Error:', mpError);
            return NextResponse.json({
                error: 'Payment Gateway Error',
                details: mpError.message || 'Erro no processamento do pagamento.'
            }, { status: 502 });
        }

        const { id, point_of_interaction } = response;

        // Save initial transaction state to Supabase
        const { error: dbError } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
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
            // We do NOT return 500 here because the payment was already created at MP.
            // We just log it. The webhook will eventually reconcile or the user can contact support.
            // But for the user experience, we return the QR code.
        }

        return NextResponse.json({
            payment_id: id,
            qr_code: point_of_interaction.transaction_data.qr_code,
            qr_code_base64: point_of_interaction.transaction_data.qr_code_base64,
            ticket_url: point_of_interaction.transaction_data.ticket_url
        });

    } catch (error) {
        console.error('Unexpected Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
