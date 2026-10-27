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

  return (
    <form onSubmit={submit} className="mx-auto mt-10 max-w-sm rounded-lg border-2 border-ink bg-print p-6">
      <h1 className="display text-3xl">{reg ? 'Create account' : 'Sign in'}</h1>
      <label className="mt-6 block font-medium" htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required autoComplete="email" className="field mt-1" />
      <label className="mt-4 block font-medium" htmlFor="pw">Password</label>
      <input id="pw" name="password" type="password" required minLength={reg ? 8 : undefined}
        autoComplete={reg ? 'new-password' : 'current-password'} className="field mt-1" />
      {reg && <p className="mt-1 text-sm text-mute">Use at least 8 characters.</p>}
      {err && <p role="alert" className="mt-4 font-medium text-red-800">{err}</p>}
      <button disabled={busy} className="mt-6 w-full rounded-md bg-ink px-4 py-3 font-bold text-print disabled:opacity-60">
        {busy ? 'Please wait…' : reg ? 'Create account' : 'Sign in'}
      </button>
      <p className="mt-4 text-center text-mute">
        {reg ? 'Already have an account? ' : 'New here? '}
        <Link className="font-medium text-tray underline" to={reg ? '/login' : '/register'} state={{ from }}>
          {reg ? 'Sign in' : 'Create account'}
        </Link>
      </p>
    </form>
  );
}
