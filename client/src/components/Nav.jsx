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
