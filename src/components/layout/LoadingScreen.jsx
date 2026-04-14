import styles from './LoadingScreen.module.css';

export default function LoadingScreen() {
  return (
    <div className={styles.container}>
      <div className={styles.symbol}>
        <svg viewBox="0 0 60 60" width="60" height="60">
          <polygon
            points="30,5 36,22 54,22 40,33 45,50 30,39 15,50 20,33 6,22 24,22"
            fill="none"
            stroke="var(--color-accent-gold)"
            strokeWidth="1.5"
            className={styles.star}
          />
        </svg>
      </div>
      <p className={styles.text}>Đang mở thế giới sách</p>
    </div>
  );
}
