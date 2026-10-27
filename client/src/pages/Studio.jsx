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
      setRes(await api('/generate', { method: 'POST', body: { ...f, seed: f.seed === '' ? -1 : Number(f.seed) } }));
    } catch (e) {
      setErr(e.status === 429 ? 'You are generating too fast. Wait a minute and try again.' : e.message);
    }
    setBusy(false);
  }

  return (
    <div className="grid gap-8 py-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <motion.form initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} onSubmit={submit} className="rounded-lg border-2 border-ink bg-print p-5">
        <label htmlFor="prompt" className="block font-medium">Prompt</label>
        <textarea id="prompt" rows={4} required maxLength={500} value={f.prompt} onChange={(e) => set('prompt')(e.target.value)} className="field mt-1" />
        <label htmlFor="neg" className="mt-4 block font-medium">Leave out</label>
        <input id="neg" maxLength={500} value={f.negative} onChange={(e) => set('negative')(e.target.value)} className="field mt-1" placeholder="blurry, extra fingers, text" />
        <Range label="Steps" min={10} max={50} step={1} value={f.steps} onChange={set('steps')} hint="More steps add detail but take longer." />
        <Range label="Guidance" min={1} max={15} step={0.5} value={f.guidance} onChange={set('guidance')} hint="How closely the image follows your words. Very high values look stiff." />
        <Range label="LoRA strength" min={0} max={1.5} step={0.05} value={f.loraScale} onChange={set('loraScale')} hint="0 is the base model. 1 is your trained style at full strength." />
        <label htmlFor="seed" className="mt-5 block font-medium">Seed</label>
        <input id="seed" type="number" min={0} step={1} value={f.seed} onChange={(e) => set('seed')(e.target.value)} className="field mt-1" placeholder="Random" />
        <p className="text-sm text-mute">The same seed and settings give the same picture.</p>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} disabled={busy} className="mt-6 w-full rounded-md bg-safelight px-4 py-3 font-bold text-ink hover:brightness-95 disabled:opacity-60">
          {busy ? 'Developing…' : 'Develop image'}
        </motion.button>
        {err && <p role="alert" className="mt-4 font-medium text-red-800">{err}</p>}
      </motion.form>

      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
        <Tray key={res?.id} busy={busy} secs={secs} image={res} />
        {res && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="mt-4 flex flex-wrap items-center gap-3">
            <a href={res.url} download className="rounded-md bg-ink px-4 py-2 font-medium text-print">Download</a>
            <Link to="/gallery" className="rounded-md px-4 py-2 font-medium underline">Open gallery</Link>
            <span className="text-mute">Seed {res.seed}</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
