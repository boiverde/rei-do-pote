"use client";
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './Sidebar.module.css';

const FILTER_GROUPS = {
    "Nacional": ["Brasileirão Série A", "Copa do Brasil", "Clássicos Estaduais"],
    "Internacional": ["Libertadores", "Sul-Americana", "Mundial de Clubes", "Premier League", "La Liga", "Champions League"]
};

export default function Sidebar() {
    const searchParams = useSearchParams();
    const activeGroup = searchParams.get('group');
    const activeLeague = searchParams.get('league');

    // Helper to check if active
    const isActive = (g, l) => {
        if (!l) return activeGroup === g && !activeLeague;
        return activeLeague === l;
    };

    return (
        <aside className={styles.sidebar}>

            {/* Search / Top Section */}
            <div className={styles.section}>
                <div className={styles.searchBox}>
                    <input type="text" placeholder="Buscar..." className={styles.searchInput} />
                </div>
            </div>

            {/* Main Stats / Live */}
            <div className={styles.section}>
                <Link href="/" className={`${styles.menuItem} ${!activeGroup || activeGroup === 'Todos' ? styles.active : ''}`}>
                    <span className={styles.icon}>🏠</span>
                    <span className={styles.label}>Visão Geral</span>
                </Link>
                <div className={styles.menuItem}>
                    <span className={styles.icon}>⚡</span>
                    <span className={styles.label}>Ao Vivo <span className={styles.badge}>Live</span></span>
                </div>

                <Link href="/ranking" className={`${styles.menuItem} ${styles.ranking}`}>
                    <span className={styles.icon}>🏆</span>
                    <span className={styles.label}>Ranking</span>
                </Link>
            </div>

            {/* Dynamic Leagues */}
            {Object.entries(FILTER_GROUPS).map(([group, leagues]) => (
                <div key={group} className={styles.group}>
                    <div className={styles.groupTitle}>{group}</div>

                    {/* Main Group Link */}
                    <Link
                        href={`/?group=${group}`}
                        className={`${styles.menuItem} ${isActive(group, null) ? styles.active : ''}`}
                    >
                        <span className={styles.label}>Tudo de {group}</span>
                    </Link>

                    {/* Sub Leagues */}
                    {leagues.map(league => (
                        <Link
                            key={league}
                            href={`/?group=${group}&league=${league}`}
                            className={`${styles.menuItem} ${styles.subItem} ${isActive(group, league) ? styles.active : ''}`}
                        >
                            <span className={styles.label}>{league}</span>
                        </Link>
                    ))}
                </div>
            ))}

        </aside>
    );
}
