import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}
function tokenFor(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'development-only-secret-change-me', { expiresIn: '7d' });
}
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || typeof password !== 'string' || password.length < 8)
      return res.status(400).json({ message: 'Name, email, and a password of at least 8 characters are required.' });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ message: 'An account with that email already exists.' });
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
  } catch (err) { next(err); }
}
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || '').trim().toLowerCase() }).select('+passwordHash');
    if (!user || !await bcrypt.compare(String(password || ''), user.passwordHash))
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    res.json({ token: tokenFor(user), user: publicUser(user) });
  } catch (err) { next(err); }
}
export async function me(req, res) { res.json({ user: publicUser(req.user) }); }
