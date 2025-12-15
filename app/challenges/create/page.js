"use client";
import { useState, useEffect } from 'react';
import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import styles from './page.module.css';

export default function CreateChallengePage() {
    const supabase = createClient();
    const router = useRouter();

    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMarket, setSelectedMarket] = useState(null);
    const [wage, setWage] = useState('');
    const [pick, setPick] = useState(null); // 'home' or 'away'
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchMarkets = async () => {
            // Get open markets. We need fixture_id to be valid.
            const { data, error } = await supabase
                .from('markets')
                .select('*')
                .eq('status', 'open')
                .not('fixture_id', 'is', null) // Only markets with ID
                .gt('event_date', new Date().toISOString())
                .order('event_date', { ascending: true });

            if (error) {
                toast.error('Erro ao carregar jogos.');
            } else {
                setMarkets(data || []);
            }
            setLoading(false);
        };
        fetchMarkets();
    }, []);

    const handleSubmit = async () => {
        if (!selectedMarket || !wage || !pick) {
            toast.error('Preencha todos os campos!');
            return;
        }

        const wageNum = parseFloat(wage);
        if (isNaN(wageNum) || wageNum <= 0) {
            toast.error('Valor inválido.');
            return;
        }

        setSubmitting(true);
        try {
            const { data, error } = await supabase.rpc('create_challenge', {
                p_fixture_id: selectedMarket.fixture_id,
                p_match_name: `${selectedMarket.home_team} x ${selectedMarket.away_team}`,
                p_wage: wageNum,
                p_pick: pick
            });

            if (error) throw error;

            toast.success('Desafio criado! Agora compartilhe o link.');
            // Redirect to the new challenge page (or dashboard)
            // Ideally redirect to the specific challenge page so they can copy link.
            // Since data is the UUID, we can redirect there.
            router.push(`/challenges/${data}`);

        } catch (error) {
            toast.error('Erro: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className={styles.container}>Carregando jogos...</div>;

    return (
        <div className={styles.container}>
            <h1>Criar Desafio X1</h1>

            {!selectedMarket ? (
                <div className={styles.step}>
                    <h2>1. Escolha o Jogo</h2>
                    <div className={styles.marketList}>
                        {markets.map(m => (
                            <div key={m.id} className={styles.marketItem} onClick={() => setSelectedMarket(m)}>
                                <div className={styles.teams}>
                                    <span>{m.home_team}</span>
                                    <span className={styles.vs}>x</span>
                                    <span>{m.away_team}</span>
                                </div>
                                <div className={styles.date}>
                                    {new Date(m.event_date).toLocaleString('pt-BR')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className={styles.step}>
                    <button className={styles.backBtn} onClick={() => setSelectedMarket(null)}>← Trocar Jogo</button>

                    <div className={styles.selectedMatch}>
                        <h2>{selectedMarket.home_team} x {selectedMarket.away_team}</h2>
                    </div>

                    <div className={styles.formGroup}>
                        <label>2. Seu Palpite (Quem vence?)</label>
                        <div className={styles.pickOptions}>
                            <button
                                className={`${styles.pickBtn} ${pick === 'home' ? styles.active : ''}`}
                                onClick={() => setPick('home')}
                            >
                                {selectedMarket.home_team}
                            </button>
                            <button
                                className={`${styles.pickBtn} ${pick === 'away' ? styles.active : ''}`}
                                onClick={() => setPick('away')}
                            >
                                {selectedMarket.away_team}
                            </button>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>3. Valor da Aposta (R$)</label>
                        <input
                            type="number"
                            value={wage}
                            onChange={e => setWage(e.target.value)}
                            placeholder="Ex: 50.00"
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.summary}>
                        <p>Você aposta <strong>R$ {wage || '0'}</strong> no <strong>{pick === 'home' ? selectedMarket.home_team : pick === 'away' ? selectedMarket.away_team : '...'}</strong>.</p>
                        <p className={styles.note}>Seu amigo terá que apostar o mesmo valor no outro time.</p>
                    </div>

                    <button
                        className={styles.submitBtn}
                        disabled={submitting}
                        onClick={handleSubmit}
                    >
                        {submitting ? 'Criando...' : '🔥 Criar Desafio agora'}
                    </button>
                </div>
            )}
        </div>
    );
}
