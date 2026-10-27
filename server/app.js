import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { randomUUID, randomInt } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { User, Image } from './models.js';

const { JWT_SECRET, IMAGE_API_URL = 'http://127.0.0.1:8000/generate' } = process.env;
if (!JWT_SECRET) throw new Error('JWT_SECRET is required');

const here = path.dirname(fileURLToPath(import.meta.url));
const uploads = path.join(here, 'uploads');
await fs.mkdir(uploads, { recursive: true });

const num = (v, min, max, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d; };
const fail = (res, code, error) => res.status(code).json({ error });
const dto = (i) => ({
  id: i.id, url: '/uploads/' + i.file, prompt: i.prompt, negative: i.negative,
  steps: i.steps, guidance: i.guidance, loraScale: i.loraScale, seed: i.seed, createdAt: i.createdAt,
});
const session = (u) => ({ token: jwt.sign({ sub: u.id }, JWT_SECRET, { expiresIn: '7d' }), user: { email: u.email } });

function requireAuth(req, res, next) {
  try {
    req.uid = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), JWT_SECRET).sub;
    next();
  } catch { fail(res, 401, 'Sign in to continue.'); }
}

export const app = express();
app.use(express.json({ limit: '10kb' }));

const authLimit = rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: true, legacyHeaders: false });
// shortcut: in-memory limiter, one server process only; switch to a Redis store when you run several
const genLimit = rateLimit({ windowMs: 60_000, limit: 6, keyGenerator: (req) => req.uid, standardHeaders: true, legacyHeaders: false });

app.post('/api/auth/register', authLimit, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail(res, 400, 'Enter a valid email address.');
  if (password.length < 8) return fail(res, 400, 'Use at least 8 characters for your password.');
  if (await User.exists({ email })) return fail(res, 409, 'An account with this email already exists.');
  res.status(201).json(session(await User.create({ email, hash: await bcrypt.hash(password, 10) })));
});

app.post('/api/auth/login', authLimit, async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email || '').trim().toLowerCase() });
  if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.hash))) return fail(res, 401, 'Email or password is wrong.');
  res.json(session(user));
});

app.post('/api/generate', requireAuth, genLimit, async (req, res) => {
  const b = req.body;
  const prompt = String(b.prompt || '').trim().slice(0, 500);
  if (!prompt) return fail(res, 400, 'Write a prompt first.');
  const p = {
    prompt,
    negative: String(b.negative || '').slice(0, 500),
    steps: Math.round(num(b.steps, 10, 50, 25)),
    guidance: num(b.guidance, 1, 15, 7.5),
    loraScale: num(b.loraScale, 0, 1.5, 1),
    seed: Number.isInteger(b.seed) && b.seed >= 0 ? b.seed : randomInt(2 ** 31), // stored so any print can be repeated
  };
  let png;
  try {
    const r = await fetch(IMAGE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: p.prompt, negative: p.negative, steps: p.steps, guidance: p.guidance, lora_scale: p.loraScale, seed: p.seed }),
      signal: AbortSignal.timeout(300_000),
    });
    if (!r.ok) throw new Error(r.status);
    png = Buffer.from(await r.arrayBuffer());
  } catch { return fail(res, 502, 'The image service is not responding. Try again in a moment.'); }
  const file = randomUUID() + '.png';
  await fs.writeFile(path.join(uploads, file), png);
  res.status(201).json(dto(await Image.create({ user: req.uid, ...p, file })));
});

// shortcut: newest 100 only, add paging when galleries outgrow that
app.get('/api/images', requireAuth, async (req, res) => {
  res.json((await Image.find({ user: req.uid }).sort({ createdAt: -1 }).limit(100)).map(dto));
});

app.delete('/api/images/:id', requireAuth, async (req, res) => {
  const img = mongoose.isValidObjectId(req.params.id) && await Image.findOneAndDelete({ _id: req.params.id, user: req.uid });
  if (!img) return fail(res, 404, 'Image not found.');
  await fs.rm(path.join(uploads, img.file), { force: true });
  res.sendStatus(204);
});

app.use('/uploads', express.static(uploads, { maxAge: '7d', immutable: true })); // unguessable filenames
const dist = path.join(here, '../client/dist');
app.use(express.static(dist));
app.use((req, res, next) => req.path.startsWith('/api') ? next() : res.sendFile(path.join(dist, 'index.html'), (e) => e && next()));

app.use((err, req, res, next) => {
  if (err.code === 11000) return fail(res, 409, 'An account with this email already exists.');
  if (err.status >= 400 && err.status < 500) return fail(res, err.status, 'Bad request.');
  console.error(err);
  fail(res, 500, 'Something went wrong on our side.');
});
