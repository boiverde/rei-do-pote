import styles from './Skeleton.module.css';

export default function Skeleton({ width, height, className, style }) {
    return (
        <div
            className={`${styles.skeleton} ${className || ''}`}
            style={{ width, height, ...style }}
        />
    );
}
