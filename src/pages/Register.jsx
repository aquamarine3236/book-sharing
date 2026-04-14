import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ParticleBackground from '../components/ui/ParticleBackground';
import styles from './Login.module.css';

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [username,    setUsername]    = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Mật khẩu không khớp.'); return; }
    if (password.length < 6)  { setError('Mật khẩu phải có ít nhất 6 ký tự.'); return; }
    setLoading(true);
    try {
      await register(displayName.trim(), username.trim(), password);
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
        <p className={styles.tagline}>Gia nhập cộng đồng — khám phá thế giới sách cùng nhau</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Tạo Tài Khoản</h2>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Tên hiển thị</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tên của bạn"
              required
            />
          </div>
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
              placeholder="Ít nhất 6 ký tự"
              required
              autoComplete="new-password"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Xác nhận mật khẩu</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              required
              autoComplete="new-password"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.btnPrimary} type="submit" disabled={loading}>
            {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </button>
        </form>

        <p className={styles.switchText}>
          Đã có tài khoản?{' '}
          <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

function mapError(err) {
  const msg = err?.message || '';
  if (msg.includes('already registered')) return 'Tên đăng nhập này đã được sử dụng.';
  if (msg.includes('invalid email'))      return 'Tên đăng nhập không hợp lệ.';
  if (msg.includes('weak_password'))      return 'Mật khẩu quá yếu.';
  return 'Đã xảy ra lỗi. Vui lòng thử lại.';
}
