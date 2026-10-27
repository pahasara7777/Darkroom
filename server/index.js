import mongoose from 'mongoose';
import { app } from './app.js';

await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/darkroom');
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server on http://localhost:${port}`));
