import Link from 'next/link';
import styles from './MarketCard.module.css';

export default function MarketCard({ match }) {
    const formatPrice = (price) => `R$ ${price.toFixed(2).replace('.', ',')}`;

    return (
        <Link href={`/market/${match.id}`} className={styles.card}>
            <div className={styles.header}>
                <span className={styles.date}>{new Date(match.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                <span className={styles.volume}>{match.volume} Vol.</span>
            </div>

            <div className={styles.teamsContainer}>
                <div className={styles.teamInfo}>
                    <span className={styles.teamName}>{match.homeTeam}</span>
                </div>
                <div className={styles.vs}>x</div>
                <div className={styles.teamInfo}>
                    <span className={styles.teamName}>{match.awayTeam}</span>
                </div>
            </div>

            <div className={styles.outcomes}>
                <div className={styles.outcome}>
                    <div className={styles.outcomeLabel}>{match.homeTeam}</div>
                    <div className={`${styles.price} ${styles.green}`}>
                        {formatPrice(match.homePrice)}
                    </div>
                </div>
                <div className={styles.outcome}>
                    <div className={styles.outcomeLabel}>{match.awayTeam}</div>
                    <div className={`${styles.price} ${styles.green}`}>
                        {formatPrice(match.awayPrice)}
                    </div>
                </div>
            </div>
        </Link>
    );
}
