"use client";
import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
import Link from 'next/link';
import styles from './page.module.css';
import { toast } from 'sonner';

export default function ChallengesPage() {
    const supabase = createClient();
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setLoading(false);
                return;
            }
            setUser(session.user);

            // Fetch my challenges (created or opponent)
            const { data, error } = await supabase
                .from('challenges')
                .select('*')
                .or(`creator_id.eq.${session.user.id},opponent_id.eq.${session.user.id}`)
                .order('created_at', { ascending: false });

            if (error) {
                console.error(error);
                toast.error('Erro ao carregar desafios.');
            } else {
                setChallenges(data || []);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    // Copy Invite Link
    const handleShare = (id) => {
        const link = `${window.location.origin}/challenges/${id}`;
        navigator.clipboard.writeText(link);
        toast.success('Link copiado! Mande pro seu amigo.');
    };

    if (loading) return <div className={styles.container}>Carregando desafios...</div>;

    if (!user) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <h2>Desafios X1 🥊</h2>
                    <p>Entre para desafiar seus amigos.</p>
                    <Link href="/login" className={styles.btnPrimary}>Entrar Agora</Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Meus Desafios X1 🥊</h1>
                <Link href="/challenges/create" className={styles.createBtn}>
                    + Novo Desafio
                </Link>
            </div>

            {challenges.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🤜🤛</div>
                    <h3>Nenhum desafio ativo</h3>
                    <p>Crie um desafio e mande o link para um amigo apostar contra você!</p>
                </div>
            ) : (
                <div className={styles.list}>
                    {challenges.map(c => {
                        const isCreator = c.creator_id === user.id;
                        const myPick = isCreator ? c.creator_pick : (c.creator_pick === 'home' ? 'away' : 'home');

                        return (
                            <div key={c.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.statusBadge} data-status={c.status}>
                                        {c.status === 'open' ? 'Aguardando Oponente ⏳' :
                                            c.status === 'matched' ? 'Valendo 🔥' :
                                                c.status === 'settled' ? 'Finalizado ✅' : c.status}
                                    </span>
                                    <span className={styles.date}>
                                        {new Date(c.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                <h3 className={styles.matchName}>{c.match_name}</h3>

                                <div className={styles.details}>
                                    <div className={styles.detailItem}>
                                        <span>Valor:</span>
                                        <strong>R$ {c.wage}</strong>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span>Meu Palpite:</span>
                                        <strong>{myPick === 'home' ? 'Casa' : 'Visitante'}</strong>
                                    </div>
                                </div>

                                {c.status === 'open' && isCreator && (
                                    <button
                                        onClick={() => handleShare(c.id)}
                                        className={styles.shareBtn}
                                    >
                                        🔗 Copiar Link de Convite
                                    </button>
                                )}

                                {c.status === 'settled' && (
                                    <div className={styles.result}>
                                        {c.winner_id === user.id ?
                                            <span className={styles.win}>Você Ganhou! 🎉</span> :
                                            c.winner_id ? <span className={styles.loss}>Você Perdeu ❌</span> :
                                                <span className={styles.draw}>Reembolsado (Empate) ↩️</span>
                                        }
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
