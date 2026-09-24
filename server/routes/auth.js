import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,                                   // JS can't read it → XSS can't steal it
  sameSite: 'lax',                                  // basic CSRF protection
  secure: process.env.NODE_ENV === 'production',    // HTTPS-only in prod
  maxAge: 7 * 24 * 60 * 60 * 1000,                  // 7 days
};

function setAuthCookie(res, user) {
  const token = jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.cookie('token', token, COOKIE_OPTIONS);
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    // Hash BEFORE storing — plaintext password never touches the database
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    console.log("Created User Successfully")
    setAuthCookie(res, user);
    res.status(201).json({ user }); // toJSON transform already stripped passwordHash
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    // Same vague message for both cases — never reveal whether an email exists
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    setAuthCookie(res, user);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ message: 'User no longer exists' });
  res.json({ user });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

export default router;