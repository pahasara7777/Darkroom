const token = () => { try { return localStorage.getItem('token'); } catch { return null; } };

export async function api(path, { method = 'GET', body } = {}) {
  const t = token();
  const r = await fetch('/api' + path, {
    method,
    headers: { ...(body && { 'Content-Type': 'application/json' }), ...(t && { Authorization: 'Bearer ' + t }) },
    body: body && JSON.stringify(body),
  });
  const data = r.status === 204 ? null : await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401 && t) window.dispatchEvent(new Event('unauthorized'));
    throw Object.assign(new Error(data?.error || 'Something went wrong. Try again.'), { status: r.status });
  }
  return data;
}
