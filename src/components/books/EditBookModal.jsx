import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import { GENRES } from './GenreFilter';
import styles from './EditBookModal.module.css';

const GENRE_OPTIONS = GENRES;

export default function EditBookModal({ book, isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  
  const [editTitle, setEditTitle] = useState('');
  const [editGenres, setEditGenres] = useState([]);
  const [editCustomGenre, setEditCustomGenre] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editBookFile, setEditBookFile] = useState(null);
  const [currentFileName, setCurrentFileName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && book) {
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
      setEditBookFile(null);
      setCurrentFileName(book.file_name || '');
    }
  }, [isOpen, book]);

  if (!isOpen || !book) return null;

  const saveEdit = async () => {
    setSaving(true);
    try {
      let finalGenres = editGenres.filter(g => g !== 'Khác');
      if (editGenres.includes('Khác') && editCustomGenre.trim()) {
        finalGenres.push(editCustomGenre.trim());
      }
      const finalGenreString = finalGenres.join(', ');

      let new_file_url = undefined;
      let new_file_name = undefined;

      if (editBookFile) {
        const ts = Date.now();
        const uid = user.id;
        const sanitizeFileName = (name) => {
          return name
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9.\-_]/g, '_')
            .toLowerCase();
        };
        const safeFileName = sanitizeFileName(editBookFile.name);
        const path = `${uid}/${ts}_${safeFileName}`;

        const { error: uploadError } = await supabase.storage.from('books').upload(path, editBookFile, { upsert: true });
        if (uploadError) {
          alert('Tải file thất bại: ' + uploadError.message);
          setSaving(false);
          return;
        }

        const { data: urlData } = supabase.storage.from('books').getPublicUrl(path);
        new_file_url = urlData.publicUrl;
        new_file_name = editBookFile.name;
      }

      const updateData = {
        title: editTitle.trim(),
        genre: finalGenreString,
        description: editDesc.trim(),
      };

      if (new_file_url !== undefined) {
        updateData.file_url = new_file_url;
        updateData.file_name = new_file_name;
      }

      await supabase.from('books').update(updateData).eq('id', book.id);

      onSuccess({ ...book, ...updateData });
    } catch (err) {
      alert('Lưu thất bại: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3 className={styles.modalTitle}>Sửa Thông Tin Sách</h3>
        
        <div className={styles.editForm}>
          <div className={styles.field}>
            <label className={styles.label}>Tên Sách</label>
            <input className={styles.input} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Thể Loại</label>
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
                className={styles.input}
                style={{ marginTop: '8px' }}
                value={editCustomGenre}
                onChange={(e) => setEditCustomGenre(e.target.value)}
                placeholder="Nhập thể loại khác..."
              />
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Nội Dung Mở Rộng / Đánh Giá</label>
            <textarea className={styles.textarea} rows={4} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
          </div>
          
          <div className={styles.field}>
            <label className={styles.label}>Thay Đổi Sách (Tùy chọn)</label>
            {currentFileName && <div className={styles.currentFile}>Tệp hiện tại: {currentFileName}</div>}
            <input
              type="file"
              accept=".pdf,.doc,.docx,.epub,.mobi"
              onChange={(e) => setEditBookFile(e.target.files[0])}
              className={styles.fileInput}
            />
          </div>

          <div className={styles.modalActions}>
            <button className={styles.btnCancel} onClick={onClose} disabled={saving}>Hủy</button>
            <button className={styles.btnSave} onClick={saveEdit} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
