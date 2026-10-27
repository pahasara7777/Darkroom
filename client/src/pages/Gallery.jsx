import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { api } from '../api.js';

export default function Gallery() {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');
  const [sel, setSel] = useState(null);
  const [sure, setSure] = useState(false);
  const dlg = useRef(null);
  const nav = useNavigate();

  useEffect(() => { api('/images').then(setItems, (e) => setErr(e.message)); }, []);
  useEffect(() => {
    setSure(false);
    if (sel && !dlg.current.open) dlg.current.showModal();
    if (!sel && dlg.current.open) dlg.current.close();
  }, [sel]);

  async function remove() {
    try {
      await api('/images/' + sel.id, { method: 'DELETE' });
      setItems((l) => l.filter((i) => i.id !== sel.id));
      setSel(null);
    } catch (e) { setErr(e.message); }
  }

  const reuse = () => {
    const { prompt, negative, steps, guidance, loraScale, seed } = sel;
    nav('/studio', { state: { settings: { prompt, negative, steps, guidance, loraScale, seed } } });
  };

  return (
    <div className="py-6">
      <h1 className="display text-4xl">Gallery</h1>
      {err && <p role="alert" className="mt-4 font-medium text-red-800">{err}</p>}
      {items === null && !err && <p className="mt-6 text-mute">Loading your prints…</p>}
      {items?.length === 0 && (
        <div className="mt-8 max-w-md rounded-lg border-2 border-dashed border-ink p-8">
          <p className="display text-2xl">No prints yet</p>
          <p className="mt-2 text-mute">Describe something in the Studio and it will be saved here.</p>
          <Link to="/studio" className="mt-5 inline-block rounded-md bg-safelight px-5 py-3 font-bold text-ink">Open Studio</Link>
        </div>
      )}
      <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {items?.map((i, n) => (
            <motion.li key={i.id} layout initial={{ opacity: 0, y: 28, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }} transition={{ delay: Math.min(n * 0.05, 0.4), type: 'spring', damping: 22 }}>
              <motion.button whileHover={{ y: -6 }} whileTap={{ scale: 0.97 }} onClick={() => setSel(i)} className="group block w-full text-left">
                <img src={i.url} alt={i.prompt} loading="lazy" className="aspect-square w-full rounded-md border-2 border-ink object-cover shadow-[4px_4px_0_0_var(--color-ink)] group-hover:border-tray" />
                <span className="mt-2 line-clamp-2 text-sm text-mute">{i.prompt}</span>
              </motion.button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <dialog ref={dlg} onClose={() => setSel(null)} onClick={(e) => e.target === dlg.current && setSel(null)}
        className="m-auto max-h-[92vh] w-[min(92vw,44rem)] overflow-auto rounded-lg border-2 border-ink bg-print p-0 backdrop:bg-ink/70">
        {sel && (
          <motion.div initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', damping: 22 }} className="p-5">
