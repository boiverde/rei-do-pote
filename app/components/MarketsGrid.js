import { supabase } from '../lib/supabase';
import MarketCard from './MarketCard';
import styles from '../page.module.css';

// Constants for Filtering
const FILTER_GROUPS = {
    "Todos": [],
    "Nacional": ["Brasileirão", "Copa do Brasil"],
    "Regionais": [
        "Acreano", "Alagoano", "Amapaense", "Amazonense", "Baiano", "Brasiliense",
        "Capixaba", "Carioca", "Catarinense", "Cearense", "Copa do Nordeste", "Copa Verde",
        "Gaúcho", "Goiano", "Maranhense", "Mato-Grossense", "Mineiro", "Paraense",
        "Paraibano", "Paranaense", "Paulistão", "Pernambucano", "Piauiense", "Potiguar",
        "Rondoniense", "Roraimense", "Sergipano", "Sul-Mato-Grossense", "Tocantinense"
    ],
    "Internacional": ["Libertadores", "Sul-Americana", "Mundial de Clubes"]
};

// Data Fetching logic
async function getMarkets() {
    const { data, error } = await supabase.from('markets').select('*');
    if (error) {
        console.error('Error fetching markets:', error);
        return [];
    }
    return data.map(m => ({
        id: m.id,
        homeTeam: m.home_team,
        awayTeam: m.away_team,
        homeLogo: m.home_logo,
        awayLogo: m.away_logo,
        league: m.league,
        eventDate: m.event_date,
        homePrice: m.home_price,
        return data.map(m => ({
            id: m.id,
            homeTeam: m.home_team,
            awayTeam: m.away_team,
            homeLogo: m.home_logo,
            awayLogo: m.away_logo,
            league: m.league,
            eventDate: m.event_date,
            homePrice: m.home_price, // Keeping for fallback
            awayPrice: m.away_price, // Keeping for fallback
            volume: `R$ ${(m.volume / 1000).toFixed(1)}K`,
            // Fantasy Data
            homePool: parseFloat(m.total_pool_home || 0),
            awayPool: parseFloat(m.total_pool_away || 0),
            feePercent: parseFloat(m.fee_percent || 0.10)
        }));
    }

export default async function MarketsGrid({ group, league }) {
        const matches = await getMarkets();

        // Filter Logic
        const filteredMatches = matches.filter(match => {
            // 1. Filter by Group/League
            if (group !== "Todos") {
                const groupLeagues = FILTER_GROUPS[group] || [];
                if (!groupLeagues.includes(match.league)) return false;
            }
            if (league) {
                if (match.league !== league) return false;
            }

            // 2. Filter Past Events (Hide finished games)
            const eventDate = new Date(match.eventDate);
            const now = new Date();
            // Add a buffer of ~2 hours for "Live" games to still show? 
            // For now, strict inequality: if start time < now, it's started/past.
            // Usually prediction markets close AT START time.
            if (eventDate < now) {
                return false;
            }

            return true;
        });

        if (filteredMatches.length === 0) {
            return <div className={styles.emptyState}>Nenhum jogo disponível nesta categoria.</div>;
        }

        return (
            <>
                {filteredMatches.map((match) => (
                    <MarketCard key={match.id} match={match} />
                ))}
            </>
        );
    }
