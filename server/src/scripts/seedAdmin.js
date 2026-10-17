import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || '');
const name = String(process.env.ADMIN_NAME || 'CivicFix Administrator').trim();
if (!email || password.length < 12) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in server/.env before seeding.');
  process.exit(1);
}
try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicfix');
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.findOneAndUpdate({ email }, { $set: { name, passwordHash, role: 'admin' }, $setOnInsert: { email } }, { upsert: true, new: true, runValidators: true });
  console.log(`Admin account ready: ${user.email}`);
} catch (error) {
  console.error('Could not seed admin:', error.message);
  process.exitCode = 1;
} finally { await mongoose.disconnect(); }
