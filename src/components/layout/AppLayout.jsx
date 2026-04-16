import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import MusicPlayer from './MusicPlayer';
import { supabase } from '../../supabase';
import { useMusic } from '../../contexts/MusicContext';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  const { setPlaylist, play, playlist, shuffleMode } = useMusic();

  useEffect(() => {
    const initMusic = async () => {
      if (playlist.length > 0) return;

      const { data } = await supabase
        .from('music')
        .select('*')
        .order('uploaded_at', { ascending: true });
        
      if (data && data.length > 0) {
        setPlaylist(data);
        // Start at a random track when in shuffle mode, otherwise start at 0
        const startIndex = shuffleMode
          ? Math.floor(Math.random() * data.length)
          : 0;
        play(startIndex);
      }
    };
    initMusic();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.layout}>
      <Navbar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <MusicPlayer />
    </div>
  );
}
