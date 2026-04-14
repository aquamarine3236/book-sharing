import BookCard from './BookCard';
import FadeInSection from '../ui/FadeInSection';
import styles from './BookGrid.module.css';

export default function BookGrid({ books }) {
  if (!books.length) {
    return (
      <div className={styles.empty}>
        <p>Chưa có sách nào trong bộ sưu tập.</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {books.map((book, i) => (
        <FadeInSection key={book.id} delay={i * 60}>
          <BookCard book={book} index={i} />
        </FadeInSection>
      ))}
    </div>
  );
}
