import { useMusic } from '../../contexts/MusicContext';
import styles from './MusicPlayer.module.css';

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function MusicPlayer() {
  const {
    currentTrack, isPlaying,
    currentTime, duration, volume,
    shuffleMode, toggleShuffleMode,
    toggle, next, prev, seek, changeVolume,
  } = useMusic();

  if (!currentTrack) return (
    <div className={styles.bar}>
      <span className={styles.idle}>
        Chưa phát bài nào — hãy đến Thư viện nhạc để bắt đầu
      </span>
    </div>
  );

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className={styles.bar}>
      {/* Cover */}
      <div className={styles.cover}>
        {currentTrack.cover_url
          ? <img src={currentTrack.cover_url} alt={currentTrack.title} className={styles.coverImg} />
          : <div className={styles.coverPlaceholder} />
        }
      </div>

      {/* Track info */}
      <div className={styles.info}>
        <span className={styles.title}>{currentTrack.title}</span>
        <span className={styles.artist}>{currentTrack.artist}</span>
      </div>

      <div className={styles.divider} />

      {/* Controls */}
      <div className={styles.controls}>
        <button className={styles.navBtn} onClick={prev} title="Bài trước">
          <img src="/play_back.svg" alt="Previous" className={styles.navIcon} />
        </button>
        <button className={styles.playBtn} onClick={toggle} title={isPlaying ? 'Tạm dừng' : 'Phát'}>
          {isPlaying
            ? <span className={styles.stopIcon} />
            : <span className={styles.playIcon} />
          }
        </button>
        <button className={styles.navBtn} onClick={next} title="Bài tiếp">
          <img src="/play_next.svg" alt="Next" className={styles.navIcon} />
        </button>
      </div>

      <div className={styles.divider} />

      {/* Progress */}
      <div className={styles.progressWrapper}>
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={currentTime}
          onChange={(e) => seek(Number(e.target.value))}
          className={styles.progressBar}
          style={{ '--progress': `${progress}%` }}
        />
        <div className={styles.times}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Volume */}
      <div className={styles.volumeWrapper}>
        <span className={styles.volumeLabel}>vol</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.02}
          value={volume}
          onChange={(e) => changeVolume(Number(e.target.value))}
          className={styles.volumeBar}
          style={{ '--progress': `${volume * 100}%` }}
        />
      </div>

      {/* Shuffle / Sequential toggle */}
      <button
        className={`${styles.shuffleBtn} ${shuffleMode ? styles.shuffleActive : ''}`}
        onClick={toggleShuffleMode}
        title={shuffleMode ? 'Đang phát ngẫu nhiên — nhấn để phát theo thứ tự' : 'Đang phát theo thứ tự — nhấn để phát ngẫu nhiên'}
      >
        <img
          src={shuffleMode ? '/shuffle.svg' : '/repeat.svg'}
          alt={shuffleMode ? 'Shuffle' : 'Sequential'}
          className={styles.modeIcon}
        />
        <span className={styles.shuffleText}>{shuffleMode ? 'Ngẫu nhiên' : 'Thứ tự'}</span>
      </button>
    </div>
  );
}
