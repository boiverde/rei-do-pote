"use client";
import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
import styles from './page.module.css';
import { toast } from 'sonner';
import { validateCPF, formatCPF } from '../utils/cpf';

export default function ProfilePage() {
    const supabase = createClient();
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        cpf: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isCpfLocked, setIsCpfLocked] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            setUser(session.user);

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, username, cpf')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                setFormData({
                    full_name: profile.full_name || '',
                    username: profile.username || '',
                    cpf: profile.cpf ? formatCPF(profile.cpf) : ''
                });
                if (profile.cpf) setIsCpfLocked(true);
            }
            setLoading(false);
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'cpf') {
            setFormData(prev => ({ ...prev, [name]: formatCPF(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Frontend Validations
        if (formData.username.length < 3) {
            toast.error('Nome de usuário deve ter no mínimo 3 caracteres.');
            return;
        }

        const rawCPF = formData.cpf.replace(/\D/g, '');
        if (!isCpfLocked && rawCPF.length > 0) {
            if (!validateCPF(rawCPF)) {
                toast.error('CPF inválido.');
                return;
            }
        }

        setSaving(true);
        try {
            const { data, error } = await supabase.rpc('update_profile_secure', {
                p_username: formData.username,
                p_full_name: formData.full_name,
                p_cpf: isCpfLocked ? null : rawCPF // Send null if locked to avoid redundant check, logic handles keep
            });

            // Note: The RPC logic uses COALESCE. If we send NULL, it keeps old.
            // But if we are sending the SAME value, it might pass.
            // Let's send the rawCPF regardless, the RPC handles the "no change allowed" check.
            // Retrying logic:
            const { error: rpcError } = await supabase.rpc('update_profile_secure', {
                p_username: formData.username,
                p_full_name: formData.full_name,
                p_cpf: rawCPF
            });

            if (rpcError) throw rpcError;

            toast.success('Perfil atualizado com sucesso!');
            if (rawCPF) setIsCpfLocked(true);

        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className={styles.container}>Carregando...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1>Meu Perfil 👤</h1>
                <p>Mantenha seus dados atualizados para garantir a segurança da sua conta.</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.group}>
                        <label>Email</label>
                        <input type="text" value={user?.email} disabled className={styles.inputDisabled} />
                    </div>

                    <div className={styles.group}>
                        <label>Nome Completo</label>
                        <input
                            name="full_name"
                            type="text"
                            value={formData.full_name}
                            onChange={handleChange}
                            placeholder="Ex: João da Silva"
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.group}>
                        <label>Nome de Usuário (@)</label>
                        <input
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Ex: joao123"
                            className={styles.input}
                        />
                        <span className={styles.hint}>Será usado para identificar você nos desafios.</span>
                    </div>

                    <div className={styles.group}>
                        <label>CPF {isCpfLocked && <span className={styles.lockedBadge}>🔒 Validado</span>}</label>
                        <input
                            name="cpf"
                            type="text"
                            value={formData.cpf}
                            onChange={handleChange}
                            placeholder="000.000.000-00"
                            className={`${styles.input} ${isCpfLocked ? styles.inputLocked : ''}`}
                            disabled={isCpfLocked}
                        />
                        {isCpfLocked && <span className={styles.warning}>O CPF não pode ser alterado por segurança.</span>}
                    </div>

                    <button type="submit" className={styles.btn} disabled={saving}>
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </form>
            </div>
        </div>
    );
}
