const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { signToken, authRequired, logActivity } = require('../middleware/auth');

const router = express.Router();

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
};

router.post('/register', (req, res) => {
  const { email, password, displayName } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const normalized = email.toLowerCase().trim();
  const existing = getDb().prepare('SELECT id FROM users WHERE email = ?').get(normalized);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const id = uuidv4();
  const hash = bcrypt.hashSync(password, 12);
  getDb().prepare(`
    INSERT INTO users (id, email, password_hash, display_name)
    VALUES (?, ?, ?, ?)
  `).run(id, normalized, hash, displayName?.trim() || null);

  const user = getDb().prepare(
    'SELECT id, email, display_name, role, status, subscription_status, subscription_plan, subscription_expires_at FROM users WHERE id = ?'
  ).get(id);

  const token = signToken(user);
  res.cookie('novo_token', token, COOKIE_OPTS);
  logActivity(id, 'register', null, req.ip);
  res.status(201).json({ user: sanitizeUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = getDb().prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Account suspended. Contact support.' });
  }

  const token = signToken(user);
  res.cookie('novo_token', token, COOKIE_OPTS);
  logActivity(user.id, 'login', null, req.ip);

  const safe = getDb().prepare(
    'SELECT id, email, display_name, role, status, subscription_status, subscription_plan, subscription_expires_at FROM users WHERE id = ?'
  ).get(user.id);

  res.json({ user: sanitizeUser(safe) });
});

router.post('/logout', (req, res) => {
  res.clearCookie('novo_token', { path: '/' });
  res.json({ ok: true });
});

router.get('/me', authRequired, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

function sanitizeUser(u) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.display_name,
    role: u.role,
    status: u.status,
    subscription: {
      status: u.subscription_status,
      plan: u.subscription_plan,
      expiresAt: u.subscription_expires_at
    },
    hasActiveSubscription: isSubscriptionActive(u)
  };
}

function isSubscriptionActive(u) {
  if (u.role === 'admin') return true;
  if (u.subscription_status !== 'active') return false;
  if (!u.subscription_expires_at) return true;
  return new Date(u.subscription_expires_at) > new Date();
}

module.exports = router;
module.exports.sanitizeUser = sanitizeUser;
module.exports.isSubscriptionActive = isSubscriptionActive;
