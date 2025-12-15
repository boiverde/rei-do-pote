"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import styles from './page.module.css';

export default function InvitePage() {
    const [referralCode, setReferralCode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ referred_count: 0, earnings: 0 });

    const fetchReferralData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Get Code
            const { data: profile } = await supabase
                .from('profiles')
                .select('referral_code')
                .eq('id', user.id)
                .single();

            if (profile) setReferralCode(profile.referral_code);

            // Get Stats (Bonus: Count how many people used my code)
            // Note: This requires a policy or an index on 'referred_by'
            const { count } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('referred_by', profile?.referral_code);

            setStats({ referred_count: count || 0, earnings: (count || 0) * 5 }); // Example: R$ 5 per invite
        }
        setLoading(false);
    };

    const handleCopy = () => {
        const link = `${window.location.origin}/login?ref=${referralCode}`;
        navigator.clipboard.writeText(link);
        alert('Link copiado!');
    };

    if (loading) return <div className={styles.container}>Carregando...</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Convide & Ganhe 🚀</h1>

            <div className={styles.card}>
                <p>Convide amigos e ganhe <strong>R$ 5,00</strong> por cada cadastro verificado!</p>

                <div className={styles.codeBox}>
                    <span>Seu Código:</span>
                    <strong className={styles.code}>{referralCode || '----'}</strong>
                </div>

                <div className={styles.stats}>
                    <div className={styles.statItem}>
                        <h3>{stats.referred_count}</h3>
                        <span>Amigos</span>
                    </div>
                    <div className={styles.statItem} style={{ color: '#22c55e' }}>
                        <h3>R$ {stats.earnings},00</h3>
                        <span>Ganhos Est.</span>
                    </div>
                </div>

                <button onClick={handleCopy} className={styles.button}>
                    🔗 Copiar Link de Convite
                </button>

                <p className={styles.disclaimer}>
                    * O bônus é creditado quando o amigo faz o primeiro depósito.
                </p>
            </div>
        </div>
    );
}
