
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import styles from './page.module.css';

export default function WithdrawPage() {
    const [amount, setAmount] = useState('');
    const [pixKeyType, setPixKeyType] = useState('cpf');
    const [pixKey, setPixKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [balance, setBalance] = useState(0);
    const [userCpf, setUserCpf] = useState(null); // State for stored CPF
    const [cpfInput, setCpfInput] = useState(''); // State for new CPF input
    const [user, setUser] = useState(null);



    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUser(user);
            fetchBalance(user.id);
        }
    };

    const fetchBalance = async (userId) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('balance, cpf')
            .eq('id', userId)
            .single();

        if (data) {
            setBalance(data.balance);
            if (data.cpf) {
                setUserCpf(data.cpf);
                setPixKey(data.cpf); // Pre-fill
            }
        }
    };

    const handleSaveCpf = async () => {
        if (!cpfInput || cpfInput.length < 11) {
            setError("Digite um CPF válido.");
            return;
        }
        setLoading(true);
        const { error } = await supabase
            .from('profiles')
            .update({ cpf: cpfInput })
            .eq('id', user.id);

        setLoading(false);

        if (error) {
            setError("Erro ao salvar CPF: " + error.message);
        } else {
            setUserCpf(cpfInput);
            setPixKey(cpfInput);
            setSuccess("CPF cadastrado com sucesso! Agora você pode sacar.");
        }
    };

    const handleWithdraw = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const numAmount = parseFloat(amount.replace(',', '.'));

            if (isNaN(numAmount) || numAmount <= 0) {
                throw new Error('Valor inválido');
            }
            if (numAmount > balance) {
                throw new Error('Saldo insuficiente');
            }

            const res = await fetch('/api/withdraw/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: numAmount,
                    pix_key_type: pixKeyType,
                    pix_key: pixKey
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao solicitar saque');
            }

            setSuccess('Solicitação de saque realizada com sucesso! O valor será creditado em breve.');
            setBalance(data.new_balance);
            setAmount('');
            setPixKey('');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Trocar Coroas</h1>

            <div className={styles.balanceCard}>
                <div className={styles.balanceLabel}>Seus Tesouros Disponíveis</div>
                <div className={styles.balanceValue}>
                    👑 {balance ? balance.toFixed(0) : '0'}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>
                    = R$ {balance ? balance.toFixed(2) : '0,00'}
                </div>
            </div>

            <div className={styles.formCard}>
                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.success}>{success}</div>}

                {!userCpf ? (
                    // State 1: User needs to register CPF
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ marginBottom: '10px' }}>Para sua segurança, os saques são permitidos apenas para a <strong>conta do titular (CPF)</strong>.</p>
                        <p style={{ marginBottom: '20px', fontSize: '0.9rem', color: '#666' }}>Cadastre seu CPF abaixo. Uma vez salvo, ele será usado para todos os saques.</p>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Seu CPF</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={cpfInput}
                                onChange={(e) => setCpfInput(e.target.value)}
                                placeholder="000.000.000-00"
                            />
                        </div>
                        <button onClick={handleSaveCpf} className={styles.button} disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar CPF e Continuar'}
                        </button>
                    </div>
                ) : (
                    // State 2: Withdrawal Form (Locked to CPF)
                    <form onSubmit={handleWithdraw}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Quero trocar (Coroas) 👑</label>
                            <input
                                type="number"
                                step="1"
                                className={styles.input}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                required
                            />
                            {amount > 0 && (
                                <div className={styles.conversionPreview}>
                                    Você recebe: <strong>R$ {amount},00</strong>
                                </div>
                            )}
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Chave Pix (CPF Vinculado)</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={userCpf}
                                disabled
                                style={{ backgroundColor: '#e9ecef', color: '#666', cursor: 'not-allowed' }}
                            />
                            <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                                🔒 Transferimos apenas para sua chave CPF por segurança.
                            </small>
                        </div>

                        <button type="submit" className={styles.button} disabled={loading || balance <= 0 || !amount}>
                            {loading ? 'Processando Troca...' : 'Confirmar Troca'}
                        </button>

                        <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.8rem', textAlign: 'center' }}>
                            Taxa de câmbio: 1:1. Prazo: até 24h úteis.
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
