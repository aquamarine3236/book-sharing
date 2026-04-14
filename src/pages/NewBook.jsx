import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { GENRES } from '../components/books/GenreFilter';
import styles from './NewBook.module.css';

const GENRE_OPTIONS = GENRES;

export default function NewBook() {
  const { user, getDisplayName } = useAuth();
  const navigate  = useNavigate();
  const [title,         setTitle]         = useState('');
  const [genres,        setGenres]        = useState([]);
  const [customGenre,   setCustomGenre]   = useState('');
  const [desc,    setDesc]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Vui lòng nhập tên sách.'); return; }
    
    let finalGenres = genres.filter(g => g !== 'Khác');
    if (genres.includes('Khác') && customGenre.trim()) {
       finalGenres.push(customGenre.trim());
    }
    if (finalGenres.length === 0) { setError('Vui lòng chọn ít nhất một thể loại.'); return; }
    
    if (!desc.trim())  { setError('Vui lòng nhập nội dung mô tả.'); return; }

    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('books')
        .insert({
          title:        title.trim(),
          genre:        finalGenres.join(', '),
          description:  desc.trim(),
          user_id:      user.id,
          display_name: getDisplayName(),
          avg_rating:   0,
          review_count: 0,
        })
        .select()
        .single();

      if (err) throw err;
      navigate(`/books/${data.id}`);
    } catch (err) {
      setError('Đã xảy ra lỗi: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Đăng Tải Sách</h1>
          <p className={styles.sub}>Chia sẻ một cuốn sách hay đến với cộng đồng</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Tên Sách</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên cuốn sách..."
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Thể Loại (Có thể chọn nhiều)</label>
            <div className={styles.genreGrid}>
              {GENRE_OPTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`${styles.genrePill} ${genres.includes(g) ? styles.active : ''}`}
                  onClick={() => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])}
                >
                  {g}
                </button>
              ))}
            </div>
            {genres.includes('Khác') && (
              <input
                style={{ marginTop: '8px' }}
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                placeholder="Nhập thể loại khác..."
              />
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Nội Dung Mở Rộng / Đánh Giá</label>
            <textarea
              rows={6}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Nội dung, cảm nhận, lý do bạn muốn chia sẻ cuốn sách này..."
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.btnSecondary} onClick={() => navigate(-1)}>
              Hủy bỏ
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Đang lưu...' : 'Tải Sách Lên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
