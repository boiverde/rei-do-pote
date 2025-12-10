"use client";
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import styles from './OrderForm.module.css';

export default function OrderForm({ match }) {
    const [selectedSide, setSelectedSide] = useState('home'); // 'home' or 'away'
    const [shares, setShares] = useState(1);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const price = selectedSide === 'home' ? match.homePrice : match.awayPrice;
    const teamName = selectedSide === 'home' ? match.homeTeam : match.awayTeam;

    const cost = shares * price;
    const potentialReturn = shares * 1.00; // Payout is always R$ 1.00 per share
    const profit = potentialReturn - cost;
    const roi = (profit / cost) * 100;

    const handleBuy = async () => {
        setLoading(true);

        // 1. Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert("Você precisa estar logado para negociar!");
            router.push('/login');
            return;
        }

        // 2. Call the Database Function (RPC)
        const { data, error } = await supabase.rpc('purchase_shares', {
            p_market_id: match.id,
            p_outcome: teamName,
            p_shares: shares,
            p_price: price
        });

        if (error) {
            alert(`Erro na compra: ${error.message}`);
            setLoading(false);
            return;
        }

        if (data && data.success) {
            alert(`Compra realizada com sucesso! Novo saldo: R$ ${data.new_balance.toFixed(2)}`);
            router.refresh(); // Refresh page to update data if needed
            router.push('/portfolio'); // Go to portfolio to see position
        } else {
            alert(`Falha na compra: ${data?.message || 'Erro desconhecido'}`);
        }
        setLoading(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.outcomesStub}>
                <button
                    className={`${styles.outcomeTab} ${selectedSide === 'home' ? styles.activeGreen : ''}`}
                    onClick={() => setSelectedSide('home')}
                >
                    <span className={styles.label}>{match.homeTeam}</span>
                    <span className={styles.price}>R$ {match.homePrice.toFixed(2).replace('.', ',')}</span>
                </button>
                <button
                    className={`${styles.outcomeTab} ${selectedSide === 'away' ? styles.activeGreen : ''}`} // Both green for positive selection
                    onClick={() => setSelectedSide('away')}
                >
                    <span className={styles.label}>{match.awayTeam}</span>
                    <span className={styles.price}>R$ {match.awayPrice.toFixed(2).replace('.', ',')}</span>
                </button>
            </div>

            <div className={styles.formContent}>
                <div className={styles.inputGroup}>
                    <label>Quantidade de Cotas</label>
                    <div className={styles.stepper}>
                        <button onClick={() => setShares(Math.max(1, shares - 1))}>-</button>
                        <input
                            type="number"
                            value={shares}
                            onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 0))}
                        />
                        <button onClick={() => setShares(shares + 1)}>+</button>
                    </div>
                </div>

                <div className={styles.summary}>
                    <div className={styles.row}>
                        <span>Preço por cota ({teamName})</span>
                        <span>R$ {price.toFixed(2)}</span>
                    </div>
                    <div className={styles.row}>
                        <span>Custo Total</span>
                        <span>R$ {cost.toFixed(2)}</span>
                    </div>
                    <div className={styles.row}>
                        <span>Retorno Potencial</span>
                        <span className={styles.green}>R$ {potentialReturn.toFixed(2)}</span>
                    </div>
                    <div className={styles.row}>
                        <span>Lucro Estimado</span>
                        <span className={styles.green}>+R$ {profit.toFixed(2)} ({Math.floor(roi)}%)</span>
                    </div>
                </div>

                <button
                    className={styles.submitBtn}
                    onClick={handleBuy}
                    disabled={loading}
                >
                    {loading ? 'Processando...' : `Comprar ${teamName}`}
                </button>
                <p className={styles.disclaimer}>
                    Se {teamName} vencer, você recebe R$ 1,00 por cota.
                </p>
            </div>
        </div>
    );
}
