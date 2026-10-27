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
