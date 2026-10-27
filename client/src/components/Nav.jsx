import { Link, NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../auth.jsx';
import { BRAND } from '../brand.js';

const MotionLink = motion.create(Link);

// The dark pill slides between tabs.
const Tab = ({ to, children }) => (
  <NavLink to={to} className={({ isActive }) => 'relative isolate rounded-md px-3 py-2 font-medium ' + (isActive ? 'text-print' : 'hover:bg-ink/10')}>
    {({ isActive }) => (
      <>
        {isActive && <motion.span layoutId="pill" className="absolute inset-0 -z-10 rounded-md bg-ink" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
        {children}
      </>
    )}
  </NavLink>
);

export default function Nav() {
  const { user, logout } = useAuth();
  return (
    <motion.header initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 20 }}
      className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4 sm:px-6">
      <Link to="/" className="display text-2xl">{BRAND}</Link>
      {user && (
        <nav className="flex gap-1" aria-label="Main">
          <Tab to="/studio">Studio</Tab>
          <Tab to="/gallery">Gallery</Tab>
        </nav>
      )}
      <div className="ml-auto flex items-center gap-2">
        {user ? (
          <>
            <span className="hidden text-mute sm:inline">{user.email}</span>
            <button onClick={logout} className="rounded-md px-3 py-2 font-medium hover:bg-ink/10">Sign out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="rounded-md px-3 py-2 font-medium hover:bg-ink/10">Sign in</Link>
            <MotionLink to="/register" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} className="rounded-md bg-ink px-4 py-2 font-medium text-print">Create account</MotionLink>
          </>
        )}
      </div>
    </motion.header>
  );
}
