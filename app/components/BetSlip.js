"use client";
import { useState, useEffect } from 'react';
import styles from './BetSlip.module.css';
import { useBetSlip } from '../context/BetSlipContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function BetSlip() {
    const { bets, removeBet, clearSlip } = useBetSlip();
    const [amounts, setAmounts] = useState({});
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('slip'); // 'slip' or 'my-bets'
    const [myBets, setMyBets] = useState([]);

    // Fetch user positions (My Bets)
    const fetchMyBets = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
            .from('positions')
            .select(`
                *,
                markets (
                    home_team,
                    away_team,
                    event_date,
                    status
                )
            `)
            .eq('user_id', session.user.id)
            .gt('shares', 0)
            .order('id', { ascending: false }); // Sort by newest

        if (!error && data) {
            setMyBets(data);
        }
    };

    // Load bets on mount and when tab switches
    useEffect(() => {
        if (activeTab === 'my-bets') {
            fetchMyBets();
        }
    }, [activeTab]);

    const handleAmountChange = (id, value) => {
        setAmounts(prev => ({ ...prev, [id]: value }));
    };

    const getTotalStake = () => {
        return bets.reduce((sum, bet) => {
            const amount = parseFloat(amounts[bet.id] || 0);
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
    };

    const getPotentialReturn = () => {
        return bets.reduce((sum, bet) => {
            const amount = parseFloat(amounts[bet.id] || 0);
            if (isNaN(amount)) return sum;
            return sum + (amount * bet.odds);
        }, 0);
    };

    const handlePlaceBets = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("Você precisa entrar para apostar!");
                setLoading(false);
                return;
            }

            const totalStake = getTotalStake();
            if (totalStake <= 0) {
                toast.error("Insira um valor para apostar.");
                setLoading(false);
                return;
            }

            // Process each bet
            for (const bet of bets) {
                const amount = parseFloat(amounts[bet.id] || 0);
                if (amount <= 0) continue;

                if (amount < 1) { // Minimum 1 real
                    toast.error(`Valor mínimo de investimento: R$ 1,00`);
                    continue;
                }

                // Call the new Fantasy Order RPC
                const { data, error } = await supabase.rpc('place_fantasy_order', {
                    p_market_id: bet.id,
                    p_outcome: bet.option, // 'home' or 'away' (check bet.option/selectionName mapping)
                    p_amount: amount
                });

                if (error) throw error;
                if (data && !data.success) throw new Error(data.message);
            }

            toast.success("Aposta realizada com sucesso!");
            clearSlip();
            setAmounts({});
            setActiveTab('my-bets'); // Auto-switch to My Bets
            fetchMyBets(); // Refresh list

        } catch (error) {
            console.error(error);
            toast.error("Erro ao realizar aposta: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <aside className={styles.betslip}>
            {/* Tabs Header */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'slip' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('slip')}
                >
                    Cupom <span className={styles.tabBadge}>{bets.length}</span>
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'my-bets' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('my-bets')}
                >
                    Minhas Apostas
                </button>
            </div>

            {activeTab === 'slip' ? (
                <>
                    {bets.length === 0 ? (
                        <div className={styles.content}>
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>🎫</div>
                                <p className={styles.emptyText}>Seu cupom está vazio</p>
                                <p className={styles.emptySubtext}>Clique nas odds para adicionar uma aposta.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className={styles.content}>
                                {bets.map((bet) => (
                                    <div key={`${bet.id}-${bet.option}`} className={styles.betItem}>
                                        <div className={styles.betHeader}>
                                            <span className={styles.selectionName}>{bet.selectionName}</span>
                                            <button
                                                onClick={() => removeBet(bet.id, bet.option)}
                                                className={styles.removeBtn}
                                            >✕</button>
                                        </div>
                                        <div className={styles.betMatch}>{bet.matchStr}</div>
                                        <div className={styles.betOdds}>Retorno Estimado: {bet.odds.toFixed(2)}x</div>

                                        <div className={styles.stakeInputContainer}>
                                            <span className={styles.currencyPrefix}>R$</span>
                                            <input
                                                type="number"
                                                className={styles.stakeInput}
                                                placeholder="Valor"
                                                value={amounts[bet.id] || ''}
                                                onChange={(e) => handleAmountChange(bet.id, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.footer}>
                                <div className={styles.summaryRow}>
                                    <span>Total de Apostas</span>
                                    <span>R$ {getTotalStake().toFixed(2)}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Retorno Potencial*</span>
                                    <span className={styles.potentialWin}>R$ {getPotentialReturn().toFixed(2)}</span>
                                </div>
                                <div className={styles.feeDisclaimer}>
                                    *Deduzida taxa de serviço de 10%. Valor final depende do fechamento do pool.
                                </div>
                                <button
                                    className={styles.submitBtn}
                                    onClick={handlePlaceBets}
                                    disabled={loading}
                                >
                                    {loading ? 'Processando...' : 'Fazer Aposta'}
                                </button>
                            </div>
                        </>
                    )}
                </>
            ) : (
                /* My Bets Tab Content */
                <div className={styles.content}>
                    {myBets.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p className={styles.emptyText}>Nenhuma aposta ativa</p>
                        </div>
                    ) : (
                        myBets.map((pos) => (
                            <div key={pos.id} className={styles.myBetItem}>
                                <div className={styles.myBetHeader}>
                                    <span className={styles.selectionName}>{pos.outcome}</span>
                                    <span className={styles.sharesBadge}>{pos.shares} cotas</span>
                                </div>
                                <div className={styles.betMatch}>
                                    {pos.markets?.home_team} x {pos.markets?.away_team}
                                </div>
                                <div className={styles.betMeta}>
                                    <span>Investido: R$ {(pos.shares * pos.avg_price).toFixed(2)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </aside>
    );
}
