"use client";

import Image from 'next/image';
import Link from 'next/link';
import styles from './MarketCard.module.css';
import { useBetSlip } from '../context/BetSlipContext';
import { formatCurrency } from '@/utils/format';

export default function MarketCard({ match }) {
    const { addBet, bets, removeBet } = useBetSlip();

    // Helper to check if this specific option is in the slip
    const isSelected = (outcome) => {
        return bets.some(b => b.id === match.id && b.option === outcome);
    };

    // Parimutuel Price Calculation (0.00 - 1.00)
    const calculatePrice = (outcome) => {
        // Fallback: 50/50 Start if no pool (or API Price if desired, but user asked for 0.50 start)
        if (!match.homePool || !match.awayPool || (match.homePool + match.awayPool === 0)) {
            return 0.50;
        }

        const totalPool = match.homePool + match.awayPool;
        const sidePool = outcome === 'home' ? match.homePool : match.awayPool;

        if (totalPool === 0) return 0.50;

        // Price = Share of the Pool
        // Example: 600 Home, 400 Away. Total 1000.
        // Home Price = 600/1000 = 0.60
        return sidePool / totalPool;
    };

    const homePrice = calculatePrice('home');
    const awayPrice = calculatePrice('away');

    const handleToggle = (outcome) => {
        const currentPrice = outcome === 'home' ? homePrice : awayPrice;

        // Calculate implied odd for the slip (Net of Fee)
        // Payout = (Total * (1 - Fee)) / Side
        const fee = match.feePercent || 0.10;
        let estimatedOdd = 0;
        if (currentPrice > 0) {
            // Formula: (1 / Price) * (1 - fee)
            // ex: Price 0.5. Odd 2.0. Net 1.8.
            estimatedOdd = (1 / currentPrice) * (1 - fee);
        }

        if (isSelected(outcome)) {
            removeBet(match.id, outcome);
        } else {
            addBet({
                id: match.id,
                matchStr: `${match.homeTeam} vs ${match.awayTeam}`,
                option: outcome,
                selectionName: outcome === 'home' ? match.homeTeam : match.awayTeam,
                price: currentPrice,
                odds: estimatedOdd,
                isParimutuel: true,
                homePool: match.homePool || 0,
                awayPool: match.awayPool || 0
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

            {/* Home Row */}
            <div className={styles.teamRow}>
                <Link href={`/market/${match.id}`} className={styles.teamInfo}>
                    {match.homeLogo ? (
                        <Image src={match.homeLogo} alt={match.homeTeam} width={32} height={32} className={styles.logo} />
                    ) : (
                        <div className={`${styles.logo} ${styles.placeholderLogo}`}>🛡️</div>
                    )}
                    <span className={styles.teamName}>{match.homeTeam}</span>
                </Link>
                <button
                    className={`${styles.priceBtn} ${isSelected('home') ? styles.selected : ''}`}
                    onClick={() => handleToggle('home')}
                >
                    <span className={styles.value}>{formatCurrency(homePrice)}</span>
                </button>
            </div>

            {/* Away Row */}
            <div className={styles.teamRow}>
                <Link href={`/market/${match.id}`} className={styles.teamInfo}>
                    {match.awayLogo ? (
                        <Image src={match.awayLogo} alt={match.awayTeam} width={32} height={32} className={styles.logo} />
                    ) : (
                        <div className={`${styles.logo} ${styles.placeholderLogo}`}>🛡️</div>
                    )}
                    <span className={styles.teamName}>{match.awayTeam}</span>
                </Link>
                <button
                    className={`${styles.priceBtn} ${isSelected('away') ? styles.selected : ''}`}
                    onClick={() => handleToggle('away')}
                >
                    <span className={styles.value}>{formatCurrency(awayPrice)}</span>
                </button>
            </div>
            {/* Pool Info */}
            {(match.homePool > 0) && (
                <div className={styles.poolInfo}>
                    Pool Dinâmico • Taxa 10%
                </div>
            )}
        </div>
    );
}
