"use client";
import { useState, useEffect } from 'react';
import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import styles from './page.module.css';

export default function ChallengeClient({ params }) {
    const supabase = createClient();
    const router = useRouter();
    const { id } = params;

    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [creatorName, setCreatorName] = useState('Um usuário');

    useEffect(() => {
        const fetchChallenge = async () => {
            // 1. Get Session
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);

            // 2. Get Challenge
            const { data, error } = await supabase
                .from('challenges')
                .select(`
                    *,
                    creator:profiles!creator_id(email) 
                `)
                .eq('id', id)
                .single();

            if (error) {
                toast.error('Desafio não encontrado.');
                router.push('/challenges');
                return;
            }

            setChallenge(data);
            if (data.creator && data.creator.email) {
                setCreatorName(data.creator.email.split('@')[0]);
            }
            setLoading(false);
        };
        fetchChallenge();

        // Realtime Subscription (Optimized)
        const channel = supabase
            .channel(`challenge-${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'challenges',
                    filter: `id=eq.${id}`
                },
                (payload) => {
                    console.log('Realtime update:', payload);
                    // Update state with new data (status, opponent_id, etc.)
                    setChallenge(prev => ({ ...prev, ...payload.new }));

                    if (payload.new.status === 'matched') {
                        toast.success('Desafio aceito! O jogo começou 🔥');
                        // Optional: Refresh to get opponent details if needed, 
                        // but payload usually has raw columns. 
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    const handleAccept = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        setProcessing(true);
        try {
            const { error } = await supabase.rpc('accept_challenge', {
                p_challenge_id: id
            });

            if (error) throw error;

            toast.success('Desafio aceito! Boa sorte 🍀');
            router.push('/challenges'); // Go to dashboard
        } catch (error) {
            toast.error(error.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className={styles.container}>Carregando desafio...</div>;
    if (!challenge) return null;

    const isCreator = user && user.id === challenge.creator_id;
    const opponentPick = challenge.creator_pick === 'home' ? 'away' : 'home';
    const opponentTeamName = opponentPick === 'home' ? challenge.match_name.split(' x ')[0] : challenge.match_name.split(' x ')[1];

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <span className={styles.badge}>Desafio X1 🥊</span>
                    <span className={styles.date}>{new Date(challenge.created_at).toLocaleDateString()}</span>
                </div>

                <h1 className={styles.title}>{challenge.match_name}</h1>

                <div className={styles.vsBlock}>
                    <div className={styles.playerBlock}>
                        <div className={styles.avatar}>👤</div>
                        <span className={styles.playerName}>{creatorName}</span>
                        <span className={styles.pickBadge}>
                            Apostou no {challenge.creator_pick === 'home' ? 'Casa' : 'Visitante'}
                        </span>
                    </div>

                    <div className={styles.vsIcon}>VS</div>

                    <div className={styles.playerBlock}>
                        <div className={`${styles.avatar} ${!challenge.opponent_id ? styles.empty : ''}`}>
                            {challenge.opponent_id ? '👤' : '?'}
                        </div>
                        <span className={styles.playerName}>
                            {challenge.opponent_id ? 'Oponente' : 'Você?'}
                        </span>
                        <span className={styles.pickBadge}>
                            {opponentTeamName}
                        </span>
                    </div>
                </div>

                <div className={styles.wageBlock}>
                    <span>Valor da Aposta</span>
                    <strong>R$ {challenge.wage}</strong>
                </div>

                {/* ACTION BUTTONS */}
                <div className={styles.actions}>
                    {isCreator ? (
                        <div className={styles.statusMsg}>
                            {challenge.status === 'open' ?
                                'Aguardando alguém aceitar... Copie o link!' :
                                'Desafio já aceito!'}
                        </div>
                    ) : (
                        <>
                            {challenge.status !== 'open' ? (
                                <button className={styles.disabledBtn} disabled>Desafio Indisponível (Já aceito ou cancelado)</button>
                            ) : (
                                !user ? (
                                    <Link href={`/login?redirect=/challenges/${id}`} className={styles.actionBtn}>
                                        Entrar para Aceitar
                                    </Link>
                                ) : (
                                    <button
                                        onClick={handleAccept}
                                        className={styles.actionBtn}
                                        disabled={processing}
                                    >
                                        {processing ? 'Processando...' : `Aceitar por R$ ${challenge.wage}`}
                                    </button>
                                )
                            )}
                        </>
                    )}
                </div>

                <div className={styles.rules}>
                    <p>ℹ️ Regras: Vencedor leva tudo. Empate devolve a aposta (taxa 10%).</p>
                </div>
            </div>
        </div>
    );
}
