"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BottomNav.module.css';

export default function BottomNav() {
    const pathname = usePathname();

    const isActive = (path) => pathname === path;

    return (
        <nav className={styles.bottomNav}>
            <Link href="/" className={`${styles.navItem} ${isActive('/') ? styles.active : ''}`}>
                <span className={styles.icon}>🏠</span>
                <span className={styles.label}>Início</span>
            </Link>

            <Link href="/ranking" className={`${styles.navItem} ${isActive('/ranking') ? styles.active : ''}`}>
                <span className={styles.icon}>🏆</span>
                <span className={styles.label}>Ranking</span>
            </Link>

            {/* Main Action Button (Deposit? Or Live?) */}
            <Link href="/deposit" className={`${styles.navItem} ${styles.mainAction}`}>
                <div className={styles.fab}>
                    <span>💰</span>
                </div>
            </Link>



            <Link href="/portfolio" className={`${styles.navItem} ${isActive('/portfolio') ? styles.active : ''}`}>
                <span className={styles.icon}>👤</span>
                <span className={styles.label}>Perfil</span>
            </Link>
        </nav>
    );
}
