"use client";
import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
import Link from 'next/link';
import styles from './page.module.css';
import dynamic from 'next/dynamic';
import { formatCurrency } from '@/utils/format';

import Skeleton from '../components/Skeleton';

const PortfolioChart = dynamic(() => import('../components/PortfolioChart'), { ssr: false });

export default function Portfolio() {
    const supabase = createClient();
    const [positions, setPositions] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    // Mock History Data (Keep for visual until we have real history table)
    const [historyData, setHistoryData] = useState([]);

    // Mock History Data (Keep for visual until we have real history table)
    const generateBalanceHistory = () => {
        const history = [];
        let currentBalance = 900;
        const today = new Date();
        for (let i = 30; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const change = (Math.random() - 0.4) * 50;
            currentBalance += change;
            history.push({
                date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                balance: parseFloat(currentBalance.toFixed(2))
            });
        }
        return history;
    };

    useEffect(() => {
        setHistoryData(generateBalanceHistory());
    }, []);

    const fetchPortfolio = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setLoading(false);
            // Optionally redirect here if we want to force login
            // window.location.href = '/login'; 
            return;
        }

        // Parallel Fetch: Profile (Balance) & Positions & Transactions
        const [profileResult, positionsResult, transactionsResult] = await Promise.all([
            supabase
                .from('profiles')
                .select('balance')
                .eq('id', session.user.id)
                .single(),
            supabase
                .from('positions')
                .select(`
                    *,
                    markets (
                        home_team,
                        away_team,
                        home_price,
                        away_price
                    )
                `)

                .eq('user_id', session.user.id),
            supabase
                .from('transactions')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(20)
        ]);

        const { data: profile, error: profileError } = profileResult;
        if (profileError) console.error('Error fetching profile:', profileError);

        if (profile) setBalance(profile.balance);

        const { data: positionsData } = positionsResult;

        if (positionsData) {
            const formattedPositions = positionsData.map(pos => {
                const market = pos.markets;
                // Determine current price for the outcome we hold
                const isHome = pos.outcome === market.home_team;
                const currentPrice = isHome ? market.home_price : market.away_price;

                // Calc Return
                const cost = pos.shares * pos.avg_price;
                const currentValue = pos.shares * currentPrice;
                const profit = currentValue - cost;
                const returnStr = `${profit >= 0 ? '+' : ''}${formatCurrency(profit)}`;

                return {
                    id: pos.market_id,
                    market: `${market.home_team} vs ${market.away_team}`,
                    outcome: pos.outcome,
                    shares: pos.shares,
                    avgPrice: pos.avg_price,
                    currentPrice: currentPrice,
                    return: returnStr,
                    isProfit: profit >= 0
                };
            });
            setPositions(formattedPositions);
        }

        const { data: transactionsData } = transactionsResult; // 3rd result from Promise.all
        if (transactionsData) {
            setTransactions(transactionsData);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPortfolio();
    }, []);

    const handleDepositSuccess = () => {
        fetchPortfolio(); // Refresh balance
    };

    if (loading) return (
        <div className={styles.container}>
            <Skeleton width="200px" height="32px" style={{ marginBottom: '20px' }} />
            <div className={styles.balanceCard}>
                <Skeleton width="100px" height="20px" style={{ marginBottom: '10px' }} />
                <Skeleton width="150px" height="40px" style={{ marginBottom: '10px' }} />
                <Skeleton width="100%" height="200px" />
            </div>
        </div>
    );

    const totalInvested = positions.reduce((acc, pos) => acc + (pos.shares * pos.avgPrice), 0);

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Minha Carteira</h1>

            <div className={styles.balanceCard}>
                <div className={styles.balanceHeader}>
                    <span>Meus Tesouros</span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Link href="/withdraw" className={styles.withdrawBtn}>
                            Trocar
                        </Link>
                        <Link href="/deposit" className={styles.depositBtn}>
                            + Loja
                        </Link>
                    </div>
                </div>
                <div className={styles.balanceAmount}>{formatCurrency(balance)}</div>
                <div className={styles.balanceMeta}>Alocado: {formatCurrency(totalInvested)}</div>

                <div className={styles.chartWrapper}>
                    <PortfolioChart data={historyData} />
                </div>
            </div>

            <div className={styles.sectionTitle}>Meus Palpites ({positions.length})</div>

            <div className={styles.list}>
                {positions.length > 0 ? (
                    positions.map((pos) => (
                        <Link href={`/market/${pos.id}`} key={pos.id + pos.outcome} className={styles.positionCard}>
                            <div className={styles.posHeader}>
                                <span className={styles.marketName}>{pos.market}</span>
                                <span className={`${styles.outcomeBadge} ${styles.greenBadge}`}>
                                    {pos.outcome}
                                </span>
                            </div>
                            <div className={styles.posStats}>
                                <div className={styles.stat}>
                                    <span>Qtd. Cotas</span>
                                    <strong>{pos.shares}</strong>
                                </div>
                                <div className={styles.stat}>
                                    <span>Preço Médio</span>
                                    <strong>{pos.avgPrice.toFixed(2)}</strong>
                                </div>
                                <div className={styles.stat}>
                                    <span>Valor Total</span>
                                    <strong>{formatCurrency(pos.shares * pos.currentPrice)}</strong>
                                </div>
                                <div className={styles.stat}>
                                    <span>Retorno</span>
                                    <strong className={pos.isProfit ? styles.green : styles.red}>
                                        {pos.return}
                                    </strong>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className={styles.emptyState}>Você ainda não fez nenhum palpite.</div>
                )}
            </div>

            <div className={styles.sectionTitle}>Histórico de Transações</div>
            <div className={styles.transactionList}>
                {transactions.length > 0 ? (
                    transactions.map((tx) => (
                        <div key={tx.id} className={styles.transactionItem}>
                            <div className={styles.txInfo}>
                                <span className={styles.txType}>{tx.type === 'deposit' ? 'Compra (Loja)' : 'Troca por Reais'}</span>
                                <span className={styles.txDate}>{new Date(tx.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className={`${styles.txAmount} ${tx.type === 'deposit' ? styles.green : styles.red}`}>
                                {tx.type === 'deposit' ? '+' : '-'} {formatCurrency(parseFloat(tx.amount))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={styles.emptyState}>Nenhuma transação recente.</div>
                )}
            </div>


        </div>
    );
}
