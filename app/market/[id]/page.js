import { supabase } from '../../lib/supabase';
import OrderForm from '../../components/OrderForm';
import ProbabilityChart from '../../components/ProbabilityChart';
import OrderBook from '../../components/OrderBook';
import styles from './page.module.css';
import Link from 'next/link';

// We can keep generateStaticParams if we want SSG for known IDs, 
// but for a dynamic market, we might want to fetch on demand or use revalidate.
// For simplicity in this "Realtime DB" phase, let's fetch on the server component dynamically.

async function getMatch(id) {
    const { data: matchSync, error } = await supabase
        .from('markets')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !matchSync) return null;

    return {
        id: matchSync.id,
        homeTeam: matchSync.home_team,
        awayTeam: matchSync.away_team,
        league: matchSync.league,
        eventDate: matchSync.event_date,
        homePrice: matchSync.home_price,
        awayPrice: matchSync.away_price,
        volume: `R$ ${(matchSync.volume / 1000).toFixed(1)}K`,
        history: matchSync.history // JSONB data from DB
    };
}

export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    const match = await getMatch(resolvedParams.id);

    if (!match) {
        return {
            title: 'Mercado não encontrado | Rei do Pote',
        };
    }

    return {
        title: `${match.homeTeam} vs ${match.awayTeam} | Rei do Pote`,
        description: `Negocie cotas para ${match.homeTeam} x ${match.awayTeam}. Preço atual: ${match.homeTeam} R$ ${match.homePrice} | ${match.awayTeam} R$ ${match.awayPrice}.`,
    };
}

export default async function MarketPage({ params }) {
    // Next.js 15: params is a Promise
    const resolvedParams = await params;
    const match = await getMatch(resolvedParams.id);

    if (!match) {
        return <div className="container" style={{ padding: '40px' }}>Mercado não encontrado. <Link href="/">Voltar</Link></div>;
    }

    const chartWidthHome = match.homePrice * 100;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <Link href="/" className={styles.backLink}>← Voltar para Mercados</Link>
                <h1 className={styles.title}>{match.homeTeam} vs {match.awayTeam}</h1>
                <div className={styles.date}>{new Date(match.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} • {new Date(match.eventDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>

            <div className={styles.content}>
                <div className={styles.chartSection}>
                    <div className={styles.chartContainer}>
                        {/* Simple CSS Visualizer for Probability */}
                        <div className={styles.probabilityBar}>
                            <div className={styles.probSegment} style={{ width: `${chartWidthHome}%`, background: 'var(--primary)', color: '#000' }}>
                                <span className={styles.probLabel}>{match.homeTeam} {Math.floor(match.homePrice * 100)}%</span>
                            </div>
                            <div className={styles.probSegment} style={{ width: `${100 - chartWidthHome}%`, background: 'var(--card-border)', color: '#fff' }}> {/* Using neutral for away or secondary color */}
                                <span className={styles.probLabel}>{match.awayTeam} {Math.floor(match.awayPrice * 100)}%</span>
                            </div>
                        </div>

                        {/* Interactive Chart */}
                        <ProbabilityChart data={match.history} teamName={match.homeTeam} />
                    </div>

                    <div className={styles.stats}>
                        <div className={styles.statItem}>
                            <div className={styles.statLabel}>Volume</div>
                            <div className={styles.statValue}>{match.volume}</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statLabel}>Probabilidade ({match.homeTeam})</div>
                            <div className={styles.statValue}>{Math.floor(match.homePrice * 100)}%</div>
                        </div>
                    </div>

                    {/* Order Book Display */}
                    <OrderBook match={match} selectedSide={'home'} />
                </div>

                <div className={styles.orderSection}>
                    <OrderForm match={match} />
                </div>
            </div>
        </div>
    );
}
