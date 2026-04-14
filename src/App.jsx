import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MusicProvider } from './contexts/MusicContext';
import AuthGuard    from './components/layout/AuthGuard';
import AppLayout    from './components/layout/AppLayout';
import Login        from './pages/Login';
import Register     from './pages/Register';
import Home         from './pages/Home';
import NewBook      from './pages/NewBook';
import BookDetail   from './pages/BookDetail';
import Profile      from './pages/Profile';
import MusicManager from './pages/MusicManager';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.18, ease: 'easeIn' } },
};

function AnimatedPage({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ minHeight: '100%' }}>
      {children}
    </motion.div>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user)    return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login"    element={<PublicRoute><AnimatedPage><Login /></AnimatedPage></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><AnimatedPage><Register /></AnimatedPage></PublicRoute>} />

        <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
          <Route path="/"          element={<AnimatedPage><Home /></AnimatedPage>} />
          <Route path="/books/new" element={<AnimatedPage><NewBook /></AnimatedPage>} />
          <Route path="/books/:id" element={<AnimatedPage><BookDetail /></AnimatedPage>} />
          <Route path="/profile"   element={<AnimatedPage><Profile /></AnimatedPage>} />
          <Route path="/music"     element={<AnimatedPage><MusicManager /></AnimatedPage>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MusicProvider>
          <AppRoutes />
        </MusicProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
