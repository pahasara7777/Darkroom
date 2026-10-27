import mongoose from 'mongoose';
import { app } from '../server/app.js';

// Vercel entry: connect once per warm instance, then let Express handle the request.
export default async (req, res) => {
  await mongoose.connect(process.env.MONGO_URI);
  return app(req, res);
};
