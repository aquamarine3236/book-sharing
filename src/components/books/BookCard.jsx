import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StarRating from '../ui/StarRating';
import { getGenreColor } from './GenreFilter';
import styles from './BookCard.module.css';

export default function BookCard({ book, index }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  
  // Deterministic tilt: alternates left/right based on index, with random magnitude based on title
  const tilt = useMemo(() => {
    let hash = 0;
    if (book.title) {
      for (let i = 0; i < book.title.length; i++) hash += book.title.charCodeAt(i);
    }
    const idx = typeof index === 'number' ? index : 0;
    
    // Magnitude between 1.5 and 3.5 degrees
    const magnitude = 1.5 + (hash % 3); 
    // Alternate direction: even index -> left, odd index -> right
    const sign = (idx % 2 === 0) ? -1 : 1;
    
    return sign * magnitude;
  }, [book.title, index]);

  const handleCardClick = (e) => {
    if (e.target.closest('summary')) return;
    navigate(`/books/${book.id}`);
  };

  return (
    <div className={styles.card} style={{ '--tilt': `${tilt}deg` }} onClick={handleCardClick} role="button" tabIndex={0}>
      <div className={styles.genreList}>
        {(book.genre || '').split(',').map((g) => {
          const gName = g.trim();
          if (!gName) return null;
          return (
            <span 
              key={gName} 
              className={styles.genre}
              style={{ color: 'var(--color-text-primary)', backgroundColor: getGenreColor(gName), boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
            >
              {gName}
            </span>
          );
        })}
      </div>
      
      <Link to={`/books/${book.id}`} className={styles.titleLink} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>{book.title}</h3>
      </Link>
      
      <details 
        className={styles.details} 
        onToggle={(e) => setIsOpen(e.target.open)}
      >
        <summary className={styles.summary}>{isOpen ? 'Ẩn mô tả' : 'Xem mô tả'}</summary>
        <div className={styles.descriptionContent}>
          <p className={styles.description}>
            {book.description || 'Chưa có mô tả.'}
          </p>
        </div>
      </details>

      <div className={styles.footer}>
        <div className={styles.rating}>
          <StarRating value={Math.round(book.avg_rating || 0)} readOnly size={16} />
          <span className={styles.ratingCount}>
            {book.avg_rating ? book.avg_rating.toFixed(1) : '—'}
            {book.review_count > 0 && ` (${book.review_count})`}
          </span>
        </div>
        <span className={styles.addedBy}>bởi {book.display_name}</span>
      </div>
    </div>
  );
}
