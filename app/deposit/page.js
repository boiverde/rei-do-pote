"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import styles from './page.module.css';
import { toast } from 'sonner';

export default function DepositPage() {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [paymentData, setPaymentData] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

    const handleDeposit = async () => {
        if (!user) {
            toast.error("Você precisa estar logado.");
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
            <h1 className={styles.title}>Depositar via PIX</h1>

            {!paymentData ? (
                <>
                    <div className={styles.amountGrid}>
                        {[10, 20, 50, 100].map((val) => (
                            <button
                                key={val}
                                className={`${styles.amountButton} ${amount == val ? styles.selected : ''}`}
                                onClick={() => setAmount(val)}
                            >
                                R$ {val}
                            </button>
                        ))}
                    </div>

                    <input
                        type="number"
                        placeholder="Outro valor (R$)"
                        className={styles.customInput}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />

                    <button
                        className={styles.payButton}
                        onClick={handleDeposit}
                        disabled={loading || !amount}
                    >
                        {loading ? 'Gerando PIX...' : 'Gerar PIX'}
                    </button>
                </>
            ) : (
                <div className={styles.qrContainer}>
                    <p className={styles.qrInstruction}>Escaneie o QR Code no app do seu banco</p>

                    <div className={styles.qrWrapper}>
                        <img
                            src={`data:image/png;base64,${paymentData.qr_code_base64}`}
                            alt="PIX QR Code"
                            className={styles.qrImage}
                        />
                    </div>

                    <div className={styles.separator}></div>

                    <button className={styles.copyButton} onClick={copyPix}>
                        <span>📋</span> Copiar Código PIX
                    </button>

                    <p className={styles.footerNote}>
                        Após o pagamento, seu saldo será atualizado automaticamente em instantes.
                    </p>

                    <button
                        className={styles.backButton}
                        onClick={() => setPaymentData(null)}
                    >
                        ← Voltar / Novo Depósito
                    </button>
                </div>
            )}
        </div>
    );
}
