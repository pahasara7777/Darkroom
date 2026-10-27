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
