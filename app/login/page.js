"use client";
import { useState } from 'react';
import { createClient } from '../utils/supabase/client';
import styles from './login.module.css';
import { useRouter } from 'next/navigation';

export default function Login() {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleGoogleLogin = async (e) => {
        e.preventDefault();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) alert(error.message);
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Entrar no Rei do Pote</h1>
                <p className={styles.subtitle}>Faça login para começar a operar.</p>

                <div className={styles.actions}>
                    <button onClick={handleGoogleLogin} disabled={loading} className={styles.googleButton}>
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="24" height="24" />
                        Continuar com Google
                    </button>
                </div>
            </div>
        </div>
    );
}
