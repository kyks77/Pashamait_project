const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');
const { authRequired, logActivity } = require('../middleware/auth');
const { sanitizeUser } = require('./auth');

const router = express.Router();

router.get('/profile', authRequired, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

router.patch('/profile', authRequired, (req, res) => {
  const { displayName, email, currentPassword, newPassword } = req.body || {};
  const db = getDb();
  const full = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (email && email.toLowerCase().trim() !== full.email) {
    const taken = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.toLowerCase().trim(), full.id);
    if (taken) return res.status(409).json({ error: 'Email already in use' });
  }

  if (newPassword) {
    if (!currentPassword || !bcrypt.compareSync(currentPassword, full.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
  }

  const updates = [];
  const params = [];

  if (displayName !== undefined) {
    updates.push('display_name = ?');
    params.push(displayName?.trim() || null);
  }
  if (email) {
    updates.push('email = ?');
    params.push(email.toLowerCase().trim());
  }
  if (newPassword) {
    updates.push('password_hash = ?');
    params.push(bcrypt.hashSync(newPassword, 12));
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No changes provided' });
  }

  updates.push("updated_at = datetime('now')");
  params.push(full.id);

  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  logActivity(full.id, 'profile_update', null, req.ip);

  const updated = db.prepare(
    'SELECT id, email, display_name, role, status, subscription_status, subscription_plan, subscription_expires_at FROM users WHERE id = ?'
  ).get(full.id);

  res.json({ user: sanitizeUser(updated) });
});

module.exports = router;
