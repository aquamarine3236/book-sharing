import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMusic } from '../../contexts/MusicContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout, getDisplayName } = useAuth();
  const { pause } = useMusic();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setLoggingOut(true);
    pause();
    await logout();
    navigate('/login');
    setShowLogoutModal(false);
    setLoggingOut(false);
  };

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.left}>
          <NavLink
            to="/profile"
            className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}
          >
            {getDisplayName()}
          </NavLink>
        </div>

        <div className={styles.center}>
          <NavLink
            to="/"
            className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}
            end
          >
            Thư viện
          </NavLink>
          <NavLink
            to="/books/new"
            className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}
          >
            Tải sách
          </NavLink>
          <NavLink
            to="/music"
            className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}
          >
            Âm nhạc
          </NavLink>
        </div>

        <div className={styles.right}>
          <button className={styles.logout} onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </nav>

      {showLogoutModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Xác Nhận</h3>
            <p className={styles.modalText}>
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => setShowLogoutModal(false)}>Hủy</button>
              <button className={styles.btnConfirmDelete} onClick={confirmLogout} disabled={loggingOut}>
                {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
