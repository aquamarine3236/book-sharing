import { useState } from 'react';
import { supabase } from '../../supabase';
import styles from './DeleteBookModal.module.css';

export default function DeleteBookModal({ book, isOpen, onClose, onSuccess }) {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !book) return null;

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await supabase.from('reviews').delete().eq('book_id', book.id);
      await supabase.from('books').delete().eq('id', book.id);
      onSuccess(book.id);
    } catch (err) {
      alert('Xóa thất bại: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3 className={styles.modalTitle}>Xác Nhận Xóa</h3>
        <p className={styles.modalText}>
          Bạn có chắc chắn muốn xóa cuốn sách <strong>"{book.title}"</strong> không? Hành động này sẽ xóa toàn bộ nội dung sách và các đánh giá liên quan, không thể hoàn tác.
        </p>
        <div className={styles.modalActions}>
          <button className={styles.btnCancel} onClick={onClose} disabled={deleting}>Hủy</button>
          <button className={styles.btnConfirmDelete} onClick={confirmDelete} disabled={deleting}>
            {deleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
          </button>
        </div>
      </div>
    </div>
  );
}
