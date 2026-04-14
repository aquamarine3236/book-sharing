import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ParticleBackground from '../components/ui/ParticleBackground';
import styles from './Login.module.css';

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate('/');
    } catch (err) {
      setError(mapError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <ParticleBackground />

      <div className={styles.hero}>
        <h1 className={styles.siteTitle}>Bookaholic Dimension</h1>
        <p className={styles.tagline}>Nơi tri thức gặp gỡ ánh sáng — nơi sách mở ra muôn chiều không gian</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Đăng Nhập</h2>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tên đăng nhập"
              required
              autoComplete="username"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.btnPrimary} type="submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className={styles.switchText}>
          Chưa có tài khoản?{' '}
          <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}

function mapError(err) {
  const msg = err?.message || '';
  if (msg.includes('Invalid login credentials')) return 'Tên đăng nhập hoặc mật khẩu không đúng.';
  if (msg.includes('Too many requests'))          return 'Quá nhiều lần thử. Vui lòng thử lại sau.';
  return 'Đã xảy ra lỗi. Vui lòng thử lại.';
}
