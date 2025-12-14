import { supabase } from '../lib/supabase';
import MarketCard from './MarketCard';
import styles from '../page.module.css';

// Constants for Filtering (Moved here or shared)
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
        awayPrice: m.away_price,
        volume: `R$ ${(m.volume / 1000).toFixed(1)}K`
    }));
}

export default async function MarketsGrid({ group, league }) {
    const matches = await getMarkets();

    // Filter Logic
    const filteredMatches = matches.filter(match => {
        if (group !== "Todos") {
            const groupLeagues = FILTER_GROUPS[group] || [];
            if (!groupLeagues.includes(match.league)) return false;
        }
        if (league) {
            return match.league === league;
        }
        return true;
    });

    if (filteredMatches.length === 0) {
        return <div className={styles.emptyState}>Nenhum jogo encontrado nesta categoria.</div>;
    }

    return (
        <>
            {filteredMatches.map((match) => (
                <MarketCard key={match.id} match={match} />
            ))}
        </>
    );
}
