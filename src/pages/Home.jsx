import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';
import BookGrid from '../components/books/BookGrid';
import ParticleBackground from '../components/ui/ParticleBackground';
import styles from './Home.module.css';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const layer1 = useRef(null);
  const layer2 = useRef(null);
  const layer3 = useRef(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setBooks(data || []);
      setLoading(false);
    };
    load();

    // Realtime subscription
    const channel = supabase
      .channel('books-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, load)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Parallax scroll
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (layer1.current) layer1.current.style.transform = `translateY(${y * 0.15}px)`;
      if (layer2.current) layer2.current.style.transform = `translateY(${y * 0.30}px)`;
      if (layer3.current) layer3.current.style.transform = `translateY(${y * 0.50}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={styles.page}>
      <section className={styles.hero} style={books.length > 0 ? { height: 'auto', minHeight: 'calc(100vh - var(--player-height, 72px))', overflow: 'hidden', paddingTop: '100px', paddingBottom: '100px', display: 'flex', alignItems: 'flex-start' } : {}}>
        <ParticleBackground />
        <div className={styles.parallaxLayer1} ref={layer1} />
        <div className={styles.parallaxLayer2} ref={layer2} />

        {loading ? (
          <div className={styles.loadingMsg} style={{ position: 'relative', zIndex: 2 }}>Đang tải...</div>
        ) : books.length === 0 ? (
          <div className={styles.heroContent} ref={layer3}>
            <h1 className={styles.heroTitle}>Bookaholic Dimension</h1>
            <p className={styles.heroSub}>
              Khám phá những cuốn sách được cộng đồng yêu thích —
              mỗi trang sách là một cánh cửa đến thế giới mới
            </p>
          </div>
        ) : (
          <div className={styles.content} style={{ position: 'relative', zIndex: 2, width: '100%' }}>
            <BookGrid books={books} />
          </div>
        )}
      </section>
    </div>
  );
}
