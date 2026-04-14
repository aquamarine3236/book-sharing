import { useState, useRef } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import styles from './UploadForm.module.css';

export default function UploadForm({ onUploaded }) {
  const { user, getDisplayName } = useAuth();
  const [title,    setTitle]    = useState('');
  const [artist,   setArtist]   = useState('');
  const [mp3File,  setMp3File]  = useState(null);
  const [imgFile,  setImgFile]  = useState(null);
  const [imgPreview, setImgPreview] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading,setUploading]= useState(false);
  const [error,    setError]    = useState('');
  const mp3Ref = useRef();
  const imgRef = useRef();

  const handleImg = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  const uploadToStorage = async (file, bucket, path) => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const getDuration = (file) =>
    new Promise((resolve) => {
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => resolve(Math.round(audio.duration));
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim())  { setError('Vui lòng nhập tên bài hát.'); return; }
    if (!artist.trim()) { setError('Vui lòng nhập tên nghệ sĩ.'); return; }
    if (!mp3File)       { setError('Vui lòng chọn tệp MP3.'); return; }

    setError('');
    setUploading(true);
    setProgress(10);

    try {
      const ts  = Date.now();
      const uid = user.id;

      const sanitizeFileName = (name) => {
        return name
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9.\-_]/g, '_')
          .toLowerCase();
      };

      setProgress(20);
      const safeMp3Name = sanitizeFileName(mp3File.name);
      const mp3Url = await uploadToStorage(
        mp3File, 'music', `${uid}/${ts}_${safeMp3Name}`
      );
      setProgress(65);

      let coverUrl = '';
      if (imgFile) {
        const safeImgName = sanitizeFileName(imgFile.name);
        coverUrl = await uploadToStorage(
          imgFile, 'covers', `${uid}/${ts}_${safeImgName}`
        );
      }
      setProgress(85);

      const duration = await getDuration(mp3File);

      const { error: dbErr } = await supabase.from('music').insert({
        title:          title.trim(),
        artist:         artist.trim(),
        mp3_url:        mp3Url,
        cover_url:      coverUrl,
        duration,
        uploaded_by:    uid,
        uploader_name:  getDisplayName(),
        uploaded_at:    new Date().toISOString(),
      });

      if (dbErr) throw dbErr;

      setProgress(100);
      setTitle(''); setArtist('');
      setMp3File(null); setImgFile(null); setImgPreview('');
      if (mp3Ref.current) mp3Ref.current.value = '';
      if (imgRef.current) imgRef.current.value = '';
      onUploaded && onUploaded();
    } catch (err) {
      setError('Tải lên thất bại: ' + err.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.heading}>Tải Bài Nhạc Mới</h3>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Tên bài hát</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên bài hát..." />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Nghệ sĩ</label>
          <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Tên nghệ sĩ..." />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Tệp MP3</label>
          <input
            type="file" accept="audio/mp3,audio/mpeg"
            ref={mp3Ref}
            onChange={(e) => setMp3File(e.target.files[0])}
            className={styles.fileInput}
          />
          {mp3File && <span className={styles.fileName}>{mp3File.name}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Ảnh bìa (tùy chọn)</label>
          <input
            type="file" accept="image/*"
            ref={imgRef}
            onChange={handleImg}
            className={styles.fileInput}
          />
          {imgPreview && <img src={imgPreview} alt="xem trước" className={styles.preview} />}
        </div>
      </div>

      {uploading && (
        <div className={styles.progressWrapper}>
          <div className={styles.progressBar} style={{ width: `${progress}%` }} />
          <span className={styles.progressText}>{progress}%</span>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.btn} type="submit" disabled={uploading}>
        {uploading ? `Đang tải lên... ${progress}%` : 'Tải lên'}
      </button>
    </form>
  );
}
