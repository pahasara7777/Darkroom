import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from './auth.jsx';
import Nav from './components/Nav.jsx';
import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import Studio from './pages/Studio.jsx';
import Gallery from './pages/Gallery.jsx';

function Private({ children }) {
  const { user } = useAuth();
  const from = useLocation();
  return user ? children : <Navigate to="/login" replace state={{ from }} />;
}

const Page = ({ children }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
    {children}
  </motion.div>
);

export default function App() {
  const loc = useLocation();
  return (
    <>
      <div className="ambient" aria-hidden="true">
        <div className="blob blob-a bg-tray" style={{ width: '45vw', height: '45vw', top: '-12vw', right: '-10vw' }} />
        <div className="blob blob-b bg-safelight" style={{ width: '38vw', height: '38vw', bottom: '-14vw', left: '-8vw' }} />
      </div>
      <Nav />
      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={loc} key={loc.pathname}>
            <Route path="/" element={<Page><Landing /></Page>} />
            <Route path="/login" element={<Page><Auth mode="login" /></Page>} />
            <Route path="/register" element={<Page><Auth mode="register" /></Page>} />
            <Route path="/studio" element={<Private><Page><Studio /></Page></Private>} />
            <Route path="/gallery" element={<Private><Page><Gallery /></Page></Private>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
    </>
  );
}
