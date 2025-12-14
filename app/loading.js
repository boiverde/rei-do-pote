import Skeleton from './components/Skeleton';
import styles from './page.module.css'; // Reuse generic grid styles if possible, or inline

export default function Loading() {
    return (
        <div className="container">
            <div style={{ padding: '80px 0 40px', textAlign: 'center' }}>
                <Skeleton width="60%" height="40px" style={{ marginBottom: '20px' }} />
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <Skeleton width="100px" height="30px" />
                    <Skeleton width="100px" height="30px" />
                    <Skeleton width="100px" height="30px" />
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px',
                padding: '20px 0'
            }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} height="180px" width="100%" />
                ))}
            </div>
        </div>
    );
}
