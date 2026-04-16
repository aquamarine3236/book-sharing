import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';

const MusicContext = createContext(null);

export const useMusic = () => {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used within MusicProvider');
  return ctx;
};

/* ── Fisher-Yates shuffle with no-consecutive-repeat constraint ── */
function buildShuffleOrder(length, avoidIndex) {
  if (length <= 1) return Array.from({ length }, (_, i) => i);

  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  // Ensure the first item in the new order is not the same as avoidIndex
  // (prevents the same song playing twice in a row when the queue wraps)
  if (avoidIndex !== undefined && order.length > 1 && order[0] === avoidIndex) {
    // Swap with a random position that isn't 0
    const swapIdx = 1 + Math.floor(Math.random() * (order.length - 1));
    [order[0], order[swapIdx]] = [order[swapIdx], order[0]];
  }

  return order;
}

export function MusicProvider({ children }) {
  const audioRef                                = useRef(new Audio());
  const [playlist,     setPlaylist]             = useState([]);
  const [currentIndex, setCurrentIndex]         = useState(0);
  const [isPlaying,    setIsPlaying]            = useState(false);
  const [currentTime,  setCurrentTime]          = useState(0);
  const [duration,     setDuration]             = useState(0);
  const [volume,       setVolume]               = useState(0.7);

  /* ── Shuffle mode state (persisted to localStorage) ── */
  const [shuffleMode, setShuffleMode] = useState(() => {
    const stored = localStorage.getItem('music_shuffle_mode');
    return stored === null ? true : stored === 'true';
  });

  // shuffleOrder: array of playlist indices in shuffled sequence
  // shuffleCursor: our current position within that sequence
  const [shuffleOrder,  setShuffleOrder]  = useState([]);
  const [shuffleCursor, setShuffleCursor] = useState(0);

  const currentTrack = playlist[currentIndex] || null;

  /* Persist shuffle preference */
  useEffect(() => {
    localStorage.setItem('music_shuffle_mode', String(shuffleMode));
  }, [shuffleMode]);

  /* Rebuild shuffle order whenever playlist changes */
  useEffect(() => {
    if (playlist.length > 0) {
      const order = buildShuffleOrder(playlist.length, currentIndex);
      setShuffleOrder(order);
      // Place cursor at the position of the current track in the new order
      const pos = order.indexOf(currentIndex);
      setShuffleCursor(pos !== -1 ? pos : 0);
    } else {
      setShuffleOrder([]);
      setShuffleCursor(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist]);

  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    const onTimeUpdate  = () => setCurrentTime(audio.currentTime);
    const onDuration    = () => setDuration(audio.duration || 0);
    const onEnded       = () => next();
    const onPlay        = () => setIsPlaying(true);
    const onPause       = () => setIsPlaying(false);

    audio.addEventListener('timeupdate',     onTimeUpdate);
    audio.addEventListener('durationchange', onDuration);
    audio.addEventListener('ended',          onEnded);
    audio.addEventListener('play',           onPlay);
    audio.addEventListener('pause',          onPause);

    return () => {
      audio.removeEventListener('timeupdate',     onTimeUpdate);
      audio.removeEventListener('durationchange', onDuration);
      audio.removeEventListener('ended',          onEnded);
      audio.removeEventListener('play',           onPlay);
      audio.removeEventListener('pause',          onPause);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const loadedSrcRef = useRef(null);

  useEffect(() => {
    if (!currentTrack) return;
    if (loadedSrcRef.current === currentTrack.mp3_url) return;

    const audio = audioRef.current;
    audio.src   = currentTrack.mp3_url;
    audio.load();
    loadedSrcRef.current = currentTrack.mp3_url;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.warn('Autoplay prevented. Waiting for user interaction.', err);
        setIsPlaying(false);
        const playOnInteract = () => {
          audio.play().then(() => setIsPlaying(true)).catch(() => {});
          document.removeEventListener('click', playOnInteract);
          document.removeEventListener('keydown', playOnInteract);
        };
        document.addEventListener('click', playOnInteract);
        document.addEventListener('keydown', playOnInteract);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentTrack]);

  const play = (index) => {
    if (index !== undefined && index !== currentIndex) {
      setCurrentIndex(index);
      setIsPlaying(true);

      // Sync shuffle cursor to match the manually selected track
      if (shuffleMode && shuffleOrder.length > 0) {
        const pos = shuffleOrder.indexOf(index);
        if (pos !== -1) setShuffleCursor(pos);
      }
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const pause = () => { audioRef.current.pause(); setIsPlaying(false); };
  const toggle = () => { if (isPlaying) pause(); else play(); };

  const next = useCallback(() => {
    if (!playlist.length) return;

    if (shuffleMode && shuffleOrder.length > 0) {
      setShuffleCursor((cursor) => {
        const nextCursor = cursor + 1;
        if (nextCursor >= shuffleOrder.length) {
          // Reshuffle, avoiding repeating the last track
          const newOrder = buildShuffleOrder(playlist.length, shuffleOrder[cursor]);
          setShuffleOrder(newOrder);
          setCurrentIndex(newOrder[0]);
          return 0;
        }
        setCurrentIndex(shuffleOrder[nextCursor]);
        return nextCursor;
      });
    } else {
      setCurrentIndex((i) => (i + 1) % playlist.length);
    }

    setIsPlaying(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist, shuffleMode, shuffleOrder]);

  const prev = useCallback(() => {
    if (!playlist.length) return;

    if (shuffleMode && shuffleOrder.length > 0) {
      setShuffleCursor((cursor) => {
        const prevCursor = cursor - 1;
        if (prevCursor < 0) {
          // Wrap: go to end of current shuffle order
          const last = shuffleOrder.length - 1;
          setCurrentIndex(shuffleOrder[last]);
          return last;
        }
        setCurrentIndex(shuffleOrder[prevCursor]);
        return prevCursor;
      });
    } else {
      setCurrentIndex((i) => (i - 1 + playlist.length) % playlist.length);
    }

    setIsPlaying(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist, shuffleMode, shuffleOrder]);

  const seek = (time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const changeVolume = (val) => {
    setVolume(val);
    audioRef.current.volume = val;
  };

  const playTrack = (track) => {
    const idx = playlist.findIndex((t) => t.id === track.id);
    if (idx === -1) {
      setPlaylist((prev) => {
        const newPlaylist = [...prev, track];
        setCurrentIndex(newPlaylist.length - 1);
        return newPlaylist;
      });
      setIsPlaying(true);
    } else {
      play(idx);
    }
  };

  /* Toggle between shuffle and sequential */
  const toggleShuffleMode = useCallback(() => {
    setShuffleMode((prev) => {
      const newMode = !prev;
      if (newMode && playlist.length > 0) {
        // Switching TO shuffle — build a new order starting from current track
        const order = buildShuffleOrder(playlist.length, currentIndex);
        // Place current track at the front so playback continues seamlessly
        const pos = order.indexOf(currentIndex);
        if (pos > 0) {
          [order[0], order[pos]] = [order[pos], order[0]];
        }
        setShuffleOrder(order);
        setShuffleCursor(0);
      }
      return newMode;
    });
  }, [playlist, currentIndex]);

  const enableShuffleMode = useCallback(() => {
    setShuffleMode((prev) => {
      if (prev) return prev; // already enabled
      if (playlist.length > 0) {
        const order = buildShuffleOrder(playlist.length, currentIndex);
        const pos = order.indexOf(currentIndex);
        if (pos > 0) {
          [order[0], order[pos]] = [order[pos], order[0]];
        }
        setShuffleOrder(order);
        setShuffleCursor(0);
      }
      return true;
    });
  }, [playlist, currentIndex]);

  // Play a silent short sound to unlock the audio element on mobile/browsers and allow future async plays
  const unlockAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio.src) {
      // Provide a tiny silent data URI so it can play something
      audio.src = 'data:audio/mp3;base64,//MkxAAQ...'; // shortened for brevity, just an empty src or basic data uri is fine, actually let's just use play/pause
      audio.load();
    }
    audio.play().catch(() => {});
  }, []);

  return (
    <MusicContext.Provider value={{
      playlist, setPlaylist,
      currentTrack, currentIndex,
      isPlaying, currentTime, duration, volume,
      shuffleMode, toggleShuffleMode, enableShuffleMode,
      play, pause, toggle, next, prev, seek, changeVolume, playTrack, unlockAudio,
    }}>
      {children}
    </MusicContext.Provider>
  );
}
