"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '../utils/supabase/client';
import styles from './page.module.css';

export default function RankingPage() {
    const supabase = createClient();
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLeaders() {
            setLoading(true);
            // Leaderboard: Top Winnings (Ranking Score)
            const { data, error } = await supabase
                .from('profiles')
                .select('username, full_name, avatar_url, ranking_score')
                .order('ranking_score', { ascending: false })
                .limit(10);

            if (error) {
                console.error(error);
            } else {
                setLeaders(data || []);
            }
            setLoading(false);
        }

        fetchLeaders();
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>🏆 Ranking Rei do Pote</h1>
                <p>Os maiores acumuladores da plataforma</p>
            </div>

            <div className={styles.list}>
                {loading ? <div className={styles.loading}>Carregando...</div> : (
                    leaders.map((user, index) => (
                        <div key={index} className={`${styles.item} ${index < 3 ? styles.top3 : ''}`}>
                            <div className={styles.rank}>#{index + 1}</div>
                            <div className={styles.avatar}>
                                {user.avatar_url ? <Image src={user.avatar_url} alt={user.username || 'User'} width={40} height={40} className={styles.avatarImg} /> : <div className={styles.placeholder}>👤</div>}
                            </div>
                            <div className={styles.info}>
                                <div className={styles.name}>{user.username || user.full_name || 'Anônimo'}</div>
                                <div className={styles.balance}>🏆 {user.ranking_score?.toFixed(2) || '0.00'} pts</div>
                            </div>
                            {index === 0 && <div className={styles.medal}>🥇</div>}
                            {index === 1 && <div className={styles.medal}>🥈</div>}
                            {index === 2 && <div className={styles.medal}>🥉</div>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
