import { useMusic } from '../../contexts/MusicContext';
import { useAuth } from '../../contexts/AuthContext';
import styles from './TrackList.module.css';

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function TrackList({ tracks, onDelete, onEdit }) {
  const { playTrack, currentTrack, isPlaying, pause } = useMusic();
  const { user } = useAuth();

  if (!tracks.length) {
    return (
      <div className={styles.empty}>
        Chưa có bài nhạc nào. Hãy là người đầu tiên tải lên.
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {tracks.map((track, i) => {
        const isActive = currentTrack?.id === track.id;
        return (
          <div 
            key={track.id} 
            className={`${styles.row} ${isActive ? styles.active : ''}`}
            onClick={() => {
              if (isActive && isPlaying) pause();
              else playTrack(track);
            }}
          >
            <span className={styles.index}>{i + 1}</span>

            <div className={styles.cover}>
              {track.cover_url
                ? <img src={track.cover_url} alt={track.title} className={styles.coverImg} />
                : <div className={styles.coverPlaceholder} />
              }
            </div>

            <div className={styles.info}>
              <span className={styles.title}>{track.title}</span>
              <span className={styles.artist}>{track.artist}</span>
            </div>

            <span className={styles.duration}>{formatTime(track.duration)}</span>
            <span className={styles.uploader}>{track.uploader_name || 'Ẩn danh'}</span>

            <div className={styles.actions}>
              {user?.id === track.uploaded_by && (
                <>
                  <button
                    className={styles.editBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onEdit) onEdit(track);
                    }}
                  >
                    Sửa
                  </button>
                  <button 
                    className={styles.deleteBtn} 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(track);
                    }}
                  >
                    Xóa
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
