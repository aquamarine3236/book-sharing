import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import StarRating from '../components/ui/StarRating';
import { GENRES, getGenreColor } from '../components/books/GenreFilter';
import styles from './Profile.module.css';

const GENRE_OPTIONS = GENRES;

export default function Profile() {
  const { user, getDisplayName } = useAuth();
  const [tab,      setTab]      = useState('books');
  const [myBooks,  setMyBooks]  = useState([]);
  const [myReviews,setMyReviews]= useState([]);
  const [loading,  setLoading]  = useState(true);

  const [editingBook, setEditingBook] = useState(null);
  const [editTitle,   setEditTitle]   = useState('');
  const [editGenres,  setEditGenres]  = useState([]);
  const [editCustomGenre, setEditCustomGenre] = useState('');
  const [editDesc,    setEditDesc]    = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

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

  const startEdit = (book) => {
    setEditingBook(book.id);
    setEditTitle(book.title);
    
    const genresArray = (book.genre || '').split(',').map(g => g.trim()).filter(Boolean);
    const predefined = [];
    const custom = [];
    genresArray.forEach(g => {
      if (GENRE_OPTIONS.includes(g) && g !== 'Khác') {
        predefined.push(g);
      } else {
        custom.push(g);
      }
    });

    let currentGenres = [...predefined];
    if (custom.length > 0) {
      currentGenres.push('Khác');
      setEditCustomGenre(custom.join(', '));
    } else {
      setEditCustomGenre('');
    }
    
    setEditGenres(currentGenres);
    setEditDesc(book.description);
  };

  const saveEdit = async () => {
    let finalGenres = editGenres.filter(g => g !== 'Khác');
    if (editGenres.includes('Khác') && editCustomGenre.trim()) {
       finalGenres.push(editCustomGenre.trim());
    }
    const finalGenreString = finalGenres.join(', ');

    await supabase.from('books').update({
      title:       editTitle.trim(),
      genre:       finalGenreString,
      description: editDesc.trim(),
    }).eq('id', editingBook);

    setMyBooks((prev) => prev.map((b) =>
      b.id === editingBook
        ? { ...b, title: editTitle.trim(), genre: finalGenreString, description: editDesc.trim() }
        : b
    ));
    setEditingBook(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Delete reviews first, then book
      await supabase.from('reviews').delete().eq('book_id', deleteTarget);
      await supabase.from('books').delete().eq('id', deleteTarget);
      setMyBooks((prev) => prev.filter((b) => b.id !== deleteTarget));
    } finally {
      setDeleteTarget(null);
      setDeleting(false);
    }
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
                {editingBook === book.id ? (
                  <div className={styles.editForm}>
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                    <div>
                      <div className={styles.genreGrid}>
                        {GENRE_OPTIONS.map((g) => (
                          <button
                            key={g}
                            type="button"
                            className={`${styles.genrePill} ${editGenres.includes(g) ? styles.active : ''}`}
                            onClick={() => setEditGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                      {editGenres.includes('Khác') && (
                        <input
                          style={{ marginTop: '8px' }}
                          value={editCustomGenre}
                          onChange={(e) => setEditCustomGenre(e.target.value)}
                          placeholder="Nhập thể loại khác..."
                        />
                      )}
                    </div>
                    <textarea rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                    <div className={styles.editActions}>
                      <button className={styles.btnSave} onClick={saveEdit}>Lưu</button>
                      <button className={styles.btnCancel} onClick={() => setEditingBook(null)}>Hủy</button>
                    </div>
                  </div>
                ) : (
                  <>
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
                      <button className={styles.btnEdit} onClick={() => startEdit(book)}>Sửa</button>
                      <button className={styles.btnDelete} onClick={() => setDeleteTarget(book.id)}>Xóa</button>
                    </div>
                  </>
                )}
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

      {deleteTarget && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Xác Nhận Xóa</h3>
            <p className={styles.modalText}>
              Xóa cuốn sách này sẽ đồng thời xóa tất cả đánh giá liên quan. Hành động này không thể hoàn tác.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => setDeleteTarget(null)}>Hủy</button>
              <button className={styles.btnConfirmDelete} onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
