
"use client";
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/app/lib/supabase';
import styles from './page.module.css';

export default function WithdrawPage() {
    const [amount, setAmount] = useState('');
    const [pixKeyType, setPixKeyType] = useState('cpf');
    const [pixKey, setPixKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [balance, setBalance] = useState(0);
    const [user, setUser] = useState(null);

    const supabase = createBrowserClient();

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
            .select('balance')
            .eq('id', userId)
            .single();

        if (data) setBalance(data.balance);
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
            <h1 className={styles.title}>Sacar Ganhos</h1>

            <div className={styles.balanceCard}>
                <div className={styles.balanceLabel}>Saldo Disponível</div>
                <div className={styles.balanceValue}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
                </div>
            </div>

            <div className={styles.formCard}>
                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.success}>{success}</div>}

                <form onSubmit={handleWithdraw}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Valor do Saque (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            className={styles.input}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0,00"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Tipo de Chave Pix</label>
                        <select
                            className={styles.select}
                            value={pixKeyType}
                            onChange={(e) => setPixKeyType(e.target.value)}
                        >
                            <option value="cpf">CPF</option>
                            <option value="email">E-mail</option>
                            <option value="phone">Telefone</option>
                            <option value="random">Chave Aleatória</option>
                        </select>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Chave Pix</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={pixKey}
                            onChange={(e) => setPixKey(e.target.value)}
                            placeholder="Digite sua chave Pix"
                            required
                        />
                    </div>

                    <button type="submit" className={styles.button} disabled={loading || balance <= 0}>
                        {loading ? 'Processando...' : 'Confirmar Saque'}
                    </button>

                    <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.8rem', textAlign: 'center' }}>
                        Taxa de saque: R$ 0,00. Prazo: até 24h úteis.
                    </p>
                </form>
            </div>
        </div>
    );
}
