import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useMusic } from '../contexts/MusicContext';
import TrackList from '../components/music/TrackList';
import UploadForm from '../components/music/UploadForm';
import styles from './MusicManager.module.css';

export default function MusicManager() {
  const [tracks,   setTracks]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editImgFile, setEditImgFile] = useState(null);
  const [editImgPreview, setEditImgPreview] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const { setPlaylist } = useMusic();

  const loadTracks = async () => {
    const { data } = await supabase
      .from('music')
      .select('*')
      .order('uploaded_at', { ascending: true });
    const list = data || [];
    setTracks(list);
    setPlaylist(list);
    setLoading(false);
  };

  useEffect(() => {
    loadTracks();

    const channel = supabase
      .channel('music-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'music' }, loadTracks)
      .subscribe();

    return () => supabase.removeChannel(channel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = (track) => {
    setDeleteTarget(track);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Delete storage files
      if (deleteTarget.mp3_url) {
        const mp3Path = deleteTarget.mp3_url.split('/storage/v1/object/public/music/')[1];
        if (mp3Path) await supabase.storage.from('music').remove([mp3Path]);
      }
      if (deleteTarget.cover_url) {
        const coverPath = deleteTarget.cover_url.split('/storage/v1/object/public/covers/')[1];
        if (coverPath) await supabase.storage.from('covers').remove([coverPath]);
      }
      await supabase.from('music').delete().eq('id', deleteTarget.id);
    } catch (err) {
      console.error('Xóa thất bại:', err);
    } finally {
      setDeleteTarget(null);
      setDeleting(false);
    }
  };

  const handleEdit = (track) => {
    setEditTarget(track);
    setEditTitle(track.title);
    setEditArtist(track.artist);
    setEditImgFile(null);
    setEditImgPreview(track.cover_url || '');
  };

  const confirmEdit = async () => {
    if (!editTitle.trim() || !editArtist.trim()) return;
    setSavingEdit(true);
    let newCoverUrl = editTarget.cover_url;

    try {
      if (editImgFile) {
        const { data: { user } } = await supabase.auth.getUser();
        const ts = Date.now();
        const safeName = editImgFile.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9.\-_]/g, '_').toLowerCase();
        const path = `${user?.id || 'unknown'}/${ts}_${safeName}`;
        
        const { error: uploadError } = await supabase.storage.from('covers').upload(path, editImgFile, { upsert: true });
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage.from('covers').getPublicUrl(path);
        newCoverUrl = data.publicUrl;
      }

      await supabase.from('music').update({
        title: editTitle.trim(),
        artist: editArtist.trim(),
        cover_url: newCoverUrl,
      }).eq('id', editTarget.id);

    } catch (err) {
      console.error('Lỗi khi cập nhật:', err);
    } finally {
      setEditTarget(null);
      setSavingEdit(false);
      loadTracks();
    }
  };


  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Thư Viện Nhạc</h1>
            <p className={styles.sub}>Nhạc nền được chia sẻ bởi cộng đồng</p>
          </div>
          <button className={styles.uploadToggle} onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Đóng biểu mẫu' : 'Tải nhạc mới'}
          </button>
        </div>

        {showForm && (
          <div className={styles.formSection}>
            <UploadForm onUploaded={() => { setShowForm(false); loadTracks(); }} />
          </div>
        )}

        {loading
          ? <div className={styles.loading}>Đang tải thư viện nhạc...</div>
          : <TrackList tracks={tracks} onDelete={handleDelete} onEdit={handleEdit} />
        }
      </div>

      {deleteTarget && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Xác Nhận Xóa</h3>
            <p className={styles.modalText}>
              Bạn có chắc chắn muốn xóa bài nhạc <strong>{deleteTarget.title}</strong> không? Hành động này không thể hoàn tác.
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

      {editTarget && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Sửa Bài Nhạc</h3>
            <div className={styles.inputGroup}>
              <label>Tên bài hát</label>
              <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>
            <div className={styles.inputGroup}>
              <label>Nghệ sĩ</label>
              <input type="text" value={editArtist} onChange={e => setEditArtist(e.target.value)} />
            </div>
            <div className={styles.inputGroup}>
              <label>Ảnh bìa</label>
              <input type="file" accept="image/*" onChange={(e) => {
                const f = e.target.files[0];
                if (f) {
                  setEditImgFile(f);
                  setEditImgPreview(URL.createObjectURL(f));
                }
              }} />
              {editImgPreview && <img src={editImgPreview} alt="cover" style={{ width: 60, height: 60, marginTop: 8, objectFit: 'cover' }} />}
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => setEditTarget(null)}>Hủy</button>
              <button className={styles.btnConfirmEdit} onClick={confirmEdit} disabled={savingEdit}>
                {savingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
