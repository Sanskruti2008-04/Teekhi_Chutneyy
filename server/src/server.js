import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(s => s.trim()) : true }));
app.use(express.json({ limit: '15mb' }));
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'CivicFix Sentinel API' }));
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use(errorHandler);

const port = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  if (!process.env.MONGODB_URI) console.warn('MONGODB_URI is missing.');
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicfix')
    .then(() => app.listen(port, () => console.log(`CivicFix API listening on ${port}`)))
    .catch(err => { console.error('MongoDB connection failed:', err.message); process.exit(1); });
}
export default app;
