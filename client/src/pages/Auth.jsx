import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function Auth({ mode }) {
  const reg = mode === 'register';
  const { login } = useAuth();
  const nav = useNavigate();
  const from = useLocation().state?.from;
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    setErr(''); setBusy(true);
    try {
      login(await api('/auth/' + mode, { method: 'POST', body: { email: d.get('email'), password: d.get('password') } }));
      nav(from?.pathname || '/studio', { replace: true, state: from?.state });
    } catch (e) { setErr(e.message); setBusy(false); }
  }
