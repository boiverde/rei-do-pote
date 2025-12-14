import { supabase } from './lib/supabase';
import MarketCard from './components/MarketCard';
import styles from './page.module.css';
import Link from 'next/link';

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

// Data Fetching logic (Server Side)
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
    league: m.league,
    eventDate: m.event_date,
    homePrice: m.home_price,
    awayPrice: m.away_price,
    volume: `R$ ${(m.volume / 1000).toFixed(1)}K`
  }));
}

// Server Component
export default async function Home({ searchParams }) {
  // Wait for searchParams (Next.js 15 requirement)
  const params = await searchParams;
  const initialGroup = params?.group || "Todos";
  const initialLeague = params?.league || null;

  const matches = await getMarkets();

  // Filter Logic (Now happens on render, or we could filter in DB for efficiency in future)
  const filteredMatches = matches.filter(match => {
    if (initialGroup !== "Todos") {
      const groupLeagues = FILTER_GROUPS[initialGroup];
      if (!groupLeagues.includes(match.league)) return false;
    }
    if (initialLeague) {
      return match.league === initialLeague;
    }
    return true;
  });

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Futebol Brasileiro</h1>
        <p className={styles.subtitle}>Negocie o resultado dos principais jogos da rodada.</p>

        {/* Filter Navigation - Using Links for Server Component interactivity */}
        <div className={styles.filterBar}>
          {Object.keys(FILTER_GROUPS).map(group => (
            <Link
              key={group}
              href={`/?group=${group}`}
              className={`${styles.filterBtn} ${initialGroup === group ? styles.activeFilter : ''}`}
            >
              {group}
            </Link>
          ))}
        </div>

        {/* Sub-Filters */}
        {initialGroup !== "Todos" && (
          <div className={styles.subFilterBar}>
            <Link
              href={`/?group=${initialGroup}`}
              className={`${styles.subFilterBtn} ${initialLeague === null ? styles.activeSubFilter : ''}`}
            >
              Tudo de {initialGroup}
            </Link>
            {FILTER_GROUPS[initialGroup].map(league => (
              <Link
                key={league}
                href={`/?group=${initialGroup}&league=${league}`}
                className={`${styles.subFilterBtn} ${initialLeague === league ? styles.activeSubFilter : ''}`}
              >
                {league}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className={styles.grid}>
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match) => (
            <MarketCard key={match.id} match={match} />
          ))
        ) : (
          <div className={styles.emptyState}>Nenhum jogo encontrado nesta categoria.</div>
        )}
      </div>
    </main>
  );
}
