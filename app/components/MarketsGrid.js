import { createClient } from '../utils/supabase/server';
import MarketCard from './MarketCard';
import LandingHero from './LandingHero';
import styles from '../page.module.css';

// Constants for Filtering
const FILTER_GROUPS = {
    "Todos": [],
    "Nacional": ["Brasileirão Série A", "Copa do Brasil", "Clássicos Estaduais"],
    "Internacional": ["Libertadores", "Sul-Americana", "Mundial de Clubes", "Premier League", "La Liga", "Champions League"]
};

// Data Fetching logic
// Data Fetching logic
async function getMarkets() {
    const supabase = await createClient();

    // Allow games from 4 hours ago (to show Live games)
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('markets')
        .select('*')
        //.gt('event_date', nowISO) // Old strict filter
        .gt('event_date', fourHoursAgo) // New relaxed filter
        .order('event_date', { ascending: true }); // Soonest first

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
        volume: `👑 ${(m.volume / 1000).toFixed(1)}K`,
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

        // 2. Filter Past Events (Hide only REALLY old games, e.g. > 4h ago)
        // We want to show "Live" games.
        // const eventDate = new Date(match.eventDate);
        // const now = new Date();
        // if (eventDate < now) return false; // REMOVED strict check

        return true;
    });

    if (filteredMatches.length === 0) {
        return <LandingHero />;
    }

    return (
        <>
            {filteredMatches.map((match) => (
                <MarketCard key={match.id} match={match} />
            ))}
        </>
    );
}
