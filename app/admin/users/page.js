"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '../../utils/supabase/client';
import { toast } from 'sonner';
import styles from '../page.module.css'; // Reusing admin styles
import TableSkeleton from '../../components/TableSkeleton';

export default function UsersAdmin() {
    const supabase = createClient();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    async function checkAuth() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // Not logged in
                return;
            }

            // Check Admin Role
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', session.user.id)
                .single();

            if (!profile?.is_admin) {
                toast.error('Acesso negado.');
                return; // Stop here, dont fetch users
            }

            // Only fetch if admin
            fetchUsers(session.access_token);
        } catch (error) {
            console.error(error);
        }
    }

    async function fetchUsers(token) {
        try {
            const res = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.status === 403) throw new Error('Acesso negado (403)');

            if (!res.ok) {
                // Try to parse server error
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Erro Servidor (${res.status})`);
            }

            const data = await res.json();
            setUsers(data || []);
        } catch (error) {
            console.error(error);
            toast.error('Erro: ' + error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Gestão de Usuários</h1>
                <span className={styles.badge}>{users.length} Total</span>
            </div>

            {loading ? (
                <TableSkeleton rows={8} />
            ) : (
                <div className={styles.card}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '12px' }}>Usuário</th>
                                <th style={{ padding: '12px' }}>Email (ID)</th>
                                <th style={{ padding: '12px' }}>CPF</th>
                                <th style={{ padding: '12px' }}>Saldo</th>
                                <th style={{ padding: '12px' }}>Cadastro</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {user.avatar_url ? (
                                                <Image src={user.avatar_url} alt="User" width={24} height={24} style={{ borderRadius: '50%' }} />
                                            ) : (
                                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#333' }} />
                                            )}
                                            {user.username || user.full_name || 'Sem nome'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                                        {user.id.substring(0, 8)}...
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {user.cpf || <span style={{ color: 'var(--text-muted)' }}>Não verificado</span>}
                                    </td>
                                    <td style={{ padding: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>
                                        R$ {user.balance?.toFixed(2)}
                                    </td>
                                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                                        {user.created_at
                                            ? new Date(user.created_at).toLocaleDateString('pt-BR')
                                            : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
