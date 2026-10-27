import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const Ctx = createContext(null);
const read = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(read);
  const logout = useCallback(() => {
    try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch { /* storage blocked */ }
    setUser(null);
  }, []);
  useEffect(() => {
    window.addEventListener('unauthorized', logout);
    return () => window.removeEventListener('unauthorized', logout);
  }, [logout]);
  const login = ({ token, user }) => {
    try { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); } catch { /* storage blocked */ }
    setUser(user);
  };
  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
