import Link from 'next/link';
import { Suspense } from 'react';
import styles from './page.module.css';
import MarketsGrid from './components/MarketsGrid';
import MarketsSkeleton from './components/MarketsSkeleton';

// Constants for Filtering (Kept here for Button Logic)
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

// Server Component
export default async function Home({ searchParams }) {
  // Wait for searchParams (Next.js 15 requirement)
  const params = await searchParams;
  const initialGroup = params?.group || "Todos";
  const initialLeague = params?.league || null;

  // Create a unique key for Suspense based on filter params
  // This forces the MarketsGrid to re-mount (and show fallback) when filters change
  const suspenseKey = `${initialGroup}-${initialLeague}`;

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
        <Suspense key={suspenseKey} fallback={<MarketsSkeleton />}>
          <MarketsGrid group={initialGroup} league={initialLeague} />
        </Suspense>
      </div>
    </main>
  );
}
