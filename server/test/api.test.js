import test, { before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import mongoose from 'mongoose';

// Fake models: the sandbox cannot download a MongoDB binary, so Mongo itself is not exercised here.
const users = [], images = [];
const oid = () => new mongoose.Types.ObjectId().toString();
mock.module(new URL('../models.js', import.meta.url).href, { namedExports: {
  User: {
    exists: async (q) => users.find((u) => u.email === q.email) ? { _id: 1 } : null,
    create: async (d) => { const u = { id: oid(), ...d }; users.push(u); return u; },
    findOne: async (q) => users.find((u) => u.email === q.email) || null,
  },
  Image: {
    create: async (d) => { const i = { id: oid(), createdAt: new Date(), ...d }; images.push(i); return i; },
    findById: (id) => ({ select: async () => images.find((i) => i.id === id) || null }),
    find: (q) => ({ sort: () => ({ limit: async () => images.filter((i) => i.user === q.user).reverse() }) }),
    findOneAndDelete: async (q) => { const k = images.findIndex((i) => i.id === q._id && i.user === q.user); return k < 0 ? null : images.splice(k, 1)[0]; },
  },
} });

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
let ai, srv, base, seen;

before(async () => {
  ai = http.createServer((req, res) => {
    let b = ''; req.on('data', (c) => (b += c)).on('end', () => { seen = JSON.parse(b); res.writeHead(200, { 'Content-Type': 'image/png' }).end(PNG); });
  }).listen(0);
  process.env.JWT_SECRET = 'test-secret';
  process.env.IMAGE_API_URL = `http://127.0.0.1:${ai.address().port}/generate`;
  const { app } = await import('../app.js');
  srv = app.listen(0); base = `http://127.0.0.1:${srv.address().port}/api`;
});
after(() => { srv.close(); ai.close(); });

const call = (path, { method = 'GET', body, token } = {}) => fetch(base + path, {
  method, headers: { 'Content-Type': 'application/json', ...(token && { Authorization: 'Bearer ' + token }) },
  body: body && JSON.stringify(body),
});
const signup = async (email) => (await (await call('/auth/register', { method: 'POST', body: { email, password: 'longenough1' } })).json()).token;

test('auth rules', async () => {
  assert.equal((await call('/auth/register', { method: 'POST', body: { email: 'bad', password: 'longenough1' } })).status, 400);
  assert.equal((await call('/auth/register', { method: 'POST', body: { email: 'a@b.co', password: 'short' } })).status, 400);
  await signup('dup@b.co');
  assert.equal((await call('/auth/register', { method: 'POST', body: { email: 'DUP@b.co', password: 'longenough1' } })).status, 409);
  assert.equal((await call('/auth/login', { method: 'POST', body: { email: 'dup@b.co', password: 'wrongwrong' } })).status, 401);
  assert.equal((await call('/auth/login', { method: 'POST', body: { email: 'dup@b.co', password: 'longenough1' } })).status, 200);
});

test('generate, list, delete, ownership', async () => {
  const me = await signup('me@b.co'), other = await signup('other@b.co');
  assert.equal((await call('/generate', { method: 'POST', body: { prompt: 'x' } })).status, 401);
  assert.equal((await call('/generate', { method: 'POST', token: me, body: { prompt: '  ' } })).status, 400);
  const r = await call('/generate', { method: 'POST', token: me, body: { prompt: 'a fox', steps: 999, seed: -1 } });
  assert.equal(r.status, 201);
  const img = await r.json();
  assert.equal(seen.steps, 50);                       // clamped
  assert.ok(Number.isInteger(img.seed) && img.seed >= 0); // random seed recorded
  assert.equal((await fetch(base.replace('/api', '') + img.url)).status, 200);
  assert.equal((await (await call('/images', { token: me })).json()).length, 1);
  assert.equal((await (await call('/images', { token: other })).json()).length, 0);
  assert.equal((await call('/images/' + img.id, { method: 'DELETE', token: other })).status, 404);
  assert.equal((await call('/images/' + img.id, { method: 'DELETE', token: me })).status, 204);
  assert.equal((await fetch(base.replace('/api', '') + img.url)).status, 404);
});
