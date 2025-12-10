"use client";
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import styles from './DepositModal.module.css';

export default function DepositModal({ isOpen, onClose, onSuccess }) {
    const [amount, setAmount] = useState('');
    const [step, setStep] = useState(1); // 1: Input, 2: PIX, 3: Success
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleAmountChange = (e) => {
        // Allow only numbers and valid currency format
        const val = e.target.value.replace(/[^0-9]/g, '');
        setAmount(val);
    };

    const handleGeneratePix = () => {
        if (!amount || parseInt(amount) <= 0) return;
        setStep(2);
    };

    const handleConfirmPayment = async () => {
        setLoading(true);
        // Simulate fake delay for PIX processing
        setTimeout(async () => {
            const { data, error } = await supabase.rpc('deposit_funds', {
                p_amount: parseFloat(amount)
            });

            setLoading(false);

            if (error) {
                alert('Erro ao depositar: ' + error.message);
            } else {
                setStep(3);
                if (onSuccess) onSuccess(); // Refresh parent balance
            }
        }, 1500); // 1.5s delay
    };

    const handleClose = () => {
        setStep(1);
        setAmount('');
        onClose();
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={handleClose}>&times;</button>

                {step === 1 && (
                    <>
                        <h2 className={styles.title}>Depositar via PIX</h2>
                        <div className={styles.inputGroup}>
                            <label>Valor (R$)</label>
                            <input
                                type="text"
                                value={amount}
                                onChange={handleAmountChange}
                                placeholder="0,00"
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.presets}>
                            <button onClick={() => setAmount('20')}>+ R$ 20</button>
                            <button onClick={() => setAmount('50')}>+ R$ 50</button>
                            <button onClick={() => setAmount('100')}>+ R$ 100</button>
                        </div>
                        <button
                            className={styles.primaryBtn}
                            onClick={handleGeneratePix}
                            disabled={!amount}
                        >
                            Gerar PIX
                        </button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <h2 className={styles.title}>Pagamento PIX</h2>
                        <div className={styles.qrCodePlaceholder}>
                            <div className={styles.qrCodeBlock}></div>
                            <p>Escaneie o QR Code Fake</p>
                        </div>
                        <div className={styles.copyPaste}>
                            <span>00020126580014BR.GOV.BCB.PIX...</span>
                            <button>Copiar</button>
                        </div>
                        <button
                            className={styles.primaryBtn}
                            onClick={handleConfirmPayment}
                            disabled={loading}
                        >
                            {loading ? 'Confirmando...' : 'Simular Pagamento Realizado'}
                        </button>
                    </>
                )}

                {step === 3 && (
                    <div className={styles.successState}>
                        <div className={styles.checkIcon}>✅</div>
                        <h2 className={styles.title}>Depósito Confirmado!</h2>
                        <p>R$ {amount},00 foram adicionados.</p>
                        <button className={styles.primaryBtn} onClick={handleClose}>
                            Concluir
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
