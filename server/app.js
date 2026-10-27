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
