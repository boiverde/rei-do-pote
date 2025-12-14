import Link from 'next/link';
import styles from './MarketCard.module.css';

export default function MarketCard({ match }) {
    const formatPrice = (price) => match.status === 'suspended' ? '🔒' : price.toFixed(2);

    return (
        <div className={styles.row}>
            {/* Meta Info (Time & Status) */}
            <div className={styles.meta}>
                <span className={styles.time}>
                    {new Date(match.eventDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={styles.date}>
                    {new Date(match.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </span>
            </div>

            {/* Match Info (Teams) */}
            <Link href={`/market/${match.id}`} className={styles.matchInfo}>
                <div className={styles.team}>
                    {match.homeLogo && <img src={match.homeLogo} alt="" className={styles.logo} />}
                    <span className={styles.teamName}>{match.homeTeam}</span>
                </div>
                <div className={styles.team}>
                    {match.awayLogo && <img src={match.awayLogo} alt="" className={styles.logo} />}
                    <span className={styles.teamName}>{match.awayTeam}</span>
                </div>
            </Link>

            {/* Odds / Actions */}
            <div className={styles.oddsContainer}>
                {/* Home Odds */}
                <button className={styles.oddBtn}>
                    <span className={styles.oddLabel}>1</span>
                    <span className={styles.oddValue}>{formatPrice(match.homePrice)}</span>
                </button>

                {/* Draw (Placeholder if we had it) - skipping for now as per data model */}

                {/* Away Odds */}
                <button className={styles.oddBtn}>
                    <span className={styles.oddLabel}>2</span>
                    <span className={styles.oddValue}>{formatPrice(match.awayPrice)}</span>
                </button>
            </div>
        </div>
    );
}
