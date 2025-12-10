"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import styles from './page.module.css';

export default function AdminPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [syncing, setSyncing] = useState(false); // Fix: Add missing state
    const [submitMessage, setSubmitMessage] = useState(null); // For submit feedback

    // Form State
    const [formData, setFormData] = useState({
        homeTeam: '',
        awayTeam: '',
        league: 'Brasileirão Série A',
        description: '',
        eventDate: '',
        eventTime: '',
        homePrice: '0.50'
    });

    // 1. Check Admin Status
    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/login');
                    return;
                }

                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', session.user.id)
                    .single();

                if (error || !profile || !profile.is_admin) {
                    setIsAuthorized(false);
                } else {
                    setIsAuthorized(true);
                }
            } catch (err) {
                console.error("Admin check failed", err);
                setIsAuthorized(false);
            } finally {
                setLoading(false);
            }
        };
        checkAdmin();
    }, [router]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Combine Date & Time
        const fullDate = new Date(`${formData.eventDate}T${formData.eventTime}:00`);

        // Calculate Away Price (1 - Home Price)
        const homeP = parseFloat(formData.homePrice);
        const awayP = 1 - homeP;

        const newMarket = {
            home_team: formData.homeTeam,
            away_team: formData.awayTeam,
            description: formData.description,
            league: formData.league,
            event_date: fullDate.toISOString(),
            status: 'active', // default status
            home_price: homeP,
            away_price: awayP,
            volume: 0
        };

        const { error } = await supabase
            .from('markets')
            .insert([newMarket]);

        setSubmitting(false);

        if (error) {
            alert('Erro ao criar mercado: ' + error.message);
        } else {
            alert('Mercado criado com sucesso! 🚀');
            // Reset form
            setFormData({
                homeTeam: '',
                awayTeam: '',
                league: 'Brasileirão Série A',
                description: '',
                eventDate: '',
                eventTime: '',
                homePrice: '0.50'
            });
        }
    };

    const handleSync = async () => {
        if (!confirm('Isso vai buscar os próximos jogos (Brasileirão, Mundial) e criar mercados. Continuar?')) return;

        setSyncing(true); // Use syncing state for this operation
        try {
            const res = await fetch('/api/sync-markets', { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                alert(`Sucesso! ${data.message}\nJogos:\n${data.games.join('\n')}`);
            } else {
                alert('Erro: ' + (data.error || data.message));
            }
        } catch (err) {
            alert('Erro de conexão.');
        } finally {
            setSyncing(false);
        }
    };

    if (loading) return <div className={styles.loading}>Verificando permissões...</div>;

    if (!isAuthorized) {
        return <div className={styles.container}>Acesso Negado</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Painel Admin 👮‍♂️</h1>
                <button onClick={handleSync} disabled={syncing} className={styles.syncBtn}>
                    {syncing ? 'Sincronizando...' : '🔄 Sincronizar Jogos'}
                </button>
            </div>

            <div className={styles.card}>
                <h2>Criar Novo Mercado (Manual)</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.row}>
                        <div className={styles.group}>
                            <label>Time da Casa (Home)</label>
                            <input name="homeTeam" value={formData.homeTeam} onChange={handleChange} required placeholder="Ex: Flamengo" />
                        </div>
                        <div className={styles.group}>
                            <label>Visitante (Away)</label>
                            <input name="awayTeam" value={formData.awayTeam} onChange={handleChange} required placeholder="Ex: Vasco" />
                        </div>
                    </div>

                    <div className={styles.group}>
                        <label>Liga / Campenato</label>
                        <select name="league" value={formData.league} onChange={handleChange}>
                            <option>Brasileirão Série A</option>
                            <option>Copa do Brasil</option>
                            <option>Libertadores</option>
                            <option>Champions League</option>
                        </select>
                    </div>

                    <div className={styles.group}>
                        <label>Descrição Curta</label>
                        <input name="description" value={formData.description} onChange={handleChange} required placeholder="Ex: Clássico dos Milhões no Maracanã" />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.group}>
                            <label>Data</label>
                            <input type="date" name="eventDate" value={formData.eventDate} onChange={handleChange} required />
                        </div>
                        <div className={styles.group}>
                            <label>Hora</label>
                            <input type="time" name="eventTime" value={formData.eventTime} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className={styles.group}>
                        <label>Preço Inicial do Mandante (0.01 - 0.99)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="0.99"
                            name="homePrice"
                            value={formData.homePrice}
                            onChange={handleChange}
                            required
                        />
                        <small>Se Flamengo = R$ 0.60, então Vasco será R$ 0.40 automaticamente.</small>
                    </div>

                    <button type="submit" disabled={submitting} className={styles.submitBtn}>
                        {submitting ? 'Criando...' : '+ Criar Mercado'}
                    </button>
                </form>
            </div>
        </div>
    );
}
