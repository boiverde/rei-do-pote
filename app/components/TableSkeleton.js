import Skeleton from './Skeleton';

export default function TableSkeleton({ rows = 5 }) {
    return (
        <div style={{
            width: '100%',
            background: 'var(--card-bg)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            padding: '24px'
        }}>
            {/* Header Skeleton */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                <Skeleton width="20%" height="20px" />
                <Skeleton width="30%" height="20px" />
                <Skeleton width="15%" height="20px" />
                <Skeleton width="15%" height="20px" />
                <Skeleton width="20%" height="20px" />
            </div>

            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
                    <Skeleton width="20%" height="24px" />
                    <Skeleton width="30%" height="16px" />
                    <Skeleton width="15%" height="16px" />
                    <Skeleton width="15%" height="24px" />
                    <Skeleton width="20%" height="16px" />
                </div>
            ))}
        </div>
    );
}
