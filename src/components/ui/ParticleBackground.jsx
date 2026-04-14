import styles from './ParticleBackground.module.css';

const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left:  `${Math.random() * 100}%`,
  size:  Math.random() * 3 + 1,
  delay: `${Math.random() * 12}s`,
  duration: `${Math.random() * 10 + 8}s`,
  opacity: Math.random() * 0.5 + 0.2,
}));

export default function ParticleBackground() {
  return (
    <div className={styles.container} aria-hidden="true">
      {PARTICLES.map((p) => (
        <span
          key={p.id}
          className={styles.particle}
          style={{
            left:              p.left,
            width:             p.size,
            height:            p.size,
            animationDelay:    p.delay,
            animationDuration: p.duration,
            opacity:           p.opacity,
          }}
        />
      ))}
    </div>
  );
}
