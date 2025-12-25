"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '../utils/supabase/client';
import styles from './page.module.css';
import { toast } from 'sonner';

export default function DepositPage() {
    const supabase = createClient();
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [paymentData, setPaymentData] = useState(null);
    const [user, setUser] = useState(null);

    const [hasCpf, setHasCpf] = useState(true); // Default true to avoid flash, validated in effect

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('cpf')
                    .eq('id', user.id)
                    .single();

                if (!profile?.cpf) {
                    setHasCpf(false);
                }
            }
        };
        getUser();
    }, []);

    const handleDeposit = async () => {
        if (!user) {
            toast.error("Você precisa estar logado.");
            return;
        }
        if (!hasCpf) {
            toast.error("Você precisa verificar seu CPF no perfil.");
            return;
        }
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            toast.error("Digite um valor válido.");
            return;
        }

        setLoading(true);
        setPaymentData(null);

        try {
            const response = await fetch('/api/deposit/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Number(amount),
                    user_id: user.id,
                    email: user.email,
                    description: `Depósito ${amount}`
                })
            });

            const data = await response.json();

            if (data.error) throw new Error(data.details || data.error);

            setPaymentData(data);
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Erro ao criar pagamento. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const copyPix = () => {
        if (paymentData?.qr_code) {
            navigator.clipboard.writeText(paymentData.qr_code);
            toast.success("Código PIX copiado!");
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Loja de Coroas</h1>

            <div className={styles.storeHeader}>
                <span className={styles.storeRate}>1 Coroa = R$ 1,00</span>
                <p className={styles.storeSubtitle}>Adquira Coroas para dar seus palpites.</p>
            </div>

            {!hasCpf ? (
                <div className={styles.warningContainer}>
                    <p className={styles.warningText}>
                        ⚠️ Para sua segurança, é necessário verificar seu CPF antes de fazer um depósito.
                    </p>
                    <a href="/profile" className={styles.profileLink}>
                        Ir para Meu Perfil e Verificar CPF →
                    </a>
                </div>
            ) : !paymentData ? (
                <>
                    <h2 className={styles.sectionTitle}>Escolha um Pacote</h2>
                    <div className={styles.amountGrid}>
                        {[10, 20, 50, 100].map((val) => (
                            <button
                                key={val}
                                className={`${styles.amountButton} ${amount == val ? styles.selected : ''}`}
                                onClick={() => setAmount(val)}
                            >
                                <span className={styles.crownIcon}>👑</span> {val}
                                <span className={styles.priceTag}>R$ {val},00</span>
                            </button>
                        ))}
                    </div>

                    <div className={styles.customAmountContainer}>
                        <label>Outra quantidade:</label>
                        <input
                            type="number"
                            placeholder="Qtd. de Coroas"
                            className={styles.customInput}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        {amount > 0 && <span className={styles.conversionPreview}> = R$ {amount},00</span>}
                    </div>

                    <button
                        className={styles.payButton}
                        onClick={handleDeposit}
                        disabled={loading || !amount}
                    >
                        {loading ? 'Gerando Pagamento...' : `Comprar ${amount || 0} Coroas`}
                    </button>
                </>
            ) : (
                <div className={styles.qrContainer}>
                    <p className={styles.qrInstruction}>Escaneie o QR Code para finalizar sua compra</p>

                    <div className={styles.qrWrapper}>
                        <Image
                            src={`data:image/png;base64,${paymentData.qr_code_base64}`}
                            alt="PIX QR Code"
                            width={256}
                            height={256}
                            className={styles.qrImage}
                        />
                    </div>

                    <div className={styles.separator}></div>

                    <button className={styles.copyButton} onClick={copyPix}>
                        <span>📋</span> Copiar Código PIX
                    </button>

                    <p className={styles.footerNote}>
                        Suas Coroas serão creditadas automaticamente após o pagamento.
                    </p>

                    <button
                        className={styles.backButton}
                        onClick={() => setPaymentData(null)}
                    >
                        ← Voltar para a Loja
                    </button>
                </div>
            )}
        </div>
    );
}
