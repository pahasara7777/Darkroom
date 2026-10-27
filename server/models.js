import mongoose from 'mongoose';

export const User = mongoose.model('User', new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  hash: { type: String, required: true },
}, { timestamps: true }));

export const Image = mongoose.model('Image', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  prompt: String, negative: String, steps: Number, guidance: Number, loraScale: Number, seed: Number,
  data: { type: Buffer, select: false }, // PNG bytes; shortcut: stored in Mongo (Atlas M0 = 512 MB), move to object storage when it fills
}, { timestamps: true }));
