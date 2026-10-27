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
