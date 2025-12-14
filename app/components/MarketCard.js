"use client";
import Link from 'next/link';
import styles from './MarketCard.module.css';
import { useBetSlip } from '../context/BetSlipContext';

export default function MarketCard({ match }) {
    const { addBet, bets, removeBet } = useBetSlip();

    // Helper to check if this specific option is in the slip
    const isSelected = (outcome) => {
        return bets.some(b => b.id === match.id && b.option === outcome);
    };

    // Parimutuel Calculation
    const calculateOdds = (outcome) => {
        // Fallback to API price if no local pool data yet
        if (!match.homePool || !match.awayPool || (match.homePool + match.awayPool === 0)) {
            const price = outcome === 'home' ? match.homePrice : match.awayPrice;
            return price > 0 ? (1 / price) : 0;
        }

        const totalPool = match.homePool + match.awayPool;
        const sidePool = outcome === 'home' ? match.homePool : match.awayPool;
        const fee = match.feePercent || 0.10;

        if (sidePool === 0) return 1.0; // Edge case

        // Parimutuel Formula: (Total Pool - Fee) / Winner Pool
        // Example: Pool 1000. Fee 100. Net 900.
        // If 500 on Home: 900 / 500 = 1.8x
        const netPool = totalPool * (1 - fee);
        return netPool / sidePool;
    };

    const homeOdd = calculateOdds('home');
    const awayOdd = calculateOdds('away');

    const handleToggle = (outcome) => {
        // For the bet slip, we send the simulated price (1 / odd)
        // In Parimutuel, you buy "shares" at $1.00 usually, but to keep mapping consistent:
        // Price = 1 / Odd
        const currentOdd = outcome === 'home' ? homeOdd : awayOdd;
        const impliedPrice = currentOdd > 0 ? (1 / currentOdd) : 0;

        if (isSelected(outcome)) {
            removeBet(match.id, outcome);
        } else {
            addBet({
                id: match.id,
                matchStr: `${match.homeTeam} x ${match.awayTeam}`,
                option: outcome,
                selectionName: outcome === 'home' ? match.homeTeam : match.awayTeam,
                price: impliedPrice,
                odds: currentOdd,
                isParimutuel: true
            });
        }
    };

    return (
        <div className={styles.card}>
            {/* Header: Time & Status */}
            <div className={styles.header}>
                <span className={styles.time}>
                    {new Date(match.eventDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    <span className={styles.date}>
                        {new Date(match.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                </span>
                {match.volume && <span className={styles.volume}>Vol: {match.volume}</span>}
            </div>

            {/* Teams Row */}
            <div className={styles.teamsRow}>
                <div className={styles.team}>
                    {match.homeLogo ? (
                        <img src={match.homeLogo} alt="" className={styles.logo} />
                    ) : (
                        <div className={`${styles.logo} ${styles.placeholderLogo}`}>🛡️</div>
                    )}
                    <span className={styles.teamName}>{match.homeTeam}</span>
                </div>
                <div className={styles.team}>
                    {match.awayLogo ? (
                        <img src={match.awayLogo} alt="" className={styles.logo} />
                    ) : (
                        <div className={`${styles.logo} ${styles.placeholderLogo}`}>🛡️</div>
                    )}
                    <span className={styles.teamName}>{match.awayTeam}</span>
                </div>
            </div>

            {/* Odds / Action Row */}
            <div className={styles.oddsRow}>
                <button
                    className={`${styles.oddBtn} ${isSelected('home') ? styles.selected : ''}`}
                    onClick={() => handleToggle('home')}
                >
                    <span className={styles.outcome}>1</span>
                    <span className={styles.value}>
                        {homeOdd.toFixed(2)}
                    </span>
                </button>

                <button
                    className={`${styles.oddBtn} ${isSelected('away') ? styles.selected : ''}`}
                    onClick={() => handleToggle('away')}
                >
                    <span className={styles.outcome}>2</span>
                    <span className={styles.value}>
                        {awayOdd.toFixed(2)}
                    </span>
                </button>
            </div>

            {(match.homePool > 0) && (
                <div className={styles.poolInfo}>
                    Pool Dinâmico • Taxa 10%
                </div>
            )}
        </div>
    );
}
