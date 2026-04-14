import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import StarRating from '../components/ui/StarRating';
import ReviewForm from '../components/books/ReviewForm';
import FadeInSection from '../components/ui/FadeInSection';
import styles from './BookDetail.module.css';

export default function BookDetail() {
  const { id }   = useParams();
  const { user, getDisplayName } = useAuth();
  const navigate = useNavigate();

  const [book,       setBook]       = useState(null);
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm,   setShowForm]   = useState(false);

  const myReview = reviews.find((r) => r.user_id === user?.id);
  const isOwner  = book?.user_id === user?.id;

  useEffect(() => {
    const loadBook = async () => {
      const { data } = await supabase.from('books').select('*').eq('id', id).single();
      setBook(data);
      setLoading(false);
    };
    loadBook();
  }, [id]);

  useEffect(() => {
    const loadReviews = async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('book_id', id)
        .order('created_at', { ascending: false });
      setReviews(data || []);
    };
    loadReviews();

    const channel = supabase
      .channel(`reviews-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `book_id=eq.${id}` }, loadReviews)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id]);

  const handleReview = async ({ rating, comment }) => {
    setSubmitting(true);
    try {
      // Upsert review (unique constraint on book_id + user_id)
      const { error: revErr } = await supabase.from('reviews').upsert({
        book_id:      id,
        user_id:      user.id,
        display_name: getDisplayName(),
        rating,
        comment,
        updated_at:   new Date().toISOString(),
        ...(myReview ? {} : { created_at: new Date().toISOString() }),
      }, { onConflict: 'book_id,user_id' });

      if (revErr) throw revErr;

      // Recalculate avg_rating and review_count
      const { data: allReviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('book_id', id);

      const ratings = allReviews.map((r) => r.rating);
      const avg     = ratings.reduce((a, b) => a + b, 0) / ratings.length;

      await supabase.from('books').update({
        avg_rating:   Math.round(avg * 10) / 10,
        review_count: ratings.length,
      }).eq('id', id);

      setBook((b) => ({ ...b, avg_rating: Math.round(avg * 10) / 10, review_count: ratings.length }));
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>Đang tải...</div>;
  if (!book)   return <div className={styles.loading}>Không tìm thấy sách.</div>;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <FadeInSection>
          <div className={styles.bookHeader}>
            <span className={styles.genre}>{book.genre}</span>
            <h1 className={styles.title}>{book.title}</h1>
            <div className={styles.meta}>
              <StarRating value={Math.round(book.avg_rating || 0)} readOnly size={20} />
              <span className={styles.ratingText}>
                {book.avg_rating ? book.avg_rating.toFixed(1) : 'Chưa có đánh giá'}
                {book.review_count > 0 && ` — ${book.review_count} đánh giá`}
              </span>
            </div>
            <p className={styles.addedBy}>Thêm bởi {book.display_name}</p>
            <p className={styles.description}>{book.description}</p>
          </div>
        </FadeInSection>

        <FadeInSection delay={100}>
          <div className={styles.reviewSection}>
            <div className={styles.reviewHeader}>
              <h2 className={styles.reviewTitle}>Đánh giá</h2>
              {!isOwner && (
                <button className={styles.editBtn} onClick={() => setShowForm((v) => !v)}>
                  {showForm ? 'Hủy' : myReview ? 'Sửa đánh giá' : 'Viết đánh giá'}
                </button>
              )}
              {isOwner && (
                <span className={styles.ownerNote}>Bạn không thể đánh giá sách của chính mình</span>
              )}
            </div>

            {showForm && !isOwner && (
              <div className={styles.formWrapper}>
                <ReviewForm
                  existingReview={myReview}
                  onSubmit={handleReview}
                  loading={submitting}
                />
              </div>
            )}

            {reviews.length === 0 ? (
              <p className={styles.noReviews}>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
            ) : (
              <div className={styles.reviewList}>
                {reviews.map((r) => (
                  <div key={r.id} className={`${styles.reviewItem} ${r.user_id === user?.id ? styles.mine : ''}`}>
                    <div className={styles.reviewTop}>
                      <span className={styles.reviewer}>{r.display_name}</span>
                      <StarRating value={r.rating} readOnly size={15} />
                    </div>
                    <p className={styles.comment}>{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeInSection>

        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          Quay lại
        </button>
      </div>
    </div>
  );
}
