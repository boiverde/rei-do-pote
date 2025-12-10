"use client";
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase'; // Import Supabase client
import MarketCard from './components/MarketCard';
import styles from './page.module.css';

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

export default function Home() {
  const [selectedGroup, setSelectedGroup] = useState("Todos");
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        // Timeout promise
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000));

        // Data fetch promise
        const fetchPromise = supabase.from('markets').select('*');

        const { data, error } = await Promise.race([fetchPromise, timeout]);

        if (error) {
          console.error('Error fetching markets:', error);
        } else if (data) {
          // Map DB columns (snake_case) to Component props (camelCase)
          const mappedMatches = data.map(m => ({
            id: m.id,
            homeTeam: m.home_team,
            awayTeam: m.away_team,
            league: m.league,
            eventDate: m.event_date,
            homePrice: m.home_price,
            awayPrice: m.away_price,
            volume: `R$ ${(m.volume / 1000).toFixed(1)}K` // Simple formatter
          }));
          setMatches(mappedMatches);
        }
      } catch (err) {
        console.error('Fetch failed or timed out:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, []);

  const handleGroupChange = (group) => {
    setSelectedGroup(group);
    setSelectedLeague(null); // Reset sub-filter when changing group
  };

  const filteredMatches = matches.filter(match => {
    // 1. Filter by Group
    if (selectedGroup !== "Todos") {
      const groupLeagues = FILTER_GROUPS[selectedGroup];
      if (!groupLeagues.includes(match.league)) return false;
    }

    // 2. Filter by Specific League (if selected)
    if (selectedLeague) {
      return match.league === selectedLeague;
    }

    return true;
  });

  if (loading) {
    return <div className={styles.main}><div className={styles.hero}>Carregando mercados...</div></div>;
  }

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Futebol Brasileiro</h1>
        <p className={styles.subtitle}>Negocie o resultado dos principais jogos da rodada.</p>

        {/* Primary Filter (Groups) */}
        <div className={styles.filterBar}>
          {Object.keys(FILTER_GROUPS).map(group => (
            <button
              key={group}
              className={`${styles.filterBtn} ${selectedGroup === group ? styles.activeFilter : ''}`}
              onClick={() => handleGroupChange(group)}
            >
              {group}
            </button>
          ))}
        </div>

        {/* Secondary Filter (Subcategories) - Only if not "Todos" */}
        {selectedGroup !== "Todos" && (
          <div className={styles.subFilterBar}>
            <button
              className={`${styles.subFilterBtn} ${selectedLeague === null ? styles.activeSubFilter : ''}`}
              onClick={() => setSelectedLeague(null)}
            >
              Tudo de {selectedGroup}
            </button>
            {FILTER_GROUPS[selectedGroup].map(league => (
              <button
                key={league}
                className={`${styles.subFilterBtn} ${selectedLeague === league ? styles.activeSubFilter : ''}`}
                onClick={() => setSelectedLeague(league)}
              >
                {league}
              </button>
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
