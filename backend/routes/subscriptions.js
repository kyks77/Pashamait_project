const express = require('express');
const { getDb } = require('../db/database');
const { authRequired, logActivity } = require('../middleware/auth');
const { sanitizeUser } = require('./auth');

const router = express.Router();

const PLANS = {
  monthly: { label: 'Monthly', price: 9, interval: 'month' },
  yearly: { label: 'Yearly', price: 79, interval: 'year' }
};

router.get('/plans', (_req, res) => {
  res.json({ plans: PLANS });
});

router.get('/status', authRequired, (req, res) => {
  res.json({ subscription: sanitizeUser(req.user).subscription, hasActive: sanitizeUser(req.user).hasActiveSubscription });
});

// Dev/demo activation - in production, wire to Stripe Checkout + webhooks
router.post('/activate', authRequired, (req, res) => {
  const { plan } = req.body || {};
  if (!PLANS[plan]) {
    return res.status(400).json({ error: 'Invalid plan. Choose monthly or yearly.' });
  }

  const expires = new Date();
  if (plan === 'monthly') expires.setMonth(expires.getMonth() + 1);
  else expires.setFullYear(expires.getFullYear() + 1);

  getDb().prepare(`
    UPDATE users SET
      subscription_status = 'active',
      subscription_plan = ?,
      subscription_expires_at = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(plan, expires.toISOString(), req.user.id);

  logActivity(req.user.id, 'subscription_activate', plan, req.ip);

  const updated = getDb().prepare(
    'SELECT id, email, display_name, role, status, subscription_status, subscription_plan, subscription_expires_at FROM users WHERE id = ?'
  ).get(req.user.id);

  res.json({ user: sanitizeUser(updated), message: `${PLANS[plan].label} subscription activated.` });
});

router.post('/cancel', authRequired, (req, res) => {
  getDb().prepare(`
    UPDATE users SET
      subscription_status = 'cancelled',
      updated_at = datetime('now')
    WHERE id = ?
  `).run(req.user.id);

  logActivity(req.user.id, 'subscription_cancel', null, req.ip);
  res.json({ ok: true, message: 'Subscription cancelled. Access continues until expiry.' });
});

module.exports = router;
