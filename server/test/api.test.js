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
