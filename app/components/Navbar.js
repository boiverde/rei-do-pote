"use client";
import Image from 'next/image';
import styles from './Navbar.module.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Navbar() {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // Fetch Profile (Balance + Admin)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_admin, balance')
                    .eq('id', session.user.id)
                    .single();

                setUser({ ...session.user, balance: profile?.balance || 0 });
                setIsAdmin(profile?.is_admin || false);
            } else {
                setUser(null);
            }
        };

        checkUser();

        // Listen for Auth Changes
        const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            checkUser();
        });

        // Listen for Realtime Balance Changes
        let profileSub = null;
        if (typeof window !== 'undefined') { // Safety check
            profileSub = supabase
                .channel('balance-changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'profiles',
                        // We can't filter by user.id easily in the channel definition if user isn't set yet,
                        // so we might need to filter inside the callback OR re-subscribe when user changes.
                        // Simpler approach: Subscribe globally but filter in callback.
                    },
                    (payload) => {
                        setUser(prev => {
                            if (prev && payload.new.id === prev.id) {
                                return { ...prev, balance: payload.new.balance };
                            }
                            return prev;
                        });
                    }
                )
                .subscribe();
        }

        return () => {
            authSub.unsubscribe();
            if (profileSub) supabase.removeChannel(profileSub);
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    return (
        <nav className={styles.navbar}>
            <div className={`container ${styles.container}`}>
                <div className={styles.logo}>
                    <Link href="/" className={styles.logoLink}>
                        <img src="/logo.png" alt="Rei do Pote" className={styles.logoImage} />
                        <span className={styles.logoText}>Rei do Pote</span>
                    </Link>
                </div>

                <div className={styles.links}>
                    <Link href="/" className={styles.link}>Mercados</Link>
                    <Link href="/portfolio" className={styles.link}>Carteira</Link>
                    <Link href="/challenges" className={styles.link}>Desafios X1 <span style={{ fontSize: '10px', verticalAlign: 'top' }}>🔥</span></Link>
                    {isAdmin && (
                        <Link href="/admin" className={`${styles.link} ${styles.adminLink}`}>
                            Admin
                        </Link>
                    )}
                </div>

                <div className={styles.actions}>
                    {user ? (
                        <>
                            <div className={styles.balance}>
                                <span className={styles.balanceLabel}>Saldo</span>
                                <span className={styles.balanceValue}>R$ {user.balance?.toFixed(2).replace('.', ',') || '0,00'}</span>
                                <Link href="/deposit" className={styles.depositLink} title="Depositar">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                                </Link>
                            </div>
                            <div className={styles.profile}>
                                {user.user_metadata?.avatar_url && (
                                    <img
                                        src={user.user_metadata.avatar_url}
                                        alt="Avatar"
                                        className={styles.avatar}
                                    />
                                )}
                                <button onClick={handleLogout} className={styles.logoutButton} title="Sair">
                                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                        <polyline points="16 17 21 12 16 7"></polyline>
                                        <line x1="21" y1="12" x2="9" y2="12"></line>
                                    </svg>
                                </button>
                            </div>
                        </>
                    ) : (
                        <Link href="/login">
                            <button className="btn btn-primary">Entrar</button>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
