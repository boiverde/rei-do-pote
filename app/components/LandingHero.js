"use client";
import Link from 'next/link';
import styles from './LandingHero.module.css';

export default function LandingHero() {
    return (
        <section className={styles.hero}>
            <h1 className={styles.title}>
                Rei do Pote - Fantasy Game <br />
                <span className={styles.TitleHighlight}>Onde seu palpite vale Ouro.</span>
            </h1>

            <p className={styles.subtitle}>
                O Fantasy Game definitivo. Monte sua estratégia, crie ligas, desafie seus amigos no X1 ou mostre que você entende tudo de futebol.
            </p>

            <div className={styles.ctaGroup}>
                <Link href="/login" className={styles.primaryBtn}>
                    Começar Agora
                </Link>
                <Link href="/ranking" className={styles.secondaryBtn}>
                    Ver Ranking Global
                </Link>
            </div>

            <div className={styles.featuresGrid}>
                <div className={styles.featureCard}>
                    <span className={styles.icon}>⚽</span>
                    <span className={styles.featureTitle}>Esportes Reais</span>
                    <p className={styles.featureDesc}>
                        Aposte no Brasileirão, Champions League, Premier League e muito mais com odds dinâmicas.
                    </p>
                </div>

                <div className={styles.featureCard}>
                    <span className={styles.icon}>⚔️</span>
                    <span className={styles.featureTitle}>Desafios X1</span>
                    <p className={styles.featureDesc}>
                        Crie desafos personalizados e aposte diretamente contra seus amigos. O vencedor leva tudo.
                    </p>
                </div>

                <div className={styles.featureCard}>
                    <span className={styles.icon}>💸</span>
                    <span className={styles.featureTitle}>Saque via PIX</span>
                    <p className={styles.featureDesc}>
                        Depósitos e saques instantâneos. Sem burocracia, o dinheiro cai na sua conta na hora.
                    </p>
                </div>
            </div>
        </section>
    );
}
