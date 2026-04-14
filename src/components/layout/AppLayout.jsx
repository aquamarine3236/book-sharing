import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import MusicPlayer from './MusicPlayer';
import { supabase } from '../../supabase';
import { useMusic } from '../../contexts/MusicContext';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  const { setPlaylist, play, playlist } = useMusic();

  useEffect(() => {
    const initMusic = async () => {
      if (playlist.length > 0) return;

      const { data } = await supabase
        .from('music')
        .select('*')
        .order('uploaded_at', { ascending: true });
        
      if (data && data.length > 0) {
        setPlaylist(data);
        play(0);
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
