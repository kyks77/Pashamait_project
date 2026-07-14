const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authRequired(req, res, next) {
  const token = req.cookies?.novo_token;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = getDb().prepare(
      'SELECT id, email, display_name, role, status, subscription_status, subscription_plan, subscription_expires_at FROM users WHERE id = ?'
    ).get(payload.id);

    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended. Contact support.' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

function adminRequired(req, res, next) {
  authRequired(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

function subscriptionRequired(req, res, next) {
  authRequired(req, res, () => {
    if (req.user.role === 'admin') return next();

    const active = req.user.subscription_status === 'active';
    const notExpired = !req.user.subscription_expires_at ||
      new Date(req.user.subscription_expires_at) > new Date();

    if (!active || !notExpired) {
      return res.status(402).json({
        error: 'Active subscription required',
        subscription_status: req.user.subscription_status
      });
    }
    next();
  });
}

function logActivity(userId, action, details, ip) {
  getDb().prepare(
    'INSERT INTO activity_log (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)'
  ).run(userId, action, details || null, ip || null);
}

module.exports = { signToken, authRequired, adminRequired, subscriptionRequired, logActivity };
