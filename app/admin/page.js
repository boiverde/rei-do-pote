"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../utils/supabase/client';
import styles from './page.module.css';
import { toast } from 'sonner';
import TableSkeleton from '../components/TableSkeleton';

export default function AdminPage() {
    const supabase = createClient();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [syncing, setSyncing] = useState(false); // Fix: Add missing state

    const [submitMessage, setSubmitMessage] = useState(null);

    // Withdrawal State
    const [withdrawals, setWithdrawals] = useState([]);
    const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);

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

    // 2. Fetch Pending Withdrawals
    useEffect(() => {
        if (isAuthorized) {
            fetchWithdrawals();
        }
    }, [isAuthorized]);

    const fetchWithdrawals = async () => {
        setLoadingWithdrawals(true);
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('type', 'withdraw')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching withdrawals:', error);
            toast.error('Erro ao buscar saques.');
        } else {
            setWithdrawals(data || []);
        }
        setLoadingWithdrawals(false);
    };

    const handleApproveWithdrawal = async (id, amount) => {
        if (!confirm(`Confirmar que você JÁ FEZ O PIX de R$ ${amount}?`)) return;

        try {
            const { error } = await supabase
                .from('transactions')
                .update({ status: 'completed' }) // 'completed' is often used for 'paid'
                .eq('id', id);

            if (error) throw error;

            toast.success('Saque marcado como concluído!');
            fetchWithdrawals(); // Refresh list
        } catch (err) {
            toast.error('Erro ao atualizar: ' + err.message);
        }
    };

    const handleRejectWithdrawal = async (id) => {
        // Ideally we would refund the balance here via RPC, lets assume we have a way or just mark failed for now.
        // For verified functionality, lets imply a refund rpc needs to exist OR we manual fix DB.
        // Lets just allow marking as 'failed' for now.
        if (!confirm(`Rejeitar saque? O saldo NÃO será estornado automaticamente (ainda).`)) return;

        try {
            const { error } = await supabase
                .from('transactions')
                .update({ status: 'failed' })
                .eq('id', id);

            if (error) throw error;

            toast.success('Saque rejeitado.');
            fetchWithdrawals();
        } catch (err) {
            toast.error('Erro ao rejeitar: ' + err.message);
        }
    };

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
            toast.error('Erro ao criar mercado: ' + error.message);
        } else {
            toast.success('Mercado criado com sucesso! 🚀');
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
                toast.success(`${data.message}`);
                console.log('Jogos:', data.games);
            } else {
                toast.error('Erro: ' + (data.error || data.message));
            }
        } catch (err) {
            toast.error('Erro de conexão.');
        } finally {
            setSyncing(false);
        }
    };

    const handleAutoResolve = async () => {
        if (!confirm('Isso vai verificar resultados oficiais e PAGAR os vencedores automaticamente. Tem certeza?')) return;
        setSyncing(true);
        try {
            const res = await fetch('/api/resolve-markets', { method: 'POST' });
            const data = await res.json();
            if (data.logs && data.logs.length > 0) {
                toast.success('Processamento concluído!');
                console.log('Relatório:', data.logs);
                // Maybe show logs in a modal or simpler way?
                // For now, logging to console is cleaner than a huge alert.
            } else {
                toast.info(data.message);
            }
        } catch (e) {
            toast.error('Erro crítico: ' + e.message);
        } finally {
            setSyncing(false);
        }
    };

    if (loading) return <div className={styles.loading}>Verificando permissões...</div>;

    if (!isAuthorized) {
        const handleDevPromote = async () => {
            if (!confirm('DEV ONLY: Promover seu usuário a Admin?')) return;
            try {
                const res = await fetch('/api/admin/dev-promote', { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                    toast.success('Promovido! Recarregando...');
                    window.location.reload();
                } else {
                    toast.error('Erro: ' + (data.error || 'Erro desconhecido'));
                    setDebugInfo(prev => ({ ...prev, apiError: data.error }));
                }
            } catch (e) {
                toast.error('Erro de conexão');
                setDebugInfo(prev => ({ ...prev, apiError: e.message }));
            }
        };

        return (
            <div className={styles.container} style={{ textAlign: 'center', marginTop: '50px' }}>
                <h1>⛔ Acesso Negado</h1>
                <p>Você não tem permissão de administrador.</p>

                {debugInfo && (
                    <div style={{ marginTop: '20px', padding: '10px', background: '#330000', color: '#ffaaaa', borderRadius: '5px', textAlign: 'left', display: 'inline-block' }}>
                        <strong>Debug Info:</strong>
                        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                    </div>
                )}

                <div style={{ marginTop: '20px' }}>
                    <button
                        onClick={handleDevPromote}
                        style={{
                            padding: '10px 20px',
                            background: '#333',
                            color: '#fbbf24',
                            border: '1px solid #fbbf24',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        🛠️ DEV: Promover a Admin
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Painel Admin 👮‍♂️</h1>
                <div>
                    <button onClick={handleSync} disabled={syncing} className={styles.syncBtn}>
                        {syncing ? '...' : '🔄 Buscar Jogos'}
                    </button>
                    <button
                        onClick={handleAutoResolve}
                        disabled={syncing}
                        style={{
                            marginLeft: '10px',
                            backgroundColor: '#22c55e',
                            color: '#000',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        💰 Pagar Vencedores (Auto)
                    </button>
                </div>
            </div>

            <div className={styles.card}>
                <h2>Solicitações de Saque Pendentes</h2>
                {loadingWithdrawals ? (
                    <TableSkeleton rows={3} />
                ) : withdrawals.length === 0 ? (
                    <p>Nenhuma solicitação pendente.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #333' }}>
                                <th style={{ padding: '8px' }}>Data</th>
                                <th style={{ padding: '8px' }}>Valor</th>
                                <th style={{ padding: '8px' }}>Chave PIX</th>
                                <th style={{ padding: '8px' }}>Status</th>
                                <th style={{ padding: '8px' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {withdrawals.map((w) => (
                                <tr key={w.id} style={{ borderBottom: '1px solid #222' }}>
                                    <td style={{ padding: '8px' }}>{new Date(w.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '8px', color: '#ef4444', fontWeight: 'bold' }}>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(w.amount)}
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        {/* Metadata stored in JSONB, handle safe access */}
                                        {w.metadata?.pix_key_type}: {w.metadata?.pix_key}
                                    </td>
                                    <td style={{ padding: '8px' }}>{w.status}</td>
                                    <td style={{ padding: '8px' }}>
                                        <button
                                            onClick={() => handleApproveWithdrawal(w.id, w.amount)}
                                            style={{ background: '#22c55e', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}
                                        >
                                            ✅ Pagar
                                        </button>
                                        <button
                                            onClick={() => handleRejectWithdrawal(w.id)}
                                            style={{ background: '#ef4444', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            ❌
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
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
