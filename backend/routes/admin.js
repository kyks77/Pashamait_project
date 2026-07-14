const express = require('express');
const { getDb } = require('../db/database');
const { adminRequired, logActivity } = require('../middleware/auth');
const { sanitizeUser } = require('./auth');

const router = express.Router();

router.use(adminRequired);

router.get('/users', (req, res) => {
  const { status, search } = req.query;
  let sql = `
    SELECT id, email, display_name, role, status, subscription_status, subscription_plan,
           subscription_expires_at, created_at, updated_at
    FROM users WHERE role != 'admin'
  `;
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    sql += ' AND (email LIKE ? OR display_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY created_at DESC LIMIT 200';

  const users = getDb().prepare(sql).all(...params);
  res.json({
    users: users.map(u => ({
      ...sanitizeUser(u),
      createdAt: u.created_at,
      updatedAt: u.updated_at
    }))
  });
});

router.get('/stats', (_req, res) => {
  const db = getDb();
  const total = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'user'").get().c;
  const active = db.prepare("SELECT COUNT(*) as c FROM users WHERE subscription_status = 'active'").get().c;
  const suspended = db.prepare("SELECT COUNT(*) as c FROM users WHERE status = 'suspended'").get().c;
  res.json({ totalUsers: total, activeSubscriptions: active, suspendedAccounts: suspended });
});

router.patch('/users/:id/status', (req, res) => {
  const { status } = req.body || {};
  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Status must be active or suspended' });
  }

  const user = getDb().prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin') return res.status(403).json({ error: 'Cannot modify admin accounts' });

  getDb().prepare("UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);
  logActivity(req.user.id, 'admin_status_change', `${req.params.id}:${status}`, req.ip);

  res.json({ ok: true, status });
});

router.patch('/users/:id/subscription', (req, res) => {
  const { status, plan, expiresAt } = req.body || {};
  const user = getDb().prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin') return res.status(403).json({ error: 'Cannot modify admin accounts' });

  getDb().prepare(`
    UPDATE users SET
      subscription_status = COALESCE(?, subscription_status),
      subscription_plan = COALESCE(?, subscription_plan),
      subscription_expires_at = COALESCE(?, subscription_expires_at),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(status || null, plan || null, expiresAt || null, req.params.id);

  logActivity(req.user.id, 'admin_subscription_change', req.params.id, req.ip);
  res.json({ ok: true });
});

router.get('/activity', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const rows = getDb().prepare(`
    SELECT a.id, a.user_id, a.action, a.details, a.ip_address, a.created_at, u.email
    FROM activity_log a
    LEFT JOIN users u ON u.id = a.user_id
    ORDER BY a.created_at DESC
    LIMIT ?
  `).all(limit);

  res.json({ activity: rows });
});

module.exports = router;
