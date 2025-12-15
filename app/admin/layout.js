"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }) {
    const pathname = usePathname();

    const isActive = (path) => pathname === path;

    return (
        <div style={{ padding: '24px' }}>
            <div style={{
                marginBottom: '24px',
                display: 'flex',
                gap: '16px',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '16px'
            }}>
                <Link
                    href="/admin"
                    style={{
                        color: isActive('/admin') ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: isActive('/admin') ? 'bold' : 'normal'
                    }}
                >
                    Dashboard
                </Link>
                <Link
                    href="/admin/users"
                    style={{
                        color: isActive('/admin/users') ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: isActive('/admin/users') ? 'bold' : 'normal'
                    }}
                >
                    Usuários
                </Link>
            </div>
            {children}
        </div>
    );
}
