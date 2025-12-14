import Skeleton from './Skeleton';

export default function MarketsSkeleton() {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px',
            width: '100%'
        }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} height="180px" width="100%" />
            ))}
        </div>
    );
}
