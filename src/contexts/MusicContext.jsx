import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';

const MusicContext = createContext(null);

export const useMusic = () => {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used within MusicProvider');
  return ctx;
};

export function MusicProvider({ children }) {
  const audioRef                                = useRef(new Audio());
  const [playlist,     setPlaylist]             = useState([]);
  const [currentIndex, setCurrentIndex]         = useState(0);
  const [isPlaying,    setIsPlaying]            = useState(false);
  const [currentTime,  setCurrentTime]          = useState(0);
  const [duration,     setDuration]             = useState(0);
  const [volume,       setVolume]               = useState(0.7);

  const currentTrack = playlist[currentIndex] || null;

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

    if (isPlaying) audio.play().catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentTrack]);

  const play = (index) => {
    if (index !== undefined && index !== currentIndex) {
      setCurrentIndex(index);
      setIsPlaying(true);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const pause = () => { audioRef.current.pause(); setIsPlaying(false); };
  const toggle = () => { if (isPlaying) pause(); else play(); };

  const next = () => {
    if (!playlist.length) return;
    setCurrentIndex((i) => (i + 1) % playlist.length);
    setIsPlaying(true);
  };

  const prev = () => {
    if (!playlist.length) return;
    setCurrentIndex((i) => (i - 1 + playlist.length) % playlist.length);
    setIsPlaying(true);
  };

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

  return (
    <MusicContext.Provider value={{
      playlist, setPlaylist,
      currentTrack, currentIndex,
      isPlaying, currentTime, duration, volume,
      play, pause, toggle, next, prev, seek, changeVolume, playTrack,
    }}>
      {children}
    </MusicContext.Provider>
  );
}
