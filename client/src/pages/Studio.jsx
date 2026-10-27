import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { api } from '../api.js';
import Tray from '../components/Tray.jsx';

function Range({ label, hint, value, onChange, ...r }) {
  return (
    <label className="mt-5 block">
      <span className="flex justify-between font-medium">{label}<output className="tabular-nums">{value}</output></span>
      <input type="range" className="mt-1 w-full accent-tray" value={value} onChange={(e) => onChange(Number(e.target.value))} {...r} />
      <span className="text-sm text-mute">{hint}</span>
    </label>
  );
}

export default function Studio() {
  const { state } = useLocation();
  const [f, setF] = useState({
    prompt: '', negative: '', steps: 25, guidance: 7.5, loraScale: 1, seed: '',
    ...state?.settings, ...(state?.prompt && { prompt: state.prompt }),
  });
  const [busy, setBusy] = useState(false);
  const [secs, setSecs] = useState(0);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  const set = (k) => (v) => setF((o) => ({ ...o, [k]: v }));

  useEffect(() => {
    if (!busy) return;
    setSecs(0);
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [busy]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr(''); setRes(null);
    try {
