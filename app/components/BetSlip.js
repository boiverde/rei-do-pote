"use client";
import { useState, useEffect } from 'react';
import styles from './BetSlip.module.css';
import { useBetSlip } from '../context/BetSlipContext';
import { createClient } from '../utils/supabase/client';
import { toast } from 'sonner';

export default function BetSlip() {
    const supabase = createClient();
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

    // Auto-switch to Slip when a bet is added
    useEffect(() => {
        if (bets.length > 0) {
            setActiveTab('slip');
        }
    }, [bets.length]);

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
            if (isNaN(amount) || amount <= 0) return sum;

            // Parimutuel Simulation
            // We simulate: What if this bet is added to the pool RIGHT NOW?
            const currentHomePool = parseFloat(bet.homePool || 0);
            const currentAwayPool = parseFloat(bet.awayPool || 0);

            let winningSidePool, totalPool;

            if (bet.option === 'home') {
                winningSidePool = currentHomePool + amount;
                totalPool = currentHomePool + currentAwayPool + amount;
            } else {
                winningSidePool = currentAwayPool + amount;
                totalPool = currentHomePool + currentAwayPool + amount;
            }

            // Fee: 10%
            const netPool = totalPool * 0.90;

            // My Share = My Bet / Total Winning Side Pool
            const myShare = amount / winningSidePool;

            // Return = Net Pool * My Share
            const estimatedReturn = netPool * myShare;

            return sum + estimatedReturn;
        }, 0);
    };

    const handlePlaceBets = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("Você precisa entrar para dar palpites!");
                setLoading(false);
                return;
            }

            const totalStake = getTotalStake();
            if (totalStake <= 0) {
                toast.error("Insira um valor para o palpite.");
                setLoading(false);
                return;
            }

            // Process each bet
            for (const bet of bets) {
                const amount = parseFloat(amounts[bet.id] || 0);
                if (amount <= 0) continue;

                if (amount < 1) { // Minimum 1 real
                    toast.error(`Valor mínimo de investimento: 👑 1,00`);
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

            toast.success("Palpite realizado com sucesso!");
            clearSlip();
            setAmounts({});
            setActiveTab('my-bets'); // Auto-switch to My Bets
            fetchMyBets(); // Refresh list

        } catch (error) {
            console.error(error);
            toast.error("Erro ao realizar palpite: " + error.message);
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
                    Meus Palpites
                </button>
            </div>

            {activeTab === 'slip' ? (
                <>
                    {bets.length === 0 ? (
                        <div className={styles.content}>
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>🎫</div>
                                <p className={styles.emptyText}>Seu cupom está vazio</p>
                                <p className={styles.emptySubtext}>Clique nas odds para adicionar um palpite.</p>
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
                                        <div className={styles.betOdds}>Cota: {bet.price.toFixed(2)}</div>

                                        <div className={styles.stakeInputContainer}>
                                            <span className={styles.currencyPrefix}>👑</span>
                                            <input
                                                type="number"
                                                className={styles.stakeInput}
                                                placeholder="Qtd."
                                                value={amounts[bet.id] || ''}
                                                onChange={(e) => handleAmountChange(bet.id, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.footer}>
                                <div className={styles.summaryRow}>
                                    <span>Total (Coroas)</span>
                                    <span>👑 {getTotalStake().toFixed(2)}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Prêmio Estimado*</span>
                                    <span className={styles.potentialWin}>👑 {getPotentialReturn().toFixed(2)}</span>
                                </div>
                                <div className={styles.feeDisclaimer}>
                                    *Deduzida taxa de serviço de 10%. Valor final depende do fechamento do pool.
                                </div>
                                <button
                                    className={styles.submitBtn}
                                    onClick={handlePlaceBets}
                                    disabled={loading}
                                >
                                    {loading ? 'Processando...' : 'Confirmar Palpites'}
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
                            <p className={styles.emptyText}>Nenhum palpite ativo</p>
                        </div>
                    ) : (
                        myBets.map((pos) => (
                            <div key={pos.id} className={styles.myBetItem}>
                                <div className={styles.myBetHeader}>
                                    <span className={styles.selectionName}>
                                        {pos.outcome === 'home' ? pos.markets?.home_team :
                                            pos.outcome === 'away' ? pos.markets?.away_team :
                                                pos.outcome}
                                    </span>
                                    <span className={styles.sharesBadge}>{pos.shares} palpites</span>
                                </div>
                                <div className={styles.betMatch}>
                                    {pos.markets?.home_team} x {pos.markets?.away_team}
                                </div>
                                <div className={styles.betMeta}>
                                    <span>Alocado: 👑 {(pos.shares * pos.avg_price).toFixed(2)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </aside>
    );
}
