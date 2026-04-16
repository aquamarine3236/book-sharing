import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import StarRating from '../components/ui/StarRating';
import { getGenreColor } from '../components/books/GenreFilter';
import EditBookModal from '../components/books/EditBookModal';
import DeleteBookModal from '../components/books/DeleteBookModal';
import styles from './Profile.module.css';

export default function Profile() {
  const { user, getDisplayName } = useAuth();
  const [tab, setTab] = useState('books');
  const [myBooks, setMyBooks] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingBook, setEditingBook] = useState(null);
  const [deletingBook, setDeletingBook] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('books').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setMyBooks(data || []); setLoading(false); });
  }, [user]);

  useEffect(() => {
    if (tab !== 'reviews' || !user) return;
    supabase
      .from('reviews')
      .select('*, books(title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setMyReviews(data || []));
  }, [tab, user]);

  const handleEditSuccess = (updatedBook) => {
    setMyBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
    setEditingBook(null);
  };

  const handleDeleteSuccess = (deletedBookId) => {
    setMyBooks(prev => prev.filter(b => b.id !== deletedBookId));
    setDeletingBook(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Hồ Sơ Của Tôi</h1>
          <p className={styles.sub}>{getDisplayName()} — @{user?.user_metadata?.username}</p>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'books' ? styles.activeTab : ''}`}
            onClick={() => setTab('books')}
          >
            Sách của tôi ({myBooks.length})
          </button>
          <button
            className={`${styles.tab} ${tab === 'reviews' ? styles.activeTab : ''}`}
            onClick={() => setTab('reviews')}
          >
            Đánh giá của tôi
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>Đang tải...</div>
        ) : tab === 'books' ? (
          <div className={styles.bookList}>
            {myBooks.length === 0 && <p className={styles.empty}>Bạn chưa thêm cuốn sách nào.</p>}
            {myBooks.map((book) => (
              <div key={book.id} className={styles.bookItem}>
                <div className={styles.bookInfo}>
                  <Link to={`/books/${book.id}`} className={styles.bookTitle}>{book.title}</Link>
                  <div className={styles.genreList}>
                    {(book.genre || '').split(',').map((g) => {
                      const gName = g.trim();
                      if (!gName) return null;
                      return (
                        <span
                          key={gName}
                          className={styles.bookGenre}
                          style={{ color: 'var(--color-text-primary)', backgroundColor: getGenreColor(gName) }}
                        >
                          {gName}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className={styles.itemActions}>
                  <button className={styles.btnEdit} onClick={() => setEditingBook(book)}>Sửa</button>
                  <button className={styles.btnDelete} onClick={() => setDeletingBook(book)}>Xóa</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.reviewList}>
            {myReviews.length === 0 && <p className={styles.empty}>Bạn chưa viết đánh giá nào.</p>}
            {myReviews.map((r) => (
              <div key={r.id} className={styles.reviewItem}>
                <Link to={`/books/${r.book_id}`} className={styles.reviewBookTitle}>
                  {r.books?.title || 'Sách không xác định'}
                </Link>
                <StarRating value={r.rating} readOnly size={16} />
                <p className={styles.reviewComment}>{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <EditBookModal 
        book={editingBook} 
        isOpen={!!editingBook} 
        onClose={() => setEditingBook(null)}
        onSuccess={handleEditSuccess}
      />
      <DeleteBookModal 
        book={deletingBook}
        isOpen={!!deletingBook}
        onClose={() => setDeletingBook(null)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
