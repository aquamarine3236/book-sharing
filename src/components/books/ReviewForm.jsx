import { useState } from 'react';
import StarRating from '../ui/StarRating';
import styles from './ReviewForm.module.css';

export default function ReviewForm({ existingReview, onSubmit, loading }) {
  const [rating,  setRating]  = useState(existingReview?.rating  || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating)         { setError('Vui lòng chọn số sao.'); return; }
    if (!comment.trim()) { setError('Vui lòng viết bình luận.'); return; }
    setError('');
    await onSubmit({ rating, comment: comment.trim() });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.heading}>
        {existingReview ? 'Sửa đánh giá' : 'Viết đánh giá'}
      </h3>

      <div className={styles.field}>
        <label className={styles.label}>Xếp hạng</label>
        <StarRating value={rating} onChange={setRating} size={28} />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Bình luận</label>
        <textarea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Suy nghĩ của bạn về cuốn sách này..."
          className={styles.textarea}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.btn} type="submit" disabled={loading}>
        {loading ? 'Đang lưu...' : existingReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
      </button>
    </form>
  );
}
