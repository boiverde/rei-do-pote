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
            setUser(session?.user ?? null);

            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', session.user.id)
                    .single();
                setIsAdmin(profile?.is_admin || false);
            }
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', session.user.id)
                    .single();
                setIsAdmin(profile?.is_admin || false);
            } else {
                setIsAdmin(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    return (
        <nav className={styles.navbar}>
            <div className={`container ${styles.container}`}>
                <div className={styles.logo}>
                    <Link href="/">
                        <Image
                            src="/logo.png"
                            alt="BolaObr Logo"
                            width={220}
                            height={60}
                            className={styles.logoImage}
                            priority
                        />
                    </Link>
                </div>

                <div className={styles.links}>
                    <Link href="/" className={styles.link}>Mercados</Link>
                    <Link href="/portfolio" className={styles.link}>Carteira</Link>
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
                                <span className={styles.balanceValue}>R$ 1.000,00</span>
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
