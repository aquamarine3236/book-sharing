import styles from './GenreFilter.module.css';

export const GENRES = [
  'Văn học',
  'Lịch sử',
  'Khoa học',
  'Triết học',
  'Tâm lý',
  'Kinh tế',
  'Phát triển bản thân',
  'Giả tưởng',
  'Trinh thám',
  'Truyện tranh',
  'Hài hước',
  'Khác'
];

// Remove the MAGIC_COLORS array export that is now unused

const DEFINED_GENRE_COLORS = {
  'Văn học': 'var(--color-van-hoc)',
  'Lịch sử': 'var(--color-lich-su)',
  'Khoa học': 'var(--color-khoa-hoc)',
  'Triết học': 'var(--color-triet-hoc)',
  'Tâm lý': 'var(--color-tam-ly)',
  'Kinh tế': 'var(--color-kinh-te)',
  'Phát triển bản thân': 'var(--color-phat-trien)',
  'Giả tưởng': 'var(--color-gia-tuong)',
  'Trinh thám': 'var(--color-trinh-tham)',
  'Truyện tranh': 'var(--color-truyen-tranh)',
  'Hài hước': 'var(--color-hai-huoc)',
  'Khác': 'var(--color-khac)'
};

export function getGenreColor(genreName) {
  const gName = genreName.trim();
  if (DEFINED_GENRE_COLORS[gName]) return DEFINED_GENRE_COLORS[gName];
  return 'var(--color-khac)';
}

export default function GenreFilter({ active, onChange }) {
  return (
    <div className={styles.row}>
      {GENRES.map((g) => (
        <button
          key={g}
          className={`${styles.pill} ${active === g ? styles.active : ''}`}
          onClick={() => onChange(g)}
        >
          {g}
        </button>
      ))}
    </div>
  );
}
