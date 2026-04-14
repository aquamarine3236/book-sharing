import { useState } from 'react';
import styles from './StarRating.module.css';

const STAR_POINTS = '12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26';

export default function StarRating({ value = 0, onChange, readOnly = false, size = 22 }) {
  const [hovered, setHovered] = useState(0);

  const active = hovered || value;

  return (
    <div
      className={`${styles.row} ${readOnly ? styles.readOnly : ''}`}
      onMouseLeave={() => !readOnly && setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={styles.star}
          style={{ cursor: readOnly ? 'default' : 'pointer' }}
          onMouseEnter={() => !readOnly && setHovered(n)}
          onClick={() => !readOnly && onChange && onChange(n)}
        >
          <polygon
            points={STAR_POINTS}
            fill={n <= active ? 'var(--color-star-filled)' : 'var(--color-star-empty)'}
            stroke={n <= active ? 'var(--color-accent-gold)' : 'var(--color-border)'}
            strokeWidth="1"
            className={n <= active ? styles.filled : ''}
          />
        </svg>
      ))}
      {!readOnly && value > 0 && (
        <span className={styles.label}>{value} / 5</span>
      )}
    </div>
  );
}
